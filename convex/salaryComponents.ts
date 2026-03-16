import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserOrNull, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { DEFAULT_SALARY_COMPONENTS } from "./lib/constants"

const VALID_COMPONENT_TYPES = ["earning", "deduction"] as const
const MAX_COMPONENTS = 30

function validateComponentType(type: string): type is "earning" | "deduction" {
  return (VALID_COMPONENT_TYPES as readonly string[]).includes(type)
}

function validateAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount >= 0 && amount <= 100_000_000
}

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []
    const isHROrAdmin = user.role === "hr" || user.role === "admin"
    if (!isHROrAdmin && user._id !== args.userId) return []
    const components = await ctx.db
      .query("salaryComponents")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect()
    return components.sort((a, b) => a.order - b.order)
  },
})

export const hasComponents = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return false
    const isHROrAdmin = user.role === "hr" || user.role === "admin"
    if (!isHROrAdmin) return false
    const first = await ctx.db
      .query("salaryComponents")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .first()
    return first !== null
  },
})

export const setAll = mutation({
  args: {
    userId: v.id("users"),
    components: v.array(
      v.object({
        name: v.string(),
        type: v.string(),
        amount: v.number(),
        isCustom: v.boolean(),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])
    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) throw new Error("Employee not found")

    // Validate component count
    if (args.components.length === 0) throw new Error("At least one component is required")
    if (args.components.length > MAX_COMPONENTS) throw new Error(`Maximum ${MAX_COMPONENTS} components allowed`)

    // Validate each component
    const seenNames = new Set<string>()
    for (const comp of args.components) {
      const trimmedName = comp.name.trim()
      if (!trimmedName) throw new Error("Component name cannot be empty")
      if (seenNames.has(trimmedName.toLowerCase())) {
        throw new Error(`Duplicate component name: ${trimmedName}`)
      }
      seenNames.add(trimmedName.toLowerCase())

      if (!validateComponentType(comp.type)) {
        throw new Error(`Invalid component type: ${comp.type}`)
      }
      if (!validateAmount(comp.amount)) {
        throw new Error(`Invalid amount for ${trimmedName}: must be between 0 and 10,00,00,000`)
      }
    }

    // Delete existing components
    const existing = await ctx.db
      .query("salaryComponents")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect()
    for (const c of existing) {
      await ctx.db.delete(c._id)
    }

    // Insert new components
    const now = Date.now()
    for (const comp of args.components) {
      await ctx.db.insert("salaryComponents", {
        userId: args.userId,
        name: comp.name.trim(),
        type: comp.type,
        amount: Math.round(comp.amount), // ensure integer rupees
        isCustom: comp.isCustom,
        order: comp.order,
        createdAt: now,
        updatedAt: now,
      })
    }

    await logActivity(ctx, {
      entityType: "salary",
      entityId: args.userId,
      action: "salary_configured",
      details: {
        employeeName: targetUser.name,
        componentCount: args.components.length,
      },
      performedBy: user._id,
    })
  },
})

export const initializeDefaults = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    // Verify target user exists and is a managed employee
    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) throw new Error("Employee not found")
    if (targetUser.role === "dsm") throw new Error("DSM users are not managed employees")

    const existing = await ctx.db
      .query("salaryComponents")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .first()
    if (existing) throw new Error("Salary already configured for this employee")

    const now = Date.now()
    for (const comp of DEFAULT_SALARY_COMPONENTS) {
      await ctx.db.insert("salaryComponents", {
        userId: args.userId,
        name: comp.name,
        type: comp.type,
        amount: 0,
        isCustom: comp.isCustom,
        order: comp.order,
        createdAt: now,
        updatedAt: now,
      })
    }

    await logActivity(ctx, {
      entityType: "salary",
      entityId: args.userId,
      action: "salary_defaults_initialized",
      performedBy: user._id,
    })
  },
})
