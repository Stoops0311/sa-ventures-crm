import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserWithAnyRole, requireUserWithAnyRole, requireUserWithRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get paginated ledger entries for a DSM.
 * DSM sees own entries; admin sees any DSM.
 */
export const getByDsm = query({
  args: {
    dsmUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["dsm", "admin"])
    if (!user) return null

    // DSM can only see own entries
    if (user.role === "dsm" && user._id.toString() !== args.dsmUserId.toString()) {
      return null
    }

    const entries = await ctx.db
      .query("dsmCommissionEntries")
      .withIndex("byDsmUserId", (q) => q.eq("dsmUserId", args.dsmUserId))
      .order("desc")
      .collect()

    // Enrich with lead/project names
    const enriched = await Promise.all(
      entries.map(async (entry) => {
        let leadName: string | undefined
        let projectName: string | undefined
        if (entry.leadId) {
          const lead = await ctx.db.get(entry.leadId)
          leadName = lead?.name
        }
        if (entry.projectId) {
          const project = await ctx.db.get(entry.projectId)
          projectName = project?.name
        }
        const creator = await ctx.db.get(entry.createdBy)
        return {
          ...entry,
          leadName,
          projectName,
          createdByName: creator?.name ?? "System",
        }
      })
    )

    return enriched
  },
})

/**
 * Get summary totals for a DSM: totalCredits, totalDebits, balance.
 */
export const getSummary = query({
  args: {
    dsmUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["dsm", "admin"])
    if (!user) return null

    if (user.role === "dsm" && user._id.toString() !== args.dsmUserId.toString()) {
      return null
    }

    const entries = await ctx.db
      .query("dsmCommissionEntries")
      .withIndex("byDsmUserId", (q) => q.eq("dsmUserId", args.dsmUserId))
      .collect()

    const nonVoided = entries.filter((e) => !e.isVoided)
    const totalCredits = nonVoided
      .filter((e) => e.type === "credit")
      .reduce((sum, e) => sum + e.amount, 0)
    const totalDebits = nonVoided
      .filter((e) => e.type === "debit")
      .reduce((sum, e) => sum + e.amount, 0)

    return {
      totalCredits,
      totalDebits,
      balance: totalCredits - totalDebits,
    }
  },
})

/**
 * Admin-only: Get all DSMs with their commission balances.
 */
export const getAllDsmBalances = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["admin"])
    if (!user) return null

    // Get all DSM users
    const allUsers = await ctx.db.query("users").collect()
    const dsmUsers = allUsers.filter((u) => u.role === "dsm")

    // Get all commission entries
    const allEntries = await ctx.db.query("dsmCommissionEntries").collect()
    const nonVoided = allEntries.filter((e) => !e.isVoided)

    const result = dsmUsers.map((dsm) => {
      const dsmEntries = nonVoided.filter(
        (e) => e.dsmUserId.toString() === dsm._id.toString()
      )
      const totalCredits = dsmEntries
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + e.amount, 0)
      const totalDebits = dsmEntries
        .filter((e) => e.type === "debit")
        .reduce((sum, e) => sum + e.amount, 0)

      return {
        _id: dsm._id,
        name: dsm.name,
        email: dsm.email,
        phone: dsm.phone,
        bankName: dsm.bankName,
        bankAccountNumber: dsm.bankAccountNumber,
        bankIfscCode: dsm.bankIfscCode,
        bankAccountHolderName: dsm.bankAccountHolderName,
        totalCredits,
        totalDebits,
        balance: totalCredits - totalDebits,
        entryCount: dsmEntries.length,
      }
    })

    // Sort by balance descending (highest owed first)
    return result.sort((a, b) => b.balance - a.balance)
  },
})

/**
 * Get bank details for a DSM (admin viewing).
 */
export const getBankDetails = query({
  args: { dsmUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["dsm", "admin"])
    if (!user) return null

    if (user.role === "dsm" && user._id.toString() !== args.dsmUserId.toString()) {
      return null
    }

    const dsm = await ctx.db.get(args.dsmUserId)
    if (!dsm) return null

    return {
      bankName: dsm.bankName,
      bankAccountNumber: dsm.bankAccountNumber,
      bankIfscCode: dsm.bankIfscCode,
      bankAccountHolderName: dsm.bankAccountHolderName,
    }
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Admin records a payment (debit) to a DSM.
 */
export const recordPayment = mutation({
  args: {
    dsmUserId: v.id("users"),
    amount: v.number(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    if (args.amount <= 0) throw new Error("Amount must be greater than 0")
    if (!args.description.trim()) throw new Error("Description is required")

    const dsm = await ctx.db.get(args.dsmUserId)
    if (!dsm) throw new Error("DSM user not found")
    if (dsm.role !== "dsm") throw new Error("User is not a DSM")

    const now = Date.now()
    const entryId = await ctx.db.insert("dsmCommissionEntries", {
      dsmUserId: args.dsmUserId,
      type: "debit",
      amount: args.amount,
      description: args.description.trim(),
      isAutoGenerated: false,
      isVoided: false,
      createdBy: user._id,
      createdAt: now,
    })

    await logActivity(ctx, {
      entityType: "dsm_commission",
      entityId: entryId,
      action: "payment_recorded",
      details: {
        dsmName: dsm.name,
        amount: args.amount,
        description: args.description,
      },
      performedBy: user._id,
    })

    return entryId
  },
})

/**
 * Admin records a manual credit for a DSM.
 */
export const recordManualCredit = mutation({
  args: {
    dsmUserId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    leadId: v.optional(v.id("leads")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    if (args.amount <= 0) throw new Error("Amount must be greater than 0")
    if (!args.description.trim()) throw new Error("Description is required")

    const dsm = await ctx.db.get(args.dsmUserId)
    if (!dsm) throw new Error("DSM user not found")
    if (dsm.role !== "dsm") throw new Error("User is not a DSM")

    const now = Date.now()
    const entryId = await ctx.db.insert("dsmCommissionEntries", {
      dsmUserId: args.dsmUserId,
      type: "credit",
      amount: args.amount,
      leadId: args.leadId,
      projectId: args.projectId,
      description: args.description.trim(),
      isAutoGenerated: false,
      isVoided: false,
      createdBy: user._id,
      createdAt: now,
    })

    await logActivity(ctx, {
      entityType: "dsm_commission",
      entityId: entryId,
      action: "manual_credit_added",
      details: {
        dsmName: dsm.name,
        amount: args.amount,
        description: args.description,
      },
      performedBy: user._id,
    })

    return entryId
  },
})

/**
 * Admin voids a commission entry.
 */
export const voidEntry = mutation({
  args: {
    entryId: v.id("dsmCommissionEntries"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    const entry = await ctx.db.get(args.entryId)
    if (!entry) throw new Error("Entry not found")
    if (entry.isVoided) throw new Error("Entry is already voided")
    if (!args.reason.trim()) throw new Error("Void reason is required")

    const now = Date.now()
    await ctx.db.patch(args.entryId, {
      isVoided: true,
      voidedAt: now,
      voidedBy: user._id,
      voidReason: args.reason.trim(),
    })

    const dsm = await ctx.db.get(entry.dsmUserId)

    await logActivity(ctx, {
      entityType: "dsm_commission",
      entityId: args.entryId,
      action: "entry_voided",
      details: {
        dsmName: dsm?.name,
        amount: entry.amount,
        type: entry.type,
        reason: args.reason,
      },
      performedBy: user._id,
    })
  },
})

/**
 * DSM updates their own bank details.
 */
export const updateBankDetails = mutation({
  args: {
    bankName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    bankIfscCode: v.optional(v.string()),
    bankAccountHolderName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["dsm"])

    await ctx.db.patch(user._id, {
      bankName: args.bankName?.trim() || undefined,
      bankAccountNumber: args.bankAccountNumber?.trim() || undefined,
      bankIfscCode: args.bankIfscCode?.trim() || undefined,
      bankAccountHolderName: args.bankAccountHolderName?.trim() || undefined,
    })

    await logActivity(ctx, {
      entityType: "user",
      entityId: user._id,
      action: "bank_details_updated",
      details: { dsmName: user.name },
      performedBy: user._id,
    })
  },
})
