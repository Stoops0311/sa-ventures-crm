import { query } from "./_generated/server"
import { v } from "convex/values"
import { paginationOptsValidator } from "convex/server"
import { getUserOrNull, getUserWithRole, getUserWithAnyRole } from "./lib/auth"

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "hr"])
    if (!user) return []

    const limit = args.limit ?? 20

    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("byTimestamp")
      .order("desc")
      .take(limit)

    // Join with user names for performedBy
    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        const performer = await ctx.db.get(log.performedBy)
        return {
          ...log,
          performedByName: performer?.name ?? "Unknown",
          performedByImageUrl: performer?.imageUrl,
        }
      })
    )

    return logsWithUsers
  },
})

export const listByEntity = query({
  args: {
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    // Any authenticated user can view, but role-appropriate access
    // is enforced at the entity level (e.g. lead access checks)
    const user = await getUserOrNull(ctx)
    if (!user) return []

    const logs = await ctx.db
      .query("activityLogs")
      .withIndex("byEntityId", (q) => q.eq("entityId", args.entityId))
      .order("desc")
      .collect()

    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        const performer = await ctx.db.get(log.performedBy)
        return {
          ...log,
          performedByName: performer?.name ?? "Unknown",
          performedByImageUrl: performer?.imageUrl,
        }
      })
    )

    return logsWithUsers
  },
})

export const listByUser = query({
  args: {
    userId: v.id("users"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const adminUser = await getUserWithRole(ctx, "admin")
    if (!adminUser) return { page: [], isDone: true, continueCursor: "" }

    const results = await ctx.db
      .query("activityLogs")
      .withIndex("byPerformedBy", (q) => q.eq("performedBy", args.userId))
      .order("desc")
      .paginate(args.paginationOpts)

    const logsWithUsers = await Promise.all(
      results.page.map(async (log) => {
        const performer = await ctx.db.get(log.performedBy)
        return {
          ...log,
          performedByName: performer?.name ?? "Unknown",
          performedByImageUrl: performer?.imageUrl,
        }
      })
    )

    return {
      ...results,
      page: logsWithUsers,
    }
  },
})
