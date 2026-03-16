import { v } from "convex/values"
import { query, mutation } from "./_generated/server"
import {
  getUserWithAnyRole,
  requireUserWithAnyRole,
  getUserWithRole,
} from "./lib/auth"
import { TOTAL_TRAINING_DAYS } from "./lib/constants"

export const getMyProgress = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["dsm", "admin"])
    if (!user) return []

    return await ctx.db
      .query("trainingProgress")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect()
  },
})

export const markDayComplete = mutation({
  args: { day: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["dsm", "admin"])

    if (args.day < 1 || args.day > TOTAL_TRAINING_DAYS) {
      throw new Error(`Invalid training day: ${args.day}`)
    }

    // Check for duplicate completion
    const existing = await ctx.db
      .query("trainingProgress")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect()

    if (existing.some((r) => r.day === args.day)) {
      throw new Error(`Day ${args.day} is already completed`)
    }

    await ctx.db.insert("trainingProgress", {
      userId: user._id,
      day: args.day,
      completedAt: Date.now(),
    })
  },
})

export const getAllDsmProgress = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithRole(ctx, "admin")
    if (!user) return {}

    const allProgress = await ctx.db
      .query("trainingProgress")
      .collect()

    // Group by userId and count completed days
    const progressMap: Record<string, number> = {}
    for (const record of allProgress) {
      const uid = record.userId as string
      progressMap[uid] = (progressMap[uid] ?? 0) + 1
    }

    return progressMap
  },
})
