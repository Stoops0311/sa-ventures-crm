import type { QueryCtx, MutationCtx } from "../_generated/server"
import type { Doc } from "../_generated/dataModel"

type Role = "admin" | "salesperson" | "dsm" | "hr" | "vehicle"

function getRoleFromIdentity(
  identity: Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>
): Role | null {
  if (!identity) return null
  const metadata = (identity as Record<string, unknown>)
    .metadata as { role?: string } | undefined
  return (metadata?.role as Role) ?? null
}

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthenticated")
  return identity
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  role: Role
) {
  const identity = await requireAuth(ctx)
  const userRole = getRoleFromIdentity(identity)
  if (userRole !== role) {
    throw new Error(`Unauthorized: requires ${role} role`)
  }
  return identity
}

export async function requireAnyRole(
  ctx: QueryCtx | MutationCtx,
  roles: Role[]
) {
  const identity = await requireAuth(ctx)
  const userRole = getRoleFromIdentity(identity)
  if (!userRole || !roles.includes(userRole)) {
    throw new Error(
      `Unauthorized: requires one of ${roles.join(", ")}`
    )
  }
  return identity
}

/**
 * Resolves the current Clerk identity to a Convex user document.
 * Returns null if not authenticated or user record not yet synced.
 * Use this for queries that run reactively -- they'll re-run once
 * the webhook syncs the user.
 */
export async function getUserOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) return null
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) =>
      q.eq("externalId", identity.subject)
    )
    .unique()
}

/**
 * Resolves the current Clerk identity to a Convex user document.
 * If authenticated but user record is missing (webhook hasn't fired yet),
 * auto-creates the user from the Clerk identity.
 * Throws only if not authenticated at all.
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new Error("Unauthenticated")

  const existing = await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) =>
      q.eq("externalId", identity.subject)
    )
    .unique()

  if (existing) return existing

  // Auto-create user from Clerk identity (webhook may not have fired yet)
  // Only works in mutation context (ctx.db.insert)
  const mutCtx = ctx as MutationCtx
  if (!mutCtx.db?.insert) {
    // In a query context, can't insert -- return null would break the contract
    throw new Error("User record not found in database")
  }

  const role =
    (identity as Record<string, unknown> & { metadata?: { role?: string } })
      .metadata?.role ?? "dsm"

  const userId = await mutCtx.db.insert("users", {
    name: identity.name ?? "Unknown",
    email: identity.email,
    externalId: identity.subject,
    imageUrl: identity.pictureUrl,
    role,
    isAvailable: true,
    createdAt: Date.now(),
  })

  const user = await mutCtx.db.get(userId)
  return user!
}

/**
 * Resolves identity to user doc AND checks their role from the DB.
 * Returns null if user not yet synced (for queries).
 */
export async function getUserWithRole(
  ctx: QueryCtx | MutationCtx,
  role: Role
): Promise<Doc<"users"> | null> {
  const user = await getUserOrNull(ctx)
  if (!user) return null
  if (user.role !== role) return null
  return user
}

/**
 * Resolves identity to user doc AND checks their role from the DB.
 * Throws if not found or wrong role (for mutations).
 */
export async function requireUserWithRole(
  ctx: QueryCtx | MutationCtx,
  role: Role
): Promise<Doc<"users">> {
  const user = await requireUser(ctx)
  if (user.role !== role) {
    throw new Error(`Unauthorized: requires ${role} role`)
  }
  return user
}

/**
 * Returns user doc if authenticated and has one of the allowed roles.
 * Returns null if user not yet synced (for queries).
 */
export async function getUserWithAnyRole(
  ctx: QueryCtx | MutationCtx,
  roles: Role[]
): Promise<Doc<"users"> | null> {
  const user = await getUserOrNull(ctx)
  if (!user) return null
  if (!roles.includes(user.role as Role)) return null
  return user
}

/**
 * Throws if not found or wrong role (for mutations).
 */
export async function requireUserWithAnyRole(
  ctx: QueryCtx | MutationCtx,
  roles: Role[]
): Promise<Doc<"users">> {
  const user = await requireUser(ctx)
  if (!roles.includes(user.role as Role)) {
    throw new Error(
      `Unauthorized: requires one of ${roles.join(", ")}`
    )
  }
  return user
}
