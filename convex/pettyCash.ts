import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserWithAnyRole, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { isValidPettyCashType, isValidPettyCashCategory } from "./lib/constants"

const PETTY_CASH_ACCESS_ROLES = ["receptionist", "admin", "hr"] as const
const accessRoles = [...PETTY_CASH_ACCESS_ROLES]

function getDateString(timestamp?: number): string {
  const d = timestamp ? new Date(timestamp) : new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * List petty cash entries for a given date (defaults to today).
 * Supports optional filters.
 */
export const list = query({
  args: {
    date: v.optional(v.string()), // "YYYY-MM-DD"
    type: v.optional(v.string()), // "given" | "returned"
    category: v.optional(v.string()),
    personUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, [...accessRoles])
    if (!user) return null

    const date = args.date ?? getDateString()

    let entries = await ctx.db
      .query("pettyCashEntries")
      .withIndex("byDate", (q) => q.eq("date", date))
      .collect()

    // Apply filters
    if (args.type) {
      entries = entries.filter((e) => e.type === args.type)
    }
    if (args.category) {
      entries = entries.filter((e) => e.category === args.category)
    }
    if (args.personUserId) {
      entries = entries.filter(
        (e) => e.personUserId?.toString() === args.personUserId?.toString()
      )
    }

    // Enrich with person user names
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        let personDisplayName = entry.personName ?? "Unknown"
        if (entry.personUserId) {
          const personUser = await ctx.db.get(entry.personUserId)
          personDisplayName = personUser?.name ?? "Unknown User"
        }
        let createdByName = "Unknown"
        const creator = await ctx.db.get(entry.createdBy)
        if (creator) createdByName = creator.name

        return {
          ...entry,
          personDisplayName,
          createdByName,
          receiptUrl: entry.receiptStorageId
            ? await ctx.storage.getUrl(entry.receiptStorageId)
            : null,
        }
      })
    )

    // Sort by createdAt descending (newest first)
    return enriched.sort((a, b) => b.createdAt - a.createdAt)
  },
})

/**
 * Daily summary for a given date.
 */
export const getDailySummary = query({
  args: {
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, [...accessRoles])
    if (!user) return null

    const date = args.date ?? getDateString()

    const entries = await ctx.db
      .query("pettyCashEntries")
      .withIndex("byDate", (q) => q.eq("date", date))
      .collect()

    const nonVoided = entries.filter((e) => !e.isVoided)
    const totalGiven = nonVoided
      .filter((e) => e.type === "given")
      .reduce((sum, e) => sum + e.amount, 0)
    const totalReturned = nonVoided
      .filter((e) => e.type === "returned")
      .reduce((sum, e) => sum + e.amount, 0)

    return {
      date,
      totalGiven,
      totalReturned,
      netFlow: totalReturned - totalGiven,
      entryCount: nonVoided.length,
    }
  },
})

/**
 * Get running balance (cash in hand).
 * openingBalance + sum(all returned) - sum(all given) up to the given date.
 */
export const getRunningBalance = query({
  args: {
    upToDate: v.optional(v.string()), // "YYYY-MM-DD", defaults to today
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, [...accessRoles])
    if (!user) return null

    const upToDate = args.upToDate ?? getDateString()

    // Get opening balance
    const settings = await ctx.db.query("pettyCashSettings").collect()
    const openingBalance = settings[0]?.openingBalance ?? 0

    // Sum all non-voided entries up to and including the date
    const allEntries = await ctx.db
      .query("pettyCashEntries")
      .withIndex("byDate")
      .collect()

    const relevantEntries = allEntries.filter(
      (e) => !e.isVoided && e.date <= upToDate
    )

    const totalReturned = relevantEntries
      .filter((e) => e.type === "returned")
      .reduce((sum, e) => sum + e.amount, 0)
    const totalGiven = relevantEntries
      .filter((e) => e.type === "given")
      .reduce((sum, e) => sum + e.amount, 0)

    return {
      openingBalance,
      totalReturned,
      totalGiven,
      cashInHand: openingBalance + totalReturned - totalGiven,
    }
  },
})

/**
 * Get petty cash settings.
 */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, [...accessRoles])
    if (!user) return null

    const settings = await ctx.db.query("pettyCashSettings").collect()
    return settings[0] ?? null
  },
})

/**
 * Get report data for a date range, grouped by category.
 */
export const getReportData = query({
  args: {
    dateFrom: v.string(),
    dateTo: v.string(),
  },
  handler: async (ctx, { dateFrom, dateTo }) => {
    const user = await getUserWithAnyRole(ctx, [...accessRoles])
    if (!user) return null

    const allEntries = await ctx.db
      .query("pettyCashEntries")
      .withIndex("byDate")
      .collect()

    const rangeEntries = allEntries.filter(
      (e) => !e.isVoided && e.date >= dateFrom && e.date <= dateTo
    )

    // Category breakdown
    const categoryMap: Record<string, { given: number; returned: number; count: number }> = {}
    for (const entry of rangeEntries) {
      if (!categoryMap[entry.category]) {
        categoryMap[entry.category] = { given: 0, returned: 0, count: 0 }
      }
      categoryMap[entry.category].count++
      if (entry.type === "given") {
        categoryMap[entry.category].given += entry.amount
      } else {
        categoryMap[entry.category].returned += entry.amount
      }
    }

    const totalGiven = rangeEntries
      .filter((e) => e.type === "given")
      .reduce((sum, e) => sum + e.amount, 0)
    const totalReturned = rangeEntries
      .filter((e) => e.type === "returned")
      .reduce((sum, e) => sum + e.amount, 0)

    return {
      dateFrom,
      dateTo,
      totalGiven,
      totalReturned,
      netFlow: totalReturned - totalGiven,
      entryCount: rangeEntries.length,
      categoryBreakdown: Object.entries(categoryMap).map(([category, data]) => ({
        category,
        ...data,
      })),
    }
  },
})

/**
 * Get all CRM users for the person picker.
 */
export const listCrmUsers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, [...accessRoles])
    if (!user) return null

    const users = await ctx.db.query("users").collect()
    return users.map((u) => ({
      _id: u._id,
      name: u.name,
      role: u.role,
    }))
  },
})

/**
 * Get previously used custom person names for autocomplete.
 */
export const getCustomPersonNames = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, [...accessRoles])
    if (!user) return null

    const entries = await ctx.db
      .query("pettyCashEntries")
      .collect()

    const names = new Set<string>()
    for (const entry of entries) {
      if (entry.personName) {
        names.add(entry.personName)
      }
    }
    return Array.from(names).sort()
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a new petty cash entry.
 */
export const create = mutation({
  args: {
    type: v.string(), // "given" | "returned"
    amount: v.number(),
    category: v.string(),
    description: v.string(),
    personUserId: v.optional(v.id("users")),
    personName: v.optional(v.string()),
    date: v.optional(v.string()), // "YYYY-MM-DD", defaults to today
    receiptStorageId: v.optional(v.id("_storage")),
    receiptFileName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, [...accessRoles])

    if (!isValidPettyCashType(args.type)) {
      throw new Error(`Invalid type: ${args.type}`)
    }
    if (!isValidPettyCashCategory(args.category)) {
      throw new Error(`Invalid category: ${args.category}`)
    }
    if (args.amount <= 0) {
      throw new Error("Amount must be greater than 0")
    }
    if (!args.personUserId && !args.personName) {
      throw new Error("Either personUserId or personName must be provided")
    }

    const date = args.date ?? getDateString()
    const now = Date.now()

    const entryId = await ctx.db.insert("pettyCashEntries", {
      type: args.type,
      amount: args.amount,
      category: args.category,
      description: args.description,
      personUserId: args.personUserId,
      personName: args.personName,
      date,
      receiptStorageId: args.receiptStorageId,
      receiptFileName: args.receiptFileName,
      isVoided: false,
      createdBy: user._id,
      createdAt: now,
    })

    // Get person display name for activity log
    let personDisplay = args.personName ?? "Unknown"
    if (args.personUserId) {
      const personUser = await ctx.db.get(args.personUserId)
      personDisplay = personUser?.name ?? "Unknown"
    }

    await logActivity(ctx, {
      entityType: "petty_cash",
      entityId: entryId,
      action: args.type === "given" ? "cash_given" : "cash_returned",
      details: {
        amount: args.amount,
        person: personDisplay,
        category: args.category,
        description: args.description,
      },
      performedBy: user._id,
    })

    return entryId
  },
})

/**
 * Void a petty cash entry.
 */
export const voidEntry = mutation({
  args: {
    entryId: v.id("pettyCashEntries"),
    reason: v.string(),
  },
  handler: async (ctx, { entryId, reason }) => {
    const user = await requireUserWithAnyRole(ctx, [...accessRoles])

    const entry = await ctx.db.get(entryId)
    if (!entry) throw new Error("Entry not found")
    if (entry.isVoided) throw new Error("Entry is already voided")

    if (!reason.trim()) {
      throw new Error("Void reason is required")
    }

    const now = Date.now()
    await ctx.db.patch(entryId, {
      isVoided: true,
      voidedAt: now,
      voidedBy: user._id,
      voidReason: reason,
    })

    await logActivity(ctx, {
      entityType: "petty_cash",
      entityId: entryId,
      action: "entry_voided",
      details: {
        amount: entry.amount,
        type: entry.type,
        reason,
      },
      performedBy: user._id,
    })
  },
})

/**
 * Update petty cash settings (opening balance).
 */
export const updateSettings = mutation({
  args: {
    openingBalance: v.number(),
  },
  handler: async (ctx, { openingBalance }) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "receptionist"])

    const existing = await ctx.db.query("pettyCashSettings").collect()
    const now = Date.now()

    if (existing.length > 0) {
      await ctx.db.patch(existing[0]._id, {
        openingBalance,
        updatedBy: user._id,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("pettyCashSettings", {
        openingBalance,
        updatedBy: user._id,
        updatedAt: now,
      })
    }

    await logActivity(ctx, {
      entityType: "petty_cash",
      entityId: "settings",
      action: "opening_balance_updated",
      details: { openingBalance },
      performedBy: user._id,
    })
  },
})

/**
 * Generate upload URL for receipt files.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserWithAnyRole(ctx, [...accessRoles])
    return await ctx.storage.generateUploadUrl()
  },
})
