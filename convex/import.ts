import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { requireUserWithRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Preview round-robin allocation for a CSV import.
 *
 * Algorithm:
 *  1. Get available salespeople (role=salesperson, isAvailable=true, not excluded)
 *  2. Count their current leads via byAssignedTo index
 *  3. Sort by currentLeads ascending
 *  4. Distribute cyclically: lead[i] → salesperson[i % count]
 *  5. Return preview array
 */
export const previewAllocation = query({
  args: {
    leadCount: v.number(),
    excludeUserIds: v.optional(v.array(v.id("users"))),
  },
  handler: async (ctx, args) => {
    await requireUserWithRole(ctx, "admin")

    const excludeSet = new Set(
      (args.excludeUserIds ?? []).map((id) => id.toString())
    )

    // Get all available salespeople
    const allUsers = await ctx.db.query("users").collect()
    const salespeople = allUsers.filter(
      (u) =>
        u.role === "salesperson" &&
        u.isAvailable &&
        !excludeSet.has(u._id.toString())
    )

    if (salespeople.length === 0) {
      throw new Error("No available salespeople for allocation")
    }

    // Count current leads per salesperson
    const preview = await Promise.all(
      salespeople.map(async (sp) => {
        const currentLeads = await ctx.db
          .query("leads")
          .withIndex("byAssignedTo", (q) => q.eq("assignedTo", sp._id))
          .collect()

        return {
          userId: sp._id,
          userName: sp.name,
          currentLeads: currentLeads.length,
          newLeads: 0,
          totalAfter: currentLeads.length,
        }
      })
    )

    // Sort by currentLeads ascending for fair distribution
    preview.sort((a, b) => a.currentLeads - b.currentLeads)

    // Round-robin distribution
    for (let i = 0; i < args.leadCount; i++) {
      const idx = i % preview.length
      preview[idx].newLeads += 1
      preview[idx].totalAfter += 1
    }

    return preview
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Bulk import leads from CSV with pre-computed allocations.
 * Each lead in the array is paired with an allocation entry that
 * specifies which salesperson to assign it to.
 */
export const bulkImportLeads = mutation({
  args: {
    leads: v.array(
      v.object({
        name: v.string(),
        mobileNumber: v.string(),
        email: v.optional(v.string()),
        budget: v.optional(v.string()),
        source: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
    projectId: v.id("projects"),
    allocations: v.array(
      v.object({
        index: v.number(),
        assignedTo: v.id("users"),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    // Validate project exists and is active
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error("Project not found")
    if (project.status !== "active")
      throw new Error("Project is not active")

    if (args.leads.length !== args.allocations.length) {
      throw new Error(
        "leads and allocations arrays must have the same length"
      )
    }

    const now = Date.now()

    // Build allocation lookup by index
    const allocationMap = new Map<number, typeof args.allocations[number]>()
    for (const alloc of args.allocations) {
      allocationMap.set(alloc.index, alloc)
    }

    const insertedIds: string[] = []

    for (let i = 0; i < args.leads.length; i++) {
      const lead = args.leads[i]
      const allocation = allocationMap.get(i)
      if (!allocation) {
        throw new Error(`Missing allocation for lead at index ${i}`)
      }

      const leadId = await ctx.db.insert("leads", {
        name: lead.name,
        mobileNumber: lead.mobileNumber,
        email: lead.email,
        budget: lead.budget,
        projectId: args.projectId,
        assignedTo: allocation.assignedTo,
        status: "New",
        source: lead.source ?? "99acres",
        notes: lead.notes,
        createdAt: now,
        updatedAt: now,
      })

      insertedIds.push(leadId)

      await logActivity(ctx, {
        entityType: "lead",
        entityId: leadId,
        action: "lead_imported",
        details: {
          name: lead.name,
          source: lead.source ?? "99acres",
          assignedTo: allocation.assignedTo,
        },
        performedBy: user._id,
      })
    }

    // Log one bulk activity on the project
    await logActivity(ctx, {
      entityType: "project",
      entityId: args.projectId,
      action: "bulk_import",
      details: {
        leadCount: args.leads.length,
        projectName: project.name,
      },
      performedBy: user._id,
    })

    return insertedIds
  },
})
