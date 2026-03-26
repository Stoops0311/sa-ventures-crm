import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { paginationOptsValidator } from "convex/server"
import {
  getUserOrNull,
  getUserWithRole,
  getUserWithAnyRole,
  requireUser,
  requireUserWithRole,
  requireUserWithAnyRole,
} from "./lib/auth"
import { internal } from "./_generated/api"
import { logActivity } from "./lib/activityLogger"
import { isValidLeadStatus, LEAD_STATUSES } from "./lib/constants"
import { buildInitialSteps } from "./afterSales"
import { resolveTemplate } from "./lib/templateResolver"

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Admin paginated list with optional filters and full-text search.
 * When searchQuery is provided, uses search index (no pagination — Convex
 * search queries cannot call .paginate()). Otherwise uses regular indexes
 * with cursor-based pagination.
 */
export const list = query({
  args: {
    projectId: v.optional(v.id("projects")),
    status: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    searchQuery: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getUserWithRole(ctx, "admin")
    if (!user) return { page: [], isDone: true, continueCursor: "" }

    // ── Search path (no pagination, returns up to 256 results) ──
    if (args.searchQuery && args.searchQuery.trim().length > 0) {
      let results = await ctx.db
        .query("leads")
        .withSearchIndex("searchByName", (q) => {
          let sq = q.search("name", args.searchQuery!)
          if (args.projectId) sq = sq.eq("projectId", args.projectId)
          if (args.status) sq = sq.eq("status", args.status)
          if (args.assignedTo) sq = sq.eq("assignedTo", args.assignedTo)
          return sq
        })
        .collect()

      return {
        page: results,
        isDone: true,
        continueCursor: "",
      }
    }

    // ── Regular index path (paginated) ──
    if (args.assignedTo) {
      if (args.status) {
        return await ctx.db
          .query("leads")
          .withIndex("byAssignedToAndStatus", (q) =>
            q.eq("assignedTo", args.assignedTo!).eq("status", args.status!)
          )
          .order("desc")
          .paginate(args.paginationOpts)
      }
      return await ctx.db
        .query("leads")
        .withIndex("byAssignedTo", (q) =>
          q.eq("assignedTo", args.assignedTo!)
        )
        .order("desc")
        .paginate(args.paginationOpts)
    }

    if (args.projectId) {
      const result = await ctx.db
        .query("leads")
        .withIndex("byProjectId", (q) =>
          q.eq("projectId", args.projectId!)
        )
        .order("desc")
        .paginate(args.paginationOpts)

      if (args.status) {
        return {
          ...result,
          page: result.page.filter((l) => l.status === args.status),
        }
      }
      return result
    }

    if (args.status) {
      return await ctx.db
        .query("leads")
        .withIndex("byStatus", (q) => q.eq("status", args.status!))
        .order("desc")
        .paginate(args.paginationOpts)
    }

    return await ctx.db
      .query("leads")
      .order("desc")
      .paginate(args.paginationOpts)
  },
})

/**
 * Single lead by ID with role-based access:
 * - admin sees all
 * - salesperson only if assignedTo matches
 * - dsm only if submittedBy matches
 */
export const getById = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null
    const lead = await ctx.db.get(args.leadId)
    if (!lead) return null

    if (user.role === "admin") return lead
    if (
      user.role === "salesperson" &&
      lead.assignedTo.toString() === user._id.toString()
    )
      return lead
    if (
      user.role === "dsm" &&
      lead.submittedBy?.toString() === user._id.toString()
    )
      return lead

    return null
  },
})

/**
 * Salesperson's own leads, paginated, with optional status tab filter.
 */
export const getMyLeads = query({
  args: {
    status: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, [
      "salesperson",
      "admin",
    ])
    if (!user) return { page: [], isDone: true, continueCursor: "" }

    if (args.status) {
      return await ctx.db
        .query("leads")
        .withIndex("byAssignedToAndStatus", (q) =>
          q.eq("assignedTo", user._id).eq("status", args.status!)
        )
        .order("desc")
        .paginate(args.paginationOpts)
    }

    return await ctx.db
      .query("leads")
      .withIndex("byAssignedTo", (q) => q.eq("assignedTo", user._id))
      .order("desc")
      .paginate(args.paginationOpts)
  },
})

/**
 * DSM's own submitted leads, paginated.
 */
export const getMySubmissions = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["dsm", "admin"])
    if (!user) return { page: [], isDone: true, continueCursor: "" }

    return await ctx.db
      .query("leads")
      .withIndex("bySubmittedBy", (q) => q.eq("submittedBy", user._id))
      .order("desc")
      .paginate(args.paginationOpts)
  },
})

/**
 * Today's + overdue follow-ups for the current user.
 * Returns overdue first (ascending by followUpDate), then today's.
 */
export const getFollowUps = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, [
      "salesperson",
      "admin",
    ])
    if (!user) return []

    // End of today (23:59:59.999)
    const now = new Date()
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    ).getTime()

    const leads = await ctx.db
      .query("leads")
      .withIndex("byAssignedTo", (q) => q.eq("assignedTo", user._id))
      .collect()

    const followUps = leads.filter(
      (l) =>
        l.followUpDate !== undefined && l.followUpDate <= endOfToday
    )

    // Sort: ascending by followUpDate so overdue come first
    followUps.sort((a, b) => (a.followUpDate ?? 0) - (b.followUpDate ?? 0))

    return followUps
  },
})

/**
 * Counts per status for sidebar badges.
 * Salesperson sees only their own leads; admin sees all.
 */
export const countByStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserOrNull(ctx)
    if (!user) return {}

    let leads
    if (user.role === "salesperson") {
      leads = await ctx.db
        .query("leads")
        .withIndex("byAssignedTo", (q) => q.eq("assignedTo", user._id))
        .collect()
    } else {
      leads = await ctx.db.query("leads").collect()
    }

    const counts: Record<string, number> = {}
    for (const status of LEAD_STATUSES) {
      counts[status] = 0
    }
    for (const lead of leads) {
      counts[lead.status] = (counts[lead.status] ?? 0) + 1
    }
    return counts
  },
})

/**
 * Global search for Cmd+K. Searches by name and mobileNumber.
 * Returns max 10 results, scoped by role.
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []

    if (!args.query.trim()) return []

    // Search by name
    const byName = await ctx.db
      .query("leads")
      .withSearchIndex("searchByName", (q) =>
        q.search("name", args.query)
      )
      .collect()

    // Search by phone
    const byPhone = await ctx.db
      .query("leads")
      .withSearchIndex("searchByPhone", (q) =>
        q.search("mobileNumber", args.query)
      )
      .collect()

    // Merge and deduplicate
    const seen = new Set<string>()
    const merged = []
    for (const lead of [...byName, ...byPhone]) {
      if (seen.has(lead._id.toString())) continue
      seen.add(lead._id.toString())
      merged.push(lead)
    }

    // Filter by role
    let filtered = merged
    if (user.role === "salesperson") {
      filtered = merged.filter(
        (l) => l.assignedTo.toString() === user._id.toString()
      )
    } else if (user.role === "dsm") {
      filtered = merged.filter(
        (l) => l.submittedBy?.toString() === user._id.toString()
      )
    }

    return filtered.slice(0, 10)
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a single lead.
 * - DSM: auto-sets submittedBy, source="dsm", picks random available salesperson.
 * - Admin/Salesperson: assignedTo is required.
 */
export const create = mutation({
  args: {
    name: v.string(),
    mobileNumber: v.string(),
    email: v.optional(v.string()),
    budget: v.optional(v.string()),
    projectId: v.id("projects"),
    assignedTo: v.optional(v.id("users")),
    source: v.string(),
    notes: v.optional(v.string()),
    submittedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    // Validate project exists and is active
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error("Project not found")
    if (project.status !== "active")
      throw new Error("Project is not active")

    const now = Date.now()
    let assignedTo = args.assignedTo
    let source = args.source
    let submittedBy = args.submittedBy

    if (user.role === "dsm") {
      submittedBy = user._id
      source = "dsm"

      // Pick a random available salesperson for DSM submissions
      if (!assignedTo) {
        const salespeople = await ctx.db
          .query("users")
          .collect()
        const available = salespeople.filter(
          (u) => u.role === "salesperson" && u.isAvailable
        )
        if (available.length === 0)
          throw new Error("No available salespeople for lead allocation")
        const randomIndex = Math.floor(Math.random() * available.length)
        assignedTo = available[randomIndex]._id
      }
    }

    if (!assignedTo) {
      throw new Error("assignedTo is required for admin/salesperson leads")
    }

    const leadId = await ctx.db.insert("leads", {
      name: args.name,
      mobileNumber: args.mobileNumber,
      email: args.email,
      budget: args.budget,
      projectId: args.projectId,
      assignedTo,
      status: "New",
      source,
      submittedBy,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "lead",
      entityId: leadId,
      action: "lead_created",
      details: { name: args.name, source, assignedTo },
      performedBy: user._id,
    })

    return leadId
  },
})

/**
 * Update a lead's status with optional remark and follow-up date.
 */
export const updateStatus = mutation({
  args: {
    leadId: v.id("leads"),
    status: v.string(),
    remark: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
    // Visit fields (required when status = "Visit Scheduled")
    visitLocation: v.optional(v.string()), // "office" | "site" | "other"
    visitDate: v.optional(v.number()), // epoch ms
    visitAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, [
      "admin",
      "salesperson",
    ])

    const lead = await ctx.db.get(args.leadId)
    if (!lead) throw new Error("Lead not found")

    // Salesperson can only update leads assigned to them
    if (
      user.role === "salesperson" &&
      lead.assignedTo.toString() !== user._id.toString()
    ) {
      throw new Error("Unauthorized: this lead is not assigned to you")
    }

    if (!isValidLeadStatus(args.status)) {
      throw new Error(`Invalid status: ${args.status}`)
    }

    if (args.status === "Follow Up" && !args.followUpDate) {
      throw new Error("followUpDate is required when setting status to Follow Up")
    }

    if (args.status === "Visit Scheduled") {
      if (!args.visitLocation) {
        throw new Error("visitLocation is required when setting status to Visit Scheduled")
      }
      if (!args.visitDate) {
        throw new Error("visitDate is required when setting status to Visit Scheduled")
      }
    }

    const oldStatus = lead.status
    const now = Date.now()

    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    }

    if (args.status === "Follow Up") {
      patch.followUpDate = args.followUpDate
    } else {
      // Clear follow-up date for non-follow-up statuses
      patch.followUpDate = undefined
    }

    await ctx.db.patch(args.leadId, patch)

    await logActivity(ctx, {
      entityType: "lead",
      entityId: args.leadId,
      action: "status_changed",
      details: { oldStatus, newStatus: args.status },
      performedBy: user._id,
    })

    // Insert remark if provided
    if (args.remark && args.remark.trim().length > 0) {
      await ctx.db.insert("remarks", {
        leadId: args.leadId,
        content: args.remark,
        createdBy: user._id,
        createdAt: now,
      })
    }

    // Auto-messaging on status change
    if (oldStatus !== args.status) {
      const templates = await ctx.db
        .query("messageTemplates")
        .withIndex("byTriggerStatus", (q) => q.eq("triggerStatus", args.status))
        .collect()

      const activeTemplates = templates.filter((t) => t.isActive)

      if (activeTemplates.length > 0) {
        const project = await ctx.db.get(lead.projectId)
        const salesperson = await ctx.db.get(lead.assignedTo)

        for (const template of activeTemplates) {
          const resolvedMessage = resolveTemplate(
            template.bodyEn,
            lead,
            project,
            salesperson
          )

          if (template.triggerBehavior === "auto_schedule") {
            const delay = template.autoDelayMs ?? 0
            const messageId = await ctx.db.insert("scheduledMessages", {
              leadId: args.leadId,
              templateId: template._id,
              message: resolvedMessage,
              language: "en",
              scheduledAt: now + delay,
              channels: "both",
              whatsappStatus: delay === 0 ? "sending" : "pending",
              smsStatus: delay === 0 ? "sending" : "pending",
              triggerType: "auto_schedule",
              createdBy: user._id,
              createdAt: now,
            })

            // If no delay, send immediately
            if (delay === 0) {
              await ctx.scheduler.runAfter(0, internal.messaging.sendMessage, {
                messageId,
              })
            }

            await logActivity(ctx, {
              entityType: "lead",
              entityId: args.leadId,
              action: "message_auto_scheduled",
              details: { templateName: template.name, delayMs: delay },
              performedBy: user._id,
            })
          } else if (template.triggerBehavior === "auto_suggest") {
            await ctx.db.insert("scheduledMessages", {
              leadId: args.leadId,
              templateId: template._id,
              message: resolvedMessage,
              language: "en",
              scheduledAt: 0, // sentinel: not yet confirmed
              channels: "both",
              whatsappStatus: "pending",
              smsStatus: "pending",
              triggerType: "auto_suggest",
              createdBy: user._id,
              createdAt: now,
            })
          }
        }
      }

      // Visit management on status change
      if (args.status === "Visit Scheduled" && args.visitLocation && args.visitDate) {
        // Cancel any existing "expected" visits for this lead
        const existingVisits = await ctx.db
          .query("visits")
          .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
          .collect()
        for (const visit of existingVisits) {
          if (visit.checkinStatus === "expected") {
            await ctx.db.patch(visit._id, {
              checkinStatus: "no_show",
              updatedAt: now,
            })
          }
        }

        // Create new visit record
        await ctx.db.insert("visits", {
          visitType: "scheduled",
          leadId: args.leadId,
          projectId: lead.projectId,
          assignedTo: lead.assignedTo,
          visitLocation: args.visitLocation,
          visitAddress: args.visitAddress,
          visitDate: args.visitDate,
          checkinStatus: "expected",
          createdBy: user._id,
          createdAt: now,
          updatedAt: now,
        })

        await logActivity(ctx, {
          entityType: "visit",
          entityId: args.leadId,
          action: "visit_scheduled",
          details: {
            location: args.visitLocation,
            visitDate: args.visitDate,
            address: args.visitAddress,
          },
          performedBy: user._id,
        })
      }

      // Auto-mark visit as arrived when status changes to "Visit Done"
      if (args.status === "Visit Done") {
        const visits = await ctx.db
          .query("visits")
          .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
          .collect()
        const expectedVisit = visits.find((v) => v.checkinStatus === "expected")
        if (expectedVisit) {
          await ctx.db.patch(expectedVisit._id, {
            checkinStatus: "arrived",
            checkinAt: now,
            checkinBy: user._id,
            updatedAt: now,
          })
        }
      }

      // Cancel expected visits when moving away from "Visit Scheduled"
      if (oldStatus === "Visit Scheduled" && args.status !== "Visit Scheduled" && args.status !== "Visit Done") {
        const visits = await ctx.db
          .query("visits")
          .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
          .collect()
        for (const visit of visits) {
          if (visit.checkinStatus === "expected") {
            await ctx.db.patch(visit._id, {
              checkinStatus: "no_show",
              updatedAt: now,
            })
          }
        }
      }

      // Auto-create after-sales process when status changes to "Booking Done"
      if (args.status === "Booking Done") {
        const existingProcess = await ctx.db
          .query("afterSalesProcesses")
          .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
          .unique()

        if (!existingProcess) {
          const steps = buildInitialSteps()
          const processId = await ctx.db.insert("afterSalesProcesses", {
            leadId: args.leadId,
            assignedTo: lead.assignedTo,
            projectId: lead.projectId,
            status: "in_progress",
            currentStep: "booking_form_fillup",
            steps: JSON.stringify(steps),
            createdAt: now,
            updatedAt: now,
          })

          await logActivity(ctx, {
            entityType: "after_sales",
            entityId: processId,
            action: "process_auto_created",
            details: {
              leadId: args.leadId,
              trigger: "booking_done_status",
            },
            performedBy: user._id,
          })
        }
      }

      // Auto-create DSM commission when status changes to "Closed Won"
      if (args.status === "Closed Won" && lead.submittedBy && lead.source === "dsm") {
        // Check for duplicate commission
        const existingCommission = await ctx.db
          .query("dsmCommissionEntries")
          .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
          .first()

        if (!existingCommission) {
          const project = await ctx.db.get(lead.projectId)
          if (project?.dsmCommissionAmount && project.dsmCommissionAmount > 0) {
            const commissionId = await ctx.db.insert("dsmCommissionEntries", {
              dsmUserId: lead.submittedBy,
              type: "credit",
              amount: project.dsmCommissionAmount,
              leadId: args.leadId,
              projectId: lead.projectId,
              description: `Commission for ${lead.name} — ${project.name}`,
              isAutoGenerated: true,
              isVoided: false,
              createdBy: user._id,
              createdAt: now,
            })

            await logActivity(ctx, {
              entityType: "dsm_commission",
              entityId: commissionId,
              action: "commission_earned",
              details: {
                dsmUserId: lead.submittedBy,
                leadName: lead.name,
                projectName: project.name,
                amount: project.dsmCommissionAmount,
              },
              performedBy: user._id,
            })
          }
        }
      }
    }
  },
})

/**
 * Reassign a lead to a different salesperson. Admin only.
 */
export const reassign = mutation({
  args: {
    leadId: v.id("leads"),
    newAssignedTo: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    const lead = await ctx.db.get(args.leadId)
    if (!lead) throw new Error("Lead not found")

    const targetUser = await ctx.db.get(args.newAssignedTo)
    if (!targetUser) throw new Error("Target user not found")
    if (targetUser.role !== "salesperson")
      throw new Error("Can only reassign to a salesperson")

    const oldAssignedTo = lead.assignedTo

    await ctx.db.patch(args.leadId, {
      assignedTo: args.newAssignedTo,
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "lead",
      entityId: args.leadId,
      action: "lead_reassigned",
      details: {
        oldAssignedTo,
        newAssignedTo: args.newAssignedTo,
      },
      performedBy: user._id,
    })

    // Cascade reassign to after-sales process if one exists
    const afterSalesProcess = await ctx.db
      .query("afterSalesProcesses")
      .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
      .unique()

    if (afterSalesProcess) {
      await ctx.db.patch(afterSalesProcess._id, {
        assignedTo: args.newAssignedTo,
        updatedAt: Date.now(),
      })
    }
  },
})

/**
 * Update a lead's phone number. Admin or assigned salesperson.
 */
export const updatePhone = mutation({
  args: {
    leadId: v.id("leads"),
    mobileNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    const lead = await ctx.db.get(args.leadId)
    if (!lead) throw new Error("Lead not found")

    if (
      user.role === "salesperson" &&
      lead.assignedTo.toString() !== user._id.toString()
    ) {
      throw new Error("Unauthorized: this lead is not assigned to you")
    }

    const oldPhone = lead.mobileNumber
    await ctx.db.patch(args.leadId, {
      mobileNumber: args.mobileNumber,
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "lead",
      entityId: args.leadId,
      action: "phone_updated",
      details: { oldPhone, newPhone: args.mobileNumber },
      performedBy: user._id,
    })
  },
})

/**
 * Set or update a follow-up date on a lead.
 */
export const addFollowUp = mutation({
  args: {
    leadId: v.id("leads"),
    followUpDate: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, [
      "admin",
      "salesperson",
    ])

    const lead = await ctx.db.get(args.leadId)
    if (!lead) throw new Error("Lead not found")

    // Salesperson can only update leads assigned to them
    if (
      user.role === "salesperson" &&
      lead.assignedTo.toString() !== user._id.toString()
    ) {
      throw new Error("Unauthorized: this lead is not assigned to you")
    }

    const oldStatus = lead.status
    const now = Date.now()

    await ctx.db.patch(args.leadId, {
      status: "Follow Up",
      followUpDate: args.followUpDate,
      updatedAt: now,
    })

    // Log status change if it actually changed
    if (oldStatus !== "Follow Up") {
      await logActivity(ctx, {
        entityType: "lead",
        entityId: args.leadId,
        action: "status_changed",
        details: { oldStatus, newStatus: "Follow Up" },
        performedBy: user._id,
      })
    }

    await logActivity(ctx, {
      entityType: "lead",
      entityId: args.leadId,
      action: "followup_set",
      details: { followUpDate: args.followUpDate },
      performedBy: user._id,
    })
  },
})

/**
 * Bulk reassign multiple leads to a single salesperson. Admin only.
 */
export const bulkReassign = mutation({
  args: {
    leadIds: v.array(v.id("leads")),
    newAssignedTo: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    const targetUser = await ctx.db.get(args.newAssignedTo)
    if (!targetUser) throw new Error("Target user not found")
    if (targetUser.role !== "salesperson")
      throw new Error("Can only reassign to a salesperson")

    const now = Date.now()

    for (const leadId of args.leadIds) {
      const lead = await ctx.db.get(leadId)
      if (!lead) continue

      const oldAssignedTo = lead.assignedTo

      await ctx.db.patch(leadId, {
        assignedTo: args.newAssignedTo,
        updatedAt: now,
      })

      await logActivity(ctx, {
        entityType: "lead",
        entityId: leadId,
        action: "lead_reassigned",
        details: {
          oldAssignedTo,
          newAssignedTo: args.newAssignedTo,
          bulk: true,
        },
        performedBy: user._id,
      })
    }
  },
})

/**
 * Bulk update status for multiple leads. Admin only.
 */
export const bulkUpdateStatus = mutation({
  args: {
    leadIds: v.array(v.id("leads")),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    if (!isValidLeadStatus(args.status)) {
      throw new Error(`Invalid status: ${args.status}`)
    }

    const now = Date.now()

    for (const leadId of args.leadIds) {
      const lead = await ctx.db.get(leadId)
      if (!lead) continue

      const oldStatus = lead.status

      const patch: Record<string, unknown> = {
        status: args.status,
        updatedAt: now,
      }

      // Clear follow-up date if new status is not Follow Up
      if (args.status !== "Follow Up") {
        patch.followUpDate = undefined
      }

      await ctx.db.patch(leadId, patch)

      await logActivity(ctx, {
        entityType: "lead",
        entityId: leadId,
        action: "status_changed",
        details: { oldStatus, newStatus: args.status, bulk: true },
        performedBy: user._id,
      })
    }
  },
})
