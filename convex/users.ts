import {
  internalMutation,
  internalAction,
  query,
  mutation,
  type QueryCtx,
} from "./_generated/server"
import { internal } from "./_generated/api"
import type { UserJSON } from "@clerk/backend"
import { v, type Validator } from "convex/values"
import { getUserWithRole, requireUserWithRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { ONBOARDING_CHECKLIST_ITEMS } from "./lib/constants"

export const upsertFromClerk = internalMutation({
  args: { data: v.any() as Validator<UserJSON> },
  async handler(ctx, { data }) {
    const userAttributes = {
      name:
        `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() ||
        "Unknown",
      email: data.email_addresses?.[0]?.email_address,
      externalId: data.id,
      imageUrl: data.image_url,
      role:
        (data.public_metadata as Record<string, unknown>)?.role
          ?.toString() ?? "dsm",
    }

    const existing = await userByExternalId(ctx, data.id)
    if (existing === null) {
      const userId = await ctx.db.insert("users", {
        ...userAttributes,
        isAvailable: true,
        createdAt: Date.now(),
      })

      // Auto-create employee profile + onboarding for non-DSM roles
      if (userAttributes.role !== "dsm") {
        const existingProfile = await ctx.db
          .query("employeeProfiles")
          .withIndex("byUserId", (q) => q.eq("userId", userId))
          .unique()

        if (!existingProfile) {
          const profileId = await ctx.db.insert("employeeProfiles", {
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })

          const items = ONBOARDING_CHECKLIST_ITEMS.map((item) => ({
            key: item.key,
            label: item.label,
            completedAt: null,
            completedBy: null,
          }))

          await ctx.db.insert("onboardingChecklists", {
            userId,
            employeeProfileId: profileId,
            status: "pending" as const,
            items: JSON.stringify(items),
            createdAt: Date.now(),
          })
        }
      }
    } else {
      await ctx.db.patch(existing._id, userAttributes)
    }
  },
})

export const deleteFromClerk = internalMutation({
  args: { clerkUserId: v.string() },
  async handler(ctx, { clerkUserId }) {
    const user = await userByExternalId(ctx, clerkUserId)
    if (user !== null) {
      await ctx.db.delete(user._id)
    } else {
      console.warn(
        `Can't delete user, none found for Clerk ID: ${clerkUserId}`
      )
    }
  },
})

export const current = query({
  args: {},
  handler: async (ctx) => {
    return await getCurrentUser(ctx)
  },
})

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
})

export async function getCurrentUserOrThrow(ctx: QueryCtx) {
  const userRecord = await getCurrentUser(ctx)
  if (!userRecord) throw new Error("Can't get current user")
  return userRecord
}

export async function getCurrentUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (identity === null) return null
  return await userByExternalId(ctx, identity.subject)
}

async function userByExternalId(
  ctx: QueryCtx,
  externalId: string
) {
  return await ctx.db
    .query("users")
    .withIndex("byExternalId", (q) =>
      q.eq("externalId", externalId)
    )
    .unique()
}

export const list = query({
  args: {
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await getUserWithRole(ctx, "admin")
    if (!admin) return []

    const allUsers = await ctx.db.query("users").collect()

    if (args.role) {
      return allUsers.filter((u) => u.role === args.role)
    }

    return allUsers
  },
})

export const getAvailableSalespeople = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getUserWithRole(ctx, "admin")
    if (!admin) return []

    const allUsers = await ctx.db.query("users").collect()
    return allUsers.filter(
      (u) => u.role === "salesperson" && u.isAvailable === true
    )
  },
})

export const toggleAvailability = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await requireUserWithRole(ctx, "admin")

    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error("User not found")

    await ctx.db.patch(args.userId, { isAvailable: !user.isAvailable })

    await logActivity(ctx, {
      entityType: "user",
      entityId: args.userId,
      action: "availability_toggled",
      details: {
        userName: user.name,
        isAvailable: !user.isAvailable,
      },
      performedBy: admin._id,
    })
  },
})

export const syncRoleToClerk = internalAction({
  args: { clerkUserId: v.string(), role: v.string() },
  handler: async (_ctx, { clerkUserId, role }) => {
    const res = await fetch(
      `https://api.clerk.com/v1/users/${clerkUserId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ public_metadata: { role } }),
      }
    )
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Clerk sync failed: ${res.status} ${text}`)
    }
  },
})

export const inviteUser = mutation({
  args: {
    email: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireUserWithRole(ctx, "admin")

    await ctx.scheduler.runAfter(0, internal.users.createInvitation, {
      email: args.email,
      role: args.role,
    })

    await logActivity(ctx, {
      entityType: "user",
      entityId: admin._id,
      action: "user_invited",
      details: { email: args.email, role: args.role },
      performedBy: admin._id,
    })
  },
})

export const createInvitation = internalAction({
  args: { email: v.string(), role: v.string() },
  handler: async (_ctx, { email, role }) => {
    const siteUrl = process.env.SITE_URL
    if (!siteUrl) throw new Error("SITE_URL environment variable is not set")

    const res = await fetch("https://api.clerk.com/v1/invitations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        public_metadata: { role },
        redirect_url: `${siteUrl}/sign-up`,
        notify: true,
      }),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      const message =
        (body as Record<string, unknown>)?.errors
          ? JSON.stringify((body as Record<string, unknown>).errors)
          : `${res.status} ${res.statusText}`
      throw new Error(`Failed to send invitation: ${message}`)
    }
  },
})

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireUserWithRole(ctx, "admin")

    const { userId, ...updates } = args
    const user = await ctx.db.get(userId)
    if (!user) throw new Error("User not found")

    const patch: Record<string, string> = {}
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.phone !== undefined) patch.phone = updates.phone
    if (updates.role !== undefined) patch.role = updates.role

    await ctx.db.patch(userId, patch)

    // Sync role change to Clerk so sessionClaims.metadata.role updates
    if (updates.role !== undefined) {
      await ctx.scheduler.runAfter(0, internal.users.syncRoleToClerk, {
        clerkUserId: user.externalId,
        role: updates.role,
      })

      // Auto-create employee profile + onboarding if role changed to non-DSM
      if (updates.role !== "dsm") {
        const existingProfile = await ctx.db
          .query("employeeProfiles")
          .withIndex("byUserId", (q) => q.eq("userId", userId))
          .unique()

        if (!existingProfile) {
          const profileId = await ctx.db.insert("employeeProfiles", {
            userId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })

          const items = ONBOARDING_CHECKLIST_ITEMS.map((item) => ({
            key: item.key,
            label: item.label,
            completedAt: null,
            completedBy: null,
          }))

          await ctx.db.insert("onboardingChecklists", {
            userId,
            employeeProfileId: profileId,
            status: "pending" as const,
            items: JSON.stringify(items),
            createdAt: Date.now(),
          })

          await logActivity(ctx, {
            entityType: "employee",
            entityId: profileId,
            action: "profile_auto_created",
            details: { role: updates.role },
            performedBy: admin._id,
          })
        }
      }
    }

    await logActivity(ctx, {
      entityType: "user",
      entityId: userId,
      action: "user_updated",
      details: { ...patch, userName: user.name },
      performedBy: admin._id,
    })
  },
})
