import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import {
  getUserOrNull,
  requireUserWithAnyRole,
  requireUserWithRole,
} from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import {
  AFTER_SALES_STEPS,
  isValidAfterSalesStep,
  isValidAfterSalesProcessStatus,
} from "./lib/constants"
import type { Id } from "./_generated/dataModel"

// ─── Types ────────────────────────────────────────────────────────────────────

type AfterSalesStep = {
  key: string
  label: string
  status: "pending" | "in_progress" | "completed" | "skipped"
  completedAt: number | null
  completedBy: string | null
  remark: string | null
  // Financial
  amount: number | null
  paymentMode: string | null
  // Documents
  documents: Array<{ storageId: string; fileName: string; uploadedAt: number }> | null
  // Loan
  bankName: string | null
  loanAmount: number | null
  sanctionDate: string | null
  // Registration
  registrationNumber: string | null
  registrationDate: string | null
  // Disbursement
  disbursementAmount: number | null
  disbursementDate: string | null
  // Booking
  bookingAmount: number | null
}

function parseSteps(json: string): AfterSalesStep[] {
  return JSON.parse(json)
}

export function buildInitialSteps(): AfterSalesStep[] {
  return AFTER_SALES_STEPS.map((s, i) => ({
    key: s.key,
    label: s.label,
    status: i === 0 ? ("in_progress" as const) : ("pending" as const),
    completedAt: null,
    completedBy: null,
    remark: null,
    amount: null,
    paymentMode: null,
    documents: null,
    bankName: null,
    loanAmount: null,
    sanctionDate: null,
    registrationNumber: null,
    registrationDate: null,
    disbursementAmount: null,
    disbursementDate: null,
    bookingAmount: null,
  }))
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get after-sales process by lead ID. Used in lead detail banner.
 */
export const getByLeadId = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null

    const process = await ctx.db
      .query("afterSalesProcesses")
      .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
      .unique()

    if (!process) return null

    // Role-based access
    if (user.role === "admin") {
      // OK
    } else if (user.role === "salesperson") {
      if (process.assignedTo.toString() !== user._id.toString()) return null
    } else {
      return null
    }

    const steps = parseSteps(process.steps)
    const completedCount = steps.filter(
      (s) => s.status === "completed" || s.status === "skipped"
    ).length

    // Enrich document URLs
    const enrichedSteps = await Promise.all(
      steps.map(async (step) => {
        if (!step.documents || step.documents.length === 0)
          return { ...step, enrichedDocuments: null }
        const enrichedDocuments = await Promise.all(
          step.documents.map(async (doc) => ({
            ...doc,
            url: await ctx.storage.getUrl(doc.storageId as Id<"_storage">),
          }))
        )
        return { ...step, enrichedDocuments }
      })
    )

    const currentStepDef = AFTER_SALES_STEPS.find(
      (s) => s.key === process.currentStep
    )

    return {
      ...process,
      parsedSteps: enrichedSteps,
      completedCount,
      totalSteps: steps.length,
      currentStepLabel: currentStepDef?.label ?? process.currentStep,
    }
  },
})

/**
 * Get a process directly by its ID. For the full dialog view.
 */
export const getById = query({
  args: { processId: v.id("afterSalesProcesses") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null

    const process = await ctx.db.get(args.processId)
    if (!process) return null

    if (
      user.role !== "admin" &&
      process.assignedTo.toString() !== user._id.toString()
    ) {
      return null
    }

    const steps = parseSteps(process.steps)
    const completedCount = steps.filter(
      (s) => s.status === "completed" || s.status === "skipped"
    ).length

    // Enrich with lead and project info
    const lead = await ctx.db.get(process.leadId)
    const project = await ctx.db.get(process.projectId)
    const assignedUser = await ctx.db.get(process.assignedTo)

    // Enrich document URLs
    const enrichedSteps = await Promise.all(
      steps.map(async (step) => {
        if (!step.documents || step.documents.length === 0)
          return { ...step, enrichedDocuments: null }
        const enrichedDocuments = await Promise.all(
          step.documents.map(async (doc) => ({
            ...doc,
            url: await ctx.storage.getUrl(doc.storageId as Id<"_storage">),
          }))
        )
        return { ...step, enrichedDocuments }
      })
    )

    const currentStepDef = AFTER_SALES_STEPS.find(
      (s) => s.key === process.currentStep
    )

    return {
      ...process,
      parsedSteps: enrichedSteps,
      completedCount,
      totalSteps: steps.length,
      currentStepLabel: currentStepDef?.label ?? process.currentStep,
      leadName: lead?.name ?? "Unknown",
      leadPhone: lead?.mobileNumber ?? "",
      projectName: project?.name ?? "Unknown",
      assignedUserName: assignedUser?.name ?? "Unknown",
    }
  },
})

/**
 * Salesperson's own after-sales processes.
 */
export const getMyProcesses = query({
  args: {
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []
    if (user.role !== "salesperson" && user.role !== "admin") return []

    let processes
    if (args.status) {
      processes = await ctx.db
        .query("afterSalesProcesses")
        .withIndex("byAssignedToAndStatus", (q) =>
          q.eq("assignedTo", user._id).eq("status", args.status!)
        )
        .order("desc")
        .collect()
    } else {
      processes = await ctx.db
        .query("afterSalesProcesses")
        .withIndex("byAssignedTo", (q) => q.eq("assignedTo", user._id))
        .order("desc")
        .collect()
    }

    const enriched = await Promise.all(
      processes.map(async (process) => {
        const lead = await ctx.db.get(process.leadId)
        const project = await ctx.db.get(process.projectId)
        const steps = parseSteps(process.steps)
        const completedCount = steps.filter(
          (s) => s.status === "completed" || s.status === "skipped"
        ).length
        const currentStepDef = AFTER_SALES_STEPS.find(
          (s) => s.key === process.currentStep
        )

        return {
          ...process,
          leadName: lead?.name ?? "Unknown",
          leadPhone: lead?.mobileNumber ?? "",
          projectName: project?.name ?? "Unknown",
          completedCount,
          totalSteps: steps.length,
          currentStepLabel: currentStepDef?.label ?? process.currentStep,
        }
      })
    )

    return enriched
  },
})

/**
 * Admin list of all after-sales processes with optional filters.
 */
export const listAll = query({
  args: {
    status: v.optional(v.string()),
    currentStep: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user || user.role !== "admin") return []

    let processes
    if (args.assignedTo) {
      processes = await ctx.db
        .query("afterSalesProcesses")
        .withIndex("byAssignedTo", (q) =>
          q.eq("assignedTo", args.assignedTo!)
        )
        .order("desc")
        .collect()
    } else if (args.status) {
      processes = await ctx.db
        .query("afterSalesProcesses")
        .withIndex("byStatus", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect()
    } else {
      processes = await ctx.db
        .query("afterSalesProcesses")
        .order("desc")
        .collect()
    }

    // Post-filter remaining criteria
    if (args.currentStep) {
      processes = processes.filter((p) => p.currentStep === args.currentStep)
    }
    if (args.projectId) {
      processes = processes.filter(
        (p) => p.projectId.toString() === args.projectId!.toString()
      )
    }
    if (args.status && args.assignedTo) {
      processes = processes.filter((p) => p.status === args.status)
    }

    const enriched = await Promise.all(
      processes.map(async (process) => {
        const lead = await ctx.db.get(process.leadId)
        const assignedUser = await ctx.db.get(process.assignedTo)
        const project = await ctx.db.get(process.projectId)
        const steps = parseSteps(process.steps)
        const completedCount = steps.filter(
          (s) => s.status === "completed" || s.status === "skipped"
        ).length

        return {
          ...process,
          leadName: lead?.name ?? "Unknown",
          leadPhone: lead?.mobileNumber ?? "",
          assignedUserName: assignedUser?.name ?? "Unknown",
          projectName: project?.name ?? "Unknown",
          completedCount,
          totalSteps: steps.length,
        }
      })
    )

    return enriched
  },
})

/**
 * Dashboard statistics for after-sales processes.
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null
    if (user.role !== "admin" && user.role !== "salesperson") return null

    let processes
    if (user.role === "admin") {
      processes = await ctx.db.query("afterSalesProcesses").collect()
    } else {
      processes = await ctx.db
        .query("afterSalesProcesses")
        .withIndex("byAssignedTo", (q) => q.eq("assignedTo", user._id))
        .collect()
    }

    const now = Date.now()
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000

    const inProgress = processes.filter((p) => p.status === "in_progress")
    const onHold = processes.filter((p) => p.status === "on_hold")
    const completed = processes.filter((p) => p.status === "completed")
    const stale = inProgress.filter(
      (p) => now - p.updatedAt > fiveDaysMs
    )

    // Count by current step (for in-progress only)
    const byStep: Record<string, number> = {}
    for (const p of inProgress) {
      byStep[p.currentStep] = (byStep[p.currentStep] ?? 0) + 1
    }

    return {
      total: processes.length,
      inProgress: inProgress.length,
      onHold: onHold.length,
      completed: completed.length,
      stale: stale.length,
      byStep,
    }
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Manually create an after-sales process for a lead.
 * Used for backfill or edge cases where auto-creation didn't fire.
 */
export const create = mutation({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    const lead = await ctx.db.get(args.leadId)
    if (!lead) throw new Error("Lead not found")

    if (lead.status !== "Booking Done" && lead.status !== "Closed Won") {
      throw new Error(
        "Lead must be at 'Booking Done' or 'Closed Won' status"
      )
    }

    // Check no existing process
    const existing = await ctx.db
      .query("afterSalesProcesses")
      .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
      .unique()

    if (existing) {
      throw new Error("After-sales process already exists for this lead")
    }

    // Salesperson can only create for their own leads
    if (
      user.role === "salesperson" &&
      lead.assignedTo.toString() !== user._id.toString()
    ) {
      throw new Error("Unauthorized: this lead is not assigned to you")
    }

    const now = Date.now()
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
      action: "process_created",
      details: { leadId: args.leadId, leadName: lead.name },
      performedBy: user._id,
    })

    return processId
  },
})

/**
 * Complete the current step with optional data.
 */
export const completeStep = mutation({
  args: {
    processId: v.id("afterSalesProcesses"),
    stepKey: v.string(),
    remark: v.optional(v.string()),
    // Financial
    amount: v.optional(v.number()),
    paymentMode: v.optional(v.string()),
    // Loan
    bankName: v.optional(v.string()),
    loanAmount: v.optional(v.number()),
    sanctionDate: v.optional(v.string()),
    // Registration
    registrationNumber: v.optional(v.string()),
    registrationDate: v.optional(v.string()),
    // Disbursement
    disbursementAmount: v.optional(v.number()),
    disbursementDate: v.optional(v.string()),
    // Booking
    bookingAmount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    const process = await ctx.db.get(args.processId)
    if (!process) throw new Error("After-sales process not found")
    if (process.status === "completed")
      throw new Error("Process is already completed")

    if (
      user.role === "salesperson" &&
      process.assignedTo.toString() !== user._id.toString()
    ) {
      throw new Error("Unauthorized: this process is not assigned to you")
    }

    if (!isValidAfterSalesStep(args.stepKey)) {
      throw new Error(`Invalid step: ${args.stepKey}`)
    }

    const steps = parseSteps(process.steps)
    const stepIndex = steps.findIndex((s) => s.key === args.stepKey)
    if (stepIndex === -1) throw new Error("Step not found")

    const step = steps[stepIndex]

    // Enforce sequential: all prior steps must be completed or skipped
    for (let i = 0; i < stepIndex; i++) {
      if (
        steps[i].status !== "completed" &&
        steps[i].status !== "skipped"
      ) {
        throw new Error(
          `Cannot complete "${step.label}" — step "${steps[i].label}" must be completed first`
        )
      }
    }

    if (step.status === "completed") {
      throw new Error(`Step "${step.label}" is already completed`)
    }
    if (step.status === "skipped") {
      throw new Error(`Step "${step.label}" was skipped`)
    }

    const now = Date.now()

    // Update step data
    step.status = "completed"
    step.completedAt = now
    step.completedBy = user._id.toString()
    step.remark = args.remark ?? null

    // Step-specific fields
    if (args.amount !== undefined) step.amount = args.amount
    if (args.paymentMode !== undefined) step.paymentMode = args.paymentMode
    if (args.bankName !== undefined) step.bankName = args.bankName
    if (args.loanAmount !== undefined) step.loanAmount = args.loanAmount
    if (args.sanctionDate !== undefined) step.sanctionDate = args.sanctionDate
    if (args.registrationNumber !== undefined)
      step.registrationNumber = args.registrationNumber
    if (args.registrationDate !== undefined)
      step.registrationDate = args.registrationDate
    if (args.disbursementAmount !== undefined)
      step.disbursementAmount = args.disbursementAmount
    if (args.disbursementDate !== undefined)
      step.disbursementDate = args.disbursementDate
    if (args.bookingAmount !== undefined)
      step.bookingAmount = args.bookingAmount

    // Determine new current step and overall status
    const nextPending = steps.find(
      (s) => s.status === "pending" || s.status === "in_progress"
    )

    // Set next step to in_progress if it's pending
    if (nextPending && nextPending.status === "pending") {
      nextPending.status = "in_progress"
    }

    const allDone = steps.every(
      (s) => s.status === "completed" || s.status === "skipped"
    )

    const patch: Record<string, unknown> = {
      steps: JSON.stringify(steps),
      updatedAt: now,
    }

    if (allDone) {
      patch.status = "completed"
      patch.completedAt = now
      patch.currentStep = args.stepKey
    } else if (nextPending) {
      patch.currentStep = nextPending.key
    }

    await ctx.db.patch(args.processId, patch)

    await logActivity(ctx, {
      entityType: "after_sales",
      entityId: args.processId,
      action: "step_completed",
      details: {
        stepKey: args.stepKey,
        stepLabel: step.label,
        stepIndex: stepIndex + 1,
        totalSteps: steps.length,
      },
      performedBy: user._id,
    })

    // If all done, auto-transition lead to "Closed Won"
    if (allDone) {
      await logActivity(ctx, {
        entityType: "after_sales",
        entityId: args.processId,
        action: "process_completed",
        details: { leadId: process.leadId },
        performedBy: user._id,
      })

      const lead = await ctx.db.get(process.leadId)
      if (lead && lead.status !== "Closed Won") {
        const oldStatus = lead.status
        await ctx.db.patch(process.leadId, {
          status: "Closed Won",
          updatedAt: now,
        })

        await logActivity(ctx, {
          entityType: "lead",
          entityId: process.leadId,
          action: "status_changed",
          details: {
            oldStatus,
            newStatus: "Closed Won",
            trigger: "after_sales_completed",
          },
          performedBy: user._id,
        })
      }
    }
  },
})

/**
 * Skip a step (admin only). For cases like cash purchases (no loan steps).
 */
export const skipStep = mutation({
  args: {
    processId: v.id("afterSalesProcesses"),
    stepKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    const process = await ctx.db.get(args.processId)
    if (!process) throw new Error("After-sales process not found")
    if (process.status === "completed")
      throw new Error("Process is already completed")

    const steps = parseSteps(process.steps)
    const stepIndex = steps.findIndex((s) => s.key === args.stepKey)
    if (stepIndex === -1) throw new Error("Step not found")

    const step = steps[stepIndex]
    if (step.status === "completed")
      throw new Error("Cannot skip a completed step")
    if (step.status === "skipped")
      throw new Error("Step is already skipped")

    const now = Date.now()

    step.status = "skipped"
    step.completedAt = now
    step.completedBy = user._id.toString()

    // If this was the current step, advance to next
    const nextPending = steps.find(
      (s) => s.status === "pending" || s.status === "in_progress"
    )
    if (nextPending && nextPending.status === "pending") {
      nextPending.status = "in_progress"
    }

    const allDone = steps.every(
      (s) => s.status === "completed" || s.status === "skipped"
    )

    const patch: Record<string, unknown> = {
      steps: JSON.stringify(steps),
      updatedAt: now,
    }

    if (allDone) {
      patch.status = "completed"
      patch.completedAt = now
      patch.currentStep = args.stepKey
    } else if (nextPending) {
      patch.currentStep = nextPending.key
    }

    await ctx.db.patch(args.processId, patch)

    await logActivity(ctx, {
      entityType: "after_sales",
      entityId: args.processId,
      action: "step_skipped",
      details: {
        stepKey: args.stepKey,
        stepLabel: step.label,
      },
      performedBy: user._id,
    })

    // Check if all done after skip
    if (allDone) {
      await logActivity(ctx, {
        entityType: "after_sales",
        entityId: args.processId,
        action: "process_completed",
        details: { leadId: process.leadId },
        performedBy: user._id,
      })

      const lead = await ctx.db.get(process.leadId)
      if (lead && lead.status !== "Closed Won") {
        const oldStatus = lead.status
        await ctx.db.patch(process.leadId, {
          status: "Closed Won",
          updatedAt: now,
        })

        await logActivity(ctx, {
          entityType: "lead",
          entityId: process.leadId,
          action: "status_changed",
          details: {
            oldStatus,
            newStatus: "Closed Won",
            trigger: "after_sales_completed",
          },
          performedBy: user._id,
        })
      }
    }
  },
})

/**
 * Change overall process status (in_progress / on_hold).
 */
export const updateStatus = mutation({
  args: {
    processId: v.id("afterSalesProcesses"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    if (!isValidAfterSalesProcessStatus(args.status)) {
      throw new Error(`Invalid status: ${args.status}`)
    }

    const process = await ctx.db.get(args.processId)
    if (!process) throw new Error("After-sales process not found")

    if (
      user.role === "salesperson" &&
      process.assignedTo.toString() !== user._id.toString()
    ) {
      throw new Error("Unauthorized")
    }

    const oldStatus = process.status

    await ctx.db.patch(args.processId, {
      status: args.status,
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "after_sales",
      entityId: args.processId,
      action: "status_changed",
      details: { oldStatus, newStatus: args.status },
      performedBy: user._id,
    })
  },
})

/**
 * Upload a document to a document-type step.
 */
export const uploadDocument = mutation({
  args: {
    processId: v.id("afterSalesProcesses"),
    stepKey: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    const process = await ctx.db.get(args.processId)
    if (!process) throw new Error("After-sales process not found")

    if (
      user.role === "salesperson" &&
      process.assignedTo.toString() !== user._id.toString()
    ) {
      throw new Error("Unauthorized")
    }

    const steps = parseSteps(process.steps)
    const step = steps.find((s) => s.key === args.stepKey)
    if (!step) throw new Error("Step not found")

    if (!step.documents) {
      step.documents = []
    }

    step.documents.push({
      storageId: args.storageId as string,
      fileName: args.fileName,
      uploadedAt: Date.now(),
    })

    await ctx.db.patch(args.processId, {
      steps: JSON.stringify(steps),
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "after_sales",
      entityId: args.processId,
      action: "document_uploaded",
      details: { stepKey: args.stepKey, fileName: args.fileName },
      performedBy: user._id,
    })
  },
})

/**
 * Remove a document from a step (only before step is completed).
 */
export const removeDocument = mutation({
  args: {
    processId: v.id("afterSalesProcesses"),
    stepKey: v.string(),
    storageId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    const process = await ctx.db.get(args.processId)
    if (!process) throw new Error("After-sales process not found")

    if (
      user.role === "salesperson" &&
      process.assignedTo.toString() !== user._id.toString()
    ) {
      throw new Error("Unauthorized")
    }

    const steps = parseSteps(process.steps)
    const step = steps.find((s) => s.key === args.stepKey)
    if (!step) throw new Error("Step not found")

    if (step.status === "completed") {
      throw new Error("Cannot remove document from a completed step")
    }

    if (!step.documents) throw new Error("No documents on this step")

    const docIndex = step.documents.findIndex(
      (d) => d.storageId === args.storageId
    )
    if (docIndex === -1) throw new Error("Document not found")

    await ctx.storage.delete(args.storageId as Id<"_storage">)

    step.documents.splice(docIndex, 1)
    if (step.documents.length === 0) step.documents = null

    await ctx.db.patch(args.processId, {
      steps: JSON.stringify(steps),
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "after_sales",
      entityId: args.processId,
      action: "document_removed",
      details: { stepKey: args.stepKey },
      performedBy: user._id,
    })
  },
})

/**
 * Update remark on any step (even completed ones).
 */
export const updateStepRemark = mutation({
  args: {
    processId: v.id("afterSalesProcesses"),
    stepKey: v.string(),
    remark: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    const process = await ctx.db.get(args.processId)
    if (!process) throw new Error("After-sales process not found")

    if (
      user.role === "salesperson" &&
      process.assignedTo.toString() !== user._id.toString()
    ) {
      throw new Error("Unauthorized")
    }

    const steps = parseSteps(process.steps)
    const step = steps.find((s) => s.key === args.stepKey)
    if (!step) throw new Error("Step not found")

    step.remark = args.remark

    await ctx.db.patch(args.processId, {
      steps: JSON.stringify(steps),
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "after_sales",
      entityId: args.processId,
      action: "remark_updated",
      details: { stepKey: args.stepKey },
      performedBy: user._id,
    })
  },
})

/**
 * Generate upload URL for document uploads.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserWithAnyRole(ctx, ["admin", "salesperson"])
    return await ctx.storage.generateUploadUrl()
  },
})
