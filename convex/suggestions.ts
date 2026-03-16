import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserOrNull, getUserWithAnyRole, requireUser, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { isValidSuggestionStatus, isValidSuggestionCategory } from "./lib/constants"

// ── Queries ─────────────────────────────────────────────────────

export const listAll = query({
  args: {
    status: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return []

    let suggestions
    if (args.status) {
      suggestions = await ctx.db
        .query("suggestions")
        .withIndex("byStatus", (q) => q.eq("status", args.status!))
        .collect()
    } else {
      suggestions = await ctx.db.query("suggestions").collect()
    }

    if (args.category) {
      suggestions = suggestions.filter((s) => s.category === args.category)
    }

    // Sort newest first
    suggestions.sort((a, b) => b.createdAt - a.createdAt)

    // Batch-fetch user data for non-anonymous, and reviewers
    const namedUserIds = suggestions.filter((s) => !s.isAnonymous && s.userId).map((s) => s.userId!)
    const reviewerIds = suggestions.filter((s) => s.reviewedBy).map((s) => s.reviewedBy!)
    const allUserIds = [...new Set([...namedUserIds, ...reviewerIds])]
    const users = await Promise.all(allUserIds.map((id) => ctx.db.get(id)))
    const userMap = new Map(allUserIds.map((id, i) => [id, users[i]]))

    // Strip userId from anonymous entries
    return suggestions.map((s) => ({
      _id: s._id,
      _creationTime: s._creationTime,
      userId: s.isAnonymous ? undefined : s.userId,
      isAnonymous: s.isAnonymous,
      content: s.content,
      category: s.category,
      status: s.status,
      reviewedBy: s.reviewedBy,
      reviewNote: s.reviewNote,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      submitterName: s.isAnonymous ? null : (s.userId ? userMap.get(s.userId)?.name ?? "Unknown" : "Unknown"),
      reviewedByName: s.reviewedBy ? userMap.get(s.reviewedBy)?.name ?? null : null,
    }))
  },
})

export const listByUser = query({
  handler: async (ctx) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []

    // Only show named suggestions
    const suggestions = await ctx.db
      .query("suggestions")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect()

    const named = suggestions.filter((s) => !s.isAnonymous)
    named.sort((a, b) => b.createdAt - a.createdAt)

    // Fetch reviewer names
    const reviewerIds = [...new Set(named.filter((s) => s.reviewedBy).map((s) => s.reviewedBy!))]
    const reviewers = await Promise.all(reviewerIds.map((id) => ctx.db.get(id)))
    const reviewerMap = new Map(reviewerIds.map((id, i) => [id, reviewers[i]]))

    return named.map((s) => ({
      ...s,
      reviewedByName: s.reviewedBy ? reviewerMap.get(s.reviewedBy)?.name ?? null : null,
    }))
  },
})

export const getStats = query({
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return null

    const allSuggestions = await ctx.db.query("suggestions").collect()

    return {
      new: allSuggestions.filter((s) => s.status === "new").length,
      reviewed: allSuggestions.filter((s) => s.status === "reviewed").length,
      implemented: allSuggestions.filter((s) => s.status === "implemented").length,
      dismissed: allSuggestions.filter((s) => s.status === "dismissed").length,
      total: allSuggestions.length,
    }
  },
})

// ── Mutations ───────────────────────────────────────────────────

export const submit = mutation({
  args: {
    content: v.string(),
    isAnonymous: v.boolean(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    if (!args.content.trim()) throw new Error("Content is required")
    if (args.category && !isValidSuggestionCategory(args.category)) {
      throw new Error(`Invalid category: ${args.category}`)
    }

    const now = Date.now()
    const suggestionId = await ctx.db.insert("suggestions", {
      userId: user._id, // Always store userId internally
      isAnonymous: args.isAnonymous,
      content: args.content.trim(),
      category: args.category,
      status: "new",
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "suggestion",
      entityId: suggestionId,
      action: "suggestion_submitted",
      details: {
        isAnonymous: args.isAnonymous,
        category: args.category,
      },
      // For anonymous: still log performedBy internally, but the action name signals anonymity
      performedBy: user._id,
    })

    return suggestionId
  },
})

export const review = mutation({
  args: {
    suggestionId: v.id("suggestions"),
    status: v.string(),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    if (!isValidSuggestionStatus(args.status)) {
      throw new Error(`Invalid suggestion status: ${args.status}`)
    }

    const suggestion = await ctx.db.get(args.suggestionId)
    if (!suggestion) throw new Error("Suggestion not found")

    await ctx.db.patch(args.suggestionId, {
      status: args.status,
      reviewedBy: user._id,
      reviewNote: args.reviewNote?.trim(),
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "suggestion",
      entityId: args.suggestionId,
      action: `suggestion_${args.status}`,
      details: {
        reviewNote: args.reviewNote?.trim(),
      },
      performedBy: user._id,
    })
  },
})
