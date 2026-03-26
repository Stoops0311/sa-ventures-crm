import { query, mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { requireUser, getUserOrNull, getUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { STALE_BREAK_THRESHOLD_MS, DEFAULT_BREAK_WARNING_MINUTES } from "./lib/constants"

// Valid break type values
const VALID_BREAK_TYPES = [
  "lunch", "other_break", "training", "huddle",
  "onsite_visit", "offline_marketing", "other",
] as const

function getDateString(timestamp: number): string {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// --- Mutations ---

export const startBreak = mutation({
  args: {
    breakType: v.string(),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    if (user.role === "dsm") throw new Error("DSM users cannot use break time")

    // Validate break type
    if (!(VALID_BREAK_TYPES as readonly string[]).includes(args.breakType)) {
      throw new Error(`Invalid break type: ${args.breakType}`)
    }

    // Remarks required for "other" type
    if (args.breakType === "other" && !args.remarks?.trim()) {
      throw new Error("Remarks are required for Other break type")
    }

    // Idempotent: if already on break, return existing
    const existing = await ctx.db
      .query("breakSessions")
      .withIndex("byUserIdAndIsActive", (q) =>
        q.eq("userId", user._id).eq("isActive", true)
      )
      .first()

    if (existing) return existing._id

    const now = Date.now()
    const breakId = await ctx.db.insert("breakSessions", {
      userId: user._id,
      date: getDateString(now),
      startTime: now,
      isActive: true,
      wasAutoEnded: false,
      breakType: args.breakType,
      remarks: args.remarks?.trim() || undefined,
    })

    await logActivity(ctx, {
      entityType: "break_session",
      entityId: breakId,
      action: "break_started",
      details: { breakType: args.breakType },
      performedBy: user._id,
    })

    return breakId
  },
})

export const endBreak = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)

    const activeBreak = await ctx.db
      .query("breakSessions")
      .withIndex("byUserIdAndIsActive", (q) =>
        q.eq("userId", user._id).eq("isActive", true)
      )
      .first()

    if (!activeBreak) throw new Error("No active break to end")

    // Auth guard: break must belong to calling user
    if (activeBreak.userId !== user._id) {
      throw new Error("Unauthorized: break does not belong to you")
    }

    const now = Date.now()
    await ctx.db.patch(activeBreak._id, {
      endTime: now,
      isActive: false,
    })

    await logActivity(ctx, {
      entityType: "break_session",
      entityId: activeBreak._id,
      action: "break_ended",
      details: {
        durationMs: now - activeBreak.startTime,
      },
      performedBy: user._id,
    })
  },
})

export const updateSettings = mutation({
  args: {
    warningThresholdMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    if (user.role !== "admin") throw new Error("Unauthorized: admin only")

    const existing = await ctx.db.query("breakTimeSettings").first()
    const now = Date.now()

    if (existing) {
      await ctx.db.patch(existing._id, {
        warningThresholdMinutes: args.warningThresholdMinutes,
        updatedBy: user._id,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("breakTimeSettings", {
        warningThresholdMinutes: args.warningThresholdMinutes,
        updatedBy: user._id,
        updatedAt: now,
      })
    }
  },
})

// --- Queries ---

export const getActiveBreak = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null

    return await ctx.db
      .query("breakSessions")
      .withIndex("byUserIdAndIsActive", (q) =>
        q.eq("userId", user._id).eq("isActive", true)
      )
      .first()
  },
})

export const getBreaksForDay = query({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []

    const breaks = await ctx.db
      .query("breakSessions")
      .withIndex("byUserIdAndDate", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect()

    return breaks.map((b) => ({
      ...b,
      breakType: b.breakType,
      remarks: b.remarks,
    }))
  },
})

export const getBreaksForDateRange = query({
  args: {
    userIds: v.array(v.id("users")),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []

    const allBreaks: Array<{
      userId: string
      date: string
      startTime: number
      endTime?: number
      isActive: boolean
      wasAutoEnded: boolean
      breakType?: string
      remarks?: string
    }> = []

    for (const userId of args.userIds) {
      const breaks = await ctx.db
        .query("breakSessions")
        .withIndex("byUserIdAndDate", (q) =>
          q.eq("userId", userId).gte("date", args.startDate)
        )
        .collect()

      for (const b of breaks) {
        if (b.date <= args.endDate) {
          allBreaks.push({
            userId: b.userId,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            isActive: b.isActive,
            wasAutoEnded: b.wasAutoEnded,
            breakType: b.breakType,
            remarks: b.remarks,
          })
        }
      }
    }

    return allBreaks
  },
})

export const getTeamBreakStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "hr"])
    if (!user) return []

    const activeBreaks = await ctx.db
      .query("breakSessions")
      .withIndex("byIsActive", (q) => q.eq("isActive", true))
      .collect()

    const result = await Promise.all(
      activeBreaks.map(async (b) => {
        const breakUser = await ctx.db.get(b.userId)
        return {
          breakId: b._id,
          userId: b.userId,
          userName: breakUser?.name ?? "Unknown",
          userRole: breakUser?.role,
          startTime: b.startTime,
          breakType: b.breakType,
          remarks: b.remarks,
        }
      })
    )

    return result
  },
})

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserOrNull(ctx)
    if (!user) return { warningThresholdMinutes: DEFAULT_BREAK_WARNING_MINUTES }

    const settings = await ctx.db.query("breakTimeSettings").first()
    return {
      warningThresholdMinutes:
        settings?.warningThresholdMinutes ?? DEFAULT_BREAK_WARNING_MINUTES,
    }
  },
})

// --- Internal: Stale break cleanup (called by cron) ---

export const cleanupStaleBreaks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    const activeBreaks = await ctx.db
      .query("breakSessions")
      .withIndex("byIsActive", (q) => q.eq("isActive", true))
      .collect()

    for (const b of activeBreaks) {
      if (now - b.startTime > STALE_BREAK_THRESHOLD_MS) {
        await ctx.db.patch(b._id, {
          endTime: now,
          isActive: false,
          wasAutoEnded: true,
        })
      }
    }
  },
})
