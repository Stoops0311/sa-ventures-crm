import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import {
  getUserWithAnyRole,
  requireUserWithAnyRole,
  requireUser,
} from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { ONBOARDING_CHECKLIST_ITEMS, UPLOADABLE_CHECKLIST_ITEMS } from "./lib/constants"
import type { Id } from "./_generated/dataModel"

type ChecklistItem = {
  key: string
  label: string
  completedAt: number | null
  completedBy: string | null
  storageId?: string | null
  uploadedAt?: number | null
}

function parseItems(json: string): ChecklistItem[] {
  return JSON.parse(json)
}

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx)
    const isHROrAdmin = ["hr", "admin"].includes(currentUser.role)
    if (!isHROrAdmin && currentUser._id !== args.userId) return null

    const checklist = await ctx.db
      .query("onboardingChecklists")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .unique()

    if (!checklist) return null

    const user = await ctx.db.get(args.userId)
    return { ...checklist, user, parsedItems: parseItems(checklist.items) }
  },
})

export const listAll = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!currentUser) return []

    const checklists = await ctx.db.query("onboardingChecklists").collect()

    const results = await Promise.all(
      checklists.map(async (checklist) => {
        const user = await ctx.db.get(checklist.userId)
        if (!user) return null

        const profile = await ctx.db.get(checklist.employeeProfileId)
        const items = parseItems(checklist.items)
        const completedCount = items.filter((i) => i.completedAt !== null).length
        const remainingItems = items
          .filter((i) => i.completedAt === null)
          .map((i) => i.label)

        return {
          ...checklist,
          user,
          profile,
          parsedItems: items,
          completedCount,
          totalItems: items.length,
          remainingItems,
        }
      })
    )

    let filtered = results.filter(
      (r): r is NonNullable<typeof r> => r !== null
    )

    if (args.status) {
      filtered = filtered.filter((r) => r.status === args.status)
    }

    // Problem-first sorting: pending first (oldest first), then in_progress (least progress first), then completed
    const statusOrder: Record<string, number> = {
      pending: 0,
      in_progress: 1,
      completed: 2,
    }
    filtered.sort((a, b) => {
      const aOrder = statusOrder[a.status] ?? 2
      const bOrder = statusOrder[b.status] ?? 2
      if (aOrder !== bOrder) return aOrder - bOrder
      if (a.status === "in_progress" && b.status === "in_progress") {
        return a.completedCount - b.completedCount // least progress first
      }
      return a.createdAt - b.createdAt // oldest first for pending
    })

    return filtered
  },
})

export const getMyOnboarding = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await requireUser(ctx)

    const checklist = await ctx.db
      .query("onboardingChecklists")
      .withIndex("byUserId", (q) => q.eq("userId", currentUser._id))
      .unique()

    if (!checklist) return null

    const items = parseItems(checklist.items)
    const enrichedItems = await Promise.all(
      items.map(async (item) => ({
        ...item,
        documentUrl: item.storageId
          ? await ctx.storage.getUrl(item.storageId as Id<"_storage">)
          : null,
      }))
    )
    const completedCount = enrichedItems.filter((i) => i.completedAt !== null).length
    const remainingItems = enrichedItems
      .filter((i) => i.completedAt === null)
      .map((i) => i.label)

    return {
      ...checklist,
      parsedItems: enrichedItems,
      completedCount,
      totalItems: enrichedItems.length,
      remainingItems,
    }
  },
})

export const getPendingCount = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!currentUser) return 0

    const pending = await ctx.db
      .query("onboardingChecklists")
      .withIndex("byStatus", (q) => q.eq("status", "pending"))
      .collect()
    const inProgress = await ctx.db
      .query("onboardingChecklists")
      .withIndex("byStatus", (q) => q.eq("status", "in_progress"))
      .collect()

    return pending.length + inProgress.length
  },
})

export const create = mutation({
  args: {
    userId: v.id("users"),
    employeeProfileId: v.id("employeeProfiles"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx)

    const items: ChecklistItem[] = ONBOARDING_CHECKLIST_ITEMS.map((item) => ({
      key: item.key,
      label: item.label,
      completedAt: null,
      completedBy: null,
    }))

    const checklistId = await ctx.db.insert("onboardingChecklists", {
      userId: args.userId,
      employeeProfileId: args.employeeProfileId,
      status: "pending",
      items: JSON.stringify(items),
      createdAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "onboarding",
      entityId: checklistId,
      action: "onboarding_created",
      details: { userId: args.userId },
      performedBy: currentUser._id,
    })

    return checklistId
  },
})

export const toggleItem = mutation({
  args: {
    checklistId: v.id("onboardingChecklists"),
    itemKey: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx)
    const checklist = await ctx.db.get(args.checklistId)
    if (!checklist) throw new Error("Checklist not found")

    const isHROrAdmin = ["hr", "admin"].includes(currentUser.role)

    // Employees can only toggle form-based items
    if (!isHROrAdmin) {
      if (currentUser._id !== checklist.userId) {
        throw new Error("Unauthorized")
      }
      const employeeToggleable = [
        "complete_personal_info",
        "submit_emergency_contact",
      ]
      if (!employeeToggleable.includes(args.itemKey)) {
        throw new Error("Cannot toggle this item")
      }
    }

    const items = parseItems(checklist.items)
    const item = items.find((i) => i.key === args.itemKey)
    if (!item) throw new Error("Item not found")

    if (item.completedAt) {
      item.completedAt = null
      item.completedBy = null
    } else {
      item.completedAt = Date.now()
      item.completedBy = currentUser._id
    }

    // Determine status: if any item completed → in_progress, if all → still in_progress (markComplete makes it completed)
    const completedCount = items.filter((i) => i.completedAt !== null).length
    let status = checklist.status
    if (completedCount > 0 && status === "pending") {
      status = "in_progress"
    }
    if (completedCount === 0) {
      status = "pending"
    }

    await ctx.db.patch(args.checklistId, {
      items: JSON.stringify(items),
      status,
    })

    await logActivity(ctx, {
      entityType: "onboarding",
      entityId: args.checklistId,
      action: item.completedAt ? "item_completed" : "item_uncompleted",
      details: { itemKey: args.itemKey, itemLabel: item.label },
      performedBy: currentUser._id,
    })
  },
})

export const markComplete = mutation({
  args: {
    checklistId: v.id("onboardingChecklists"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUserWithAnyRole(ctx, ["hr", "admin"])
    const checklist = await ctx.db.get(args.checklistId)
    if (!checklist) throw new Error("Checklist not found")

    const items = parseItems(checklist.items)
    const allDone = items.every((i) => i.completedAt !== null)
    if (!allDone) {
      throw new Error("Cannot mark complete: not all items are done")
    }

    await ctx.db.patch(args.checklistId, {
      status: "completed",
      completedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "onboarding",
      entityId: args.checklistId,
      action: "onboarding_completed",
      details: { userId: checklist.userId },
      performedBy: currentUser._id,
    })
  },
})

export const uploadDocument = mutation({
  args: {
    checklistId: v.id("onboardingChecklists"),
    itemKey: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx)
    const checklist = await ctx.db.get(args.checklistId)
    if (!checklist) throw new Error("Checklist not found")

    const isHROrAdmin = ["hr", "admin"].includes(currentUser.role)
    if (!isHROrAdmin && currentUser._id !== checklist.userId) {
      throw new Error("Unauthorized")
    }

    if (!(UPLOADABLE_CHECKLIST_ITEMS as readonly string[]).includes(args.itemKey)) {
      throw new Error("This item does not accept document uploads")
    }

    const items = parseItems(checklist.items)
    const item = items.find((i) => i.key === args.itemKey)
    if (!item) throw new Error("Item not found")

    // Delete previous upload if replacing
    if (item.storageId) {
      await ctx.storage.delete(item.storageId as Id<"_storage">)
    }

    item.storageId = args.storageId
    item.uploadedAt = Date.now()

    await ctx.db.patch(args.checklistId, {
      items: JSON.stringify(items),
    })

    await logActivity(ctx, {
      entityType: "onboarding",
      entityId: args.checklistId,
      action: "document_uploaded",
      details: { itemKey: args.itemKey, itemLabel: item.label },
      performedBy: currentUser._id,
    })
  },
})

export const removeDocument = mutation({
  args: {
    checklistId: v.id("onboardingChecklists"),
    itemKey: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx)
    const checklist = await ctx.db.get(args.checklistId)
    if (!checklist) throw new Error("Checklist not found")

    const isHROrAdmin = ["hr", "admin"].includes(currentUser.role)
    if (!isHROrAdmin && currentUser._id !== checklist.userId) {
      throw new Error("Unauthorized")
    }

    const items = parseItems(checklist.items)
    const item = items.find((i) => i.key === args.itemKey)
    if (!item) throw new Error("Item not found")

    if (item.completedAt) {
      throw new Error("Cannot remove document from a verified item")
    }

    if (!item.storageId) {
      throw new Error("No document to remove")
    }

    await ctx.storage.delete(item.storageId as Id<"_storage">)
    item.storageId = null
    item.uploadedAt = null

    await ctx.db.patch(args.checklistId, {
      items: JSON.stringify(items),
    })

    await logActivity(ctx, {
      entityType: "onboarding",
      entityId: args.checklistId,
      action: "document_removed",
      details: { itemKey: args.itemKey, itemLabel: item.label },
      performedBy: currentUser._id,
    })
  },
})
