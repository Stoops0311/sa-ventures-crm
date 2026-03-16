import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserOrNull, getUserWithAnyRole, requireUser, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { isValidInsuranceStatus } from "./lib/constants"

// ── Queries ─────────────────────────────────────────────────────

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null

    const isHROrAdmin = user.role === "hr" || user.role === "admin"
    if (!isHROrAdmin && user._id !== args.userId) return null

    return await ctx.db
      .query("insuranceEnrollments")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .first()
  },
})

export const listAll = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return []

    let enrollments
    if (args.status) {
      enrollments = await ctx.db
        .query("insuranceEnrollments")
        .withIndex("byStatus", (q) => q.eq("status", args.status!))
        .collect()
    } else {
      enrollments = await ctx.db.query("insuranceEnrollments").collect()
    }

    // Batch-fetch user data
    const userIds = [...new Set(enrollments.map((e) => e.userId))]
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
    const userMap = new Map(userIds.map((id, i) => [id, users[i]]))

    return enrollments.map((enrollment) => {
      const empUser = userMap.get(enrollment.userId)
      return {
        ...enrollment,
        employeeName: empUser?.name ?? "Unknown",
        employeeEmail: empUser?.email ?? null,
      }
    })
  },
})

export const getExpiringSoon = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return []

    const daysThreshold = args.days ?? 30
    const now = new Date()
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000)
    const thresholdStr = thresholdDate.toISOString().split("T")[0]
    const todayStr = now.toISOString().split("T")[0]

    const enrollments = await ctx.db.query("insuranceEnrollments").collect()

    const expiring = enrollments.filter((e) => {
      if (!e.expiryDate) return false
      return e.expiryDate >= todayStr && e.expiryDate <= thresholdStr
    })

    // Batch-fetch user data
    const userIds = [...new Set(expiring.map((e) => e.userId))]
    const users = await Promise.all(userIds.map((id) => ctx.db.get(id)))
    const userMap = new Map(userIds.map((id, i) => [id, users[i]]))

    return expiring
      .map((enrollment) => {
        const empUser = userMap.get(enrollment.userId)
        const expiryDate = new Date(enrollment.expiryDate + "T00:00:00")
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        return {
          ...enrollment,
          employeeName: empUser?.name ?? "Unknown",
          daysRemaining,
        }
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
  },
})

export const listDocuments = query({
  args: { enrollmentId: v.id("insuranceEnrollments") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []

    const enrollment = await ctx.db.get(args.enrollmentId)
    if (!enrollment) return []

    const isHROrAdmin = user.role === "hr" || user.role === "admin"
    if (!isHROrAdmin && user._id !== enrollment.userId) return []

    const docs = await ctx.db
      .query("insuranceDocuments")
      .withIndex("byInsuranceEnrollmentId", (q) => q.eq("insuranceEnrollmentId", args.enrollmentId))
      .collect()

    return await Promise.all(
      docs.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId)
        return { ...doc, downloadUrl: url }
      })
    )
  },
})

export const getStats = query({
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return null

    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const todayStr = now.toISOString().split("T")[0]
    const thirtyStr = thirtyDays.toISOString().split("T")[0]
    const sevenStr = sevenDays.toISOString().split("T")[0]

    const enrollments = await ctx.db.query("insuranceEnrollments").collect()

    const expiringWithin30 = enrollments.filter((e) =>
      e.expiryDate && e.expiryDate >= todayStr && e.expiryDate <= thirtyStr
    ).length

    const expiringWithin7 = enrollments.filter((e) =>
      e.expiryDate && e.expiryDate >= todayStr && e.expiryDate <= sevenStr
    ).length

    return { expiringWithin30, expiringWithin7 }
  },
})

// ── Mutations ───────────────────────────────────────────────────

export const enroll = mutation({
  args: {
    nomineeName: v.string(),
    nomineeRelation: v.string(),
    nomineeDob: v.string(),
    existingConditions: v.boolean(),
    dependents: v.optional(v.string()),
    preExistingDetails: v.optional(v.string()),
    preferredHospital: v.optional(v.string()),
    sumInsured: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    // Check if already enrolled
    const existing = await ctx.db
      .query("insuranceEnrollments")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .first()

    if (existing) {
      // Update existing enrollment (only if still pending)
      if (existing.status !== "pending") {
        throw new Error("Cannot modify enrollment after it has been processed")
      }
      await ctx.db.patch(existing._id, {
        nomineeName: args.nomineeName,
        nomineeRelation: args.nomineeRelation,
        nomineeDob: args.nomineeDob,
        existingConditions: args.existingConditions,
        dependents: args.dependents,
        preExistingDetails: args.preExistingDetails,
        preferredHospital: args.preferredHospital,
        sumInsured: args.sumInsured,
        updatedAt: Date.now(),
      })

      await logActivity(ctx, {
        entityType: "insurance",
        entityId: existing._id,
        action: "insurance_enrollment_updated",
        details: { employeeName: user.name },
        performedBy: user._id,
      })

      return existing._id
    }

    const now = Date.now()
    const enrollmentId = await ctx.db.insert("insuranceEnrollments", {
      userId: user._id,
      nomineeName: args.nomineeName,
      nomineeRelation: args.nomineeRelation,
      nomineeDob: args.nomineeDob,
      existingConditions: args.existingConditions,
      dependents: args.dependents,
      preExistingDetails: args.preExistingDetails,
      preferredHospital: args.preferredHospital,
      sumInsured: args.sumInsured,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "insurance",
      entityId: enrollmentId,
      action: "insurance_enrollment_submitted",
      details: { employeeName: user.name },
      performedBy: user._id,
    })

    return enrollmentId
  },
})

export const updateTracker = mutation({
  args: {
    enrollmentId: v.id("insuranceEnrollments"),
    policyNumber: v.optional(v.string()),
    expiryDate: v.optional(v.string()),
    renewalReminderDate: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    const enrollment = await ctx.db.get(args.enrollmentId)
    if (!enrollment) throw new Error("Enrollment not found")

    if (args.status && !isValidInsuranceStatus(args.status)) {
      throw new Error(`Invalid insurance status: ${args.status}`)
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() }
    if (args.policyNumber !== undefined) updates.policyNumber = args.policyNumber
    if (args.expiryDate !== undefined) updates.expiryDate = args.expiryDate
    if (args.renewalReminderDate !== undefined) updates.renewalReminderDate = args.renewalReminderDate
    if (args.status !== undefined) updates.status = args.status

    await ctx.db.patch(args.enrollmentId, updates)

    const empUser = await ctx.db.get(enrollment.userId)
    await logActivity(ctx, {
      entityType: "insurance",
      entityId: args.enrollmentId,
      action: "insurance_tracker_updated",
      details: {
        employeeName: empUser?.name,
        updatedFields: Object.keys(updates).filter((k) => k !== "updatedAt"),
      },
      performedBy: user._id,
    })
  },
})

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await requireUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const uploadDocument = mutation({
  args: {
    enrollmentId: v.id("insuranceEnrollments"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    const enrollment = await ctx.db.get(args.enrollmentId)
    if (!enrollment) throw new Error("Enrollment not found")

    const isHROrAdmin = user.role === "hr" || user.role === "admin"
    if (!isHROrAdmin && user._id !== enrollment.userId) {
      throw new Error("Unauthorized")
    }

    const docId = await ctx.db.insert("insuranceDocuments", {
      insuranceEnrollmentId: args.enrollmentId,
      userId: enrollment.userId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      createdAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "insurance",
      entityId: args.enrollmentId,
      action: "insurance_document_uploaded",
      details: { fileName: args.fileName },
      performedBy: user._id,
    })

    return docId
  },
})

export const removeDocument = mutation({
  args: { documentId: v.id("insuranceDocuments") },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    const doc = await ctx.db.get(args.documentId)
    if (!doc) throw new Error("Document not found")

    await ctx.storage.delete(doc.storageId)
    await ctx.db.delete(args.documentId)

    await logActivity(ctx, {
      entityType: "insurance",
      entityId: doc.insuranceEnrollmentId,
      action: "insurance_document_removed",
      details: { fileName: doc.fileName },
      performedBy: user._id,
    })
  },
})
