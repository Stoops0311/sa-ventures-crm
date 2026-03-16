import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserOrNull, getUserWithAnyRole, requireUser, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { isValidHrQueryType, isValidHrQueryStatus } from "./lib/constants"

// ── Queries ─────────────────────────────────────────────────────

export const listAll = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return []

    let queries
    if (args.status) {
      queries = await ctx.db
        .query("hrQueries")
        .withIndex("byStatus", (q) => q.eq("status", args.status!))
        .collect()
    } else {
      queries = await ctx.db.query("hrQueries").collect()
    }

    // Filter by type if specified
    if (args.type) {
      queries = queries.filter((q) => q.type === args.type)
    }

    // Sort: open first, then in_progress, then by createdAt desc
    const statusOrder: Record<string, number> = { open: 0, in_progress: 1, resolved: 2, rejected: 3 }
    queries.sort((a, b) => {
      const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
      if (statusDiff !== 0) return statusDiff
      return b.createdAt - a.createdAt
    })

    // Batch-fetch user data
    const userIds = [...new Set(queries.map((q) => q.userId))]
    const resolverIds = [...new Set(queries.filter((q) => q.resolvedBy).map((q) => q.resolvedBy!))]
    const allUserIds = [...new Set([...userIds, ...resolverIds])]
    const users = await Promise.all(allUserIds.map((id) => ctx.db.get(id)))
    const userMap = new Map(allUserIds.map((id, i) => [id, users[i]]))

    return queries.map((q) => {
      const empUser = userMap.get(q.userId)
      const resolver = q.resolvedBy ? userMap.get(q.resolvedBy) : null
      return {
        ...q,
        employeeName: empUser?.name ?? "Unknown",
        employeeImageUrl: empUser?.imageUrl ?? null,
        resolvedByName: resolver?.name ?? null,
      }
    })
  },
})

export const listByUser = query({
  handler: async (ctx) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []

    const queries = await ctx.db
      .query("hrQueries")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect()

    queries.sort((a, b) => b.createdAt - a.createdAt)

    // Fetch resolver names
    const resolverIds = [...new Set(queries.filter((q) => q.resolvedBy).map((q) => q.resolvedBy!))]
    const resolvers = await Promise.all(resolverIds.map((id) => ctx.db.get(id)))
    const resolverMap = new Map(resolverIds.map((id, i) => [id, resolvers[i]]))

    return queries.map((q) => ({
      ...q,
      resolvedByName: q.resolvedBy ? resolverMap.get(q.resolvedBy)?.name ?? null : null,
    }))
  },
})

export const getById = query({
  args: { queryId: v.id("hrQueries") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null

    const hrQuery = await ctx.db.get(args.queryId)
    if (!hrQuery) return null

    const isHROrAdmin = user.role === "hr" || user.role === "admin"
    if (!isHROrAdmin && user._id !== hrQuery.userId) return null

    const empUser = await ctx.db.get(hrQuery.userId)
    const resolver = hrQuery.resolvedBy ? await ctx.db.get(hrQuery.resolvedBy) : null

    return {
      ...hrQuery,
      employeeName: empUser?.name ?? "Unknown",
      employeeImageUrl: empUser?.imageUrl ?? null,
      resolvedByName: resolver?.name ?? null,
    }
  },
})

export const getStats = query({
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return null

    const allQueries = await ctx.db.query("hrQueries").collect()

    const open = allQueries.filter((q) => q.status === "open").length
    const inProgress = allQueries.filter((q) => q.status === "in_progress").length

    // Resolved today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const resolvedToday = allQueries.filter(
      (q) => (q.status === "resolved" || q.status === "rejected") &&
        q.resolvedAt && q.resolvedAt >= todayStart.getTime()
    ).length

    // New today
    const newToday = allQueries.filter(
      (q) => q.createdAt >= todayStart.getTime()
    ).length

    return { open, inProgress, resolvedToday, newToday }
  },
})

// ── Mutations ───────────────────────────────────────────────────

export const submit = mutation({
  args: {
    type: v.string(),
    subject: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    if (!isValidHrQueryType(args.type)) {
      throw new Error(`Invalid query type: ${args.type}`)
    }

    if (!args.subject.trim()) throw new Error("Subject is required")
    if (!args.description.trim()) throw new Error("Description is required")

    const now = Date.now()
    const queryId = await ctx.db.insert("hrQueries", {
      userId: user._id,
      type: args.type,
      subject: args.subject.trim(),
      description: args.description.trim(),
      status: "open",
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "hr_query",
      entityId: queryId,
      action: "hr_query_submitted",
      details: { type: args.type, subject: args.subject.trim() },
      performedBy: user._id,
    })

    return queryId
  },
})

export const updateStatus = mutation({
  args: {
    queryId: v.id("hrQueries"),
    status: v.string(),
    resolutionNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    if (!isValidHrQueryStatus(args.status)) {
      throw new Error(`Invalid query status: ${args.status}`)
    }

    const hrQuery = await ctx.db.get(args.queryId)
    if (!hrQuery) throw new Error("Query not found")

    const now = Date.now()
    const updates: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    }

    if (args.status === "resolved" || args.status === "rejected") {
      updates.resolvedBy = user._id
      updates.resolvedAt = now
      if (args.resolutionNote) {
        updates.resolutionNote = args.resolutionNote.trim()
      }
    }

    await ctx.db.patch(args.queryId, updates)

    const empUser = await ctx.db.get(hrQuery.userId)
    await logActivity(ctx, {
      entityType: "hr_query",
      entityId: args.queryId,
      action: `hr_query_${args.status}`,
      details: {
        employeeName: empUser?.name,
        type: hrQuery.type,
        resolutionNote: args.resolutionNote?.trim(),
      },
      performedBy: user._id,
    })
  },
})
