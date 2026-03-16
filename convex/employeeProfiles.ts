import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import {
  getUserWithAnyRole,
  requireUser,
} from "./lib/auth"
import { logActivity } from "./lib/activityLogger"

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx)

    const isHROrAdmin = ["hr", "admin"].includes(currentUser.role)
    if (!isHROrAdmin && currentUser._id !== args.userId) {
      return null
    }

    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .unique()

    if (!profile) return null

    const user = await ctx.db.get(args.userId)
    const photoUrl = profile.photoStorageId
      ? await ctx.storage.getUrl(profile.photoStorageId)
      : null

    return { ...profile, user, photoUrl }
  },
})

export const getById = query({
  args: { profileId: v.id("employeeProfiles") },
  handler: async (ctx, args) => {
    const currentUser = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!currentUser) return null

    const profile = await ctx.db.get(args.profileId)
    if (!profile) return null

    const user = await ctx.db.get(profile.userId)
    const onboarding = await ctx.db
      .query("onboardingChecklists")
      .withIndex("byUserId", (q) => q.eq("userId", profile.userId))
      .unique()

    const photoUrl = profile.photoStorageId
      ? await ctx.storage.getUrl(profile.photoStorageId)
      : null

    // Enrich onboarding items with document URLs
    let enrichedOnboardingItems: {
      key: string
      label: string
      completedAt: number | null
      completedBy: string | null
      storageId?: string | null
      uploadedAt?: number | null
      documentUrl: string | null
    }[] | null = null

    if (onboarding) {
      const items = JSON.parse(onboarding.items) as {
        key: string
        label: string
        completedAt: number | null
        completedBy: string | null
        storageId?: string | null
        uploadedAt?: number | null
      }[]
      enrichedOnboardingItems = await Promise.all(
        items.map(async (item) => ({
          ...item,
          documentUrl: item.storageId
            ? await ctx.storage.getUrl(item.storageId as Id<"_storage">)
            : null,
        }))
      )
    }

    return { ...profile, user, onboarding, photoUrl, enrichedOnboardingItems }
  },
})

export const listAll = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.string()),
    onboardingStatus: v.optional(v.string()),
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUser = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!currentUser) return []

    const profiles = await ctx.db.query("employeeProfiles").collect()

    const results = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId)
        if (!user) return null

        const onboarding = await ctx.db
          .query("onboardingChecklists")
          .withIndex("byUserId", (q) => q.eq("userId", profile.userId))
          .unique()

        return { ...profile, user, onboarding }
      })
    )

    let filtered = results.filter(
      (r): r is NonNullable<typeof r> => r !== null
    )

    if (args.search) {
      const term = args.search.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.user.name.toLowerCase().includes(term) ||
          r.user.email?.toLowerCase().includes(term) ||
          r.user.phone?.toLowerCase().includes(term)
      )
    }

    if (args.role) {
      filtered = filtered.filter((r) => r.user.role === args.role)
    }

    if (args.onboardingStatus) {
      filtered = filtered.filter(
        (r) => r.onboarding?.status === args.onboardingStatus
      )
    }

    if (args.department) {
      filtered = filtered.filter(
        (r) => r.department === args.department
      )
    }

    // Sort: pending onboarding first, then in_progress, then completed
    const statusOrder: Record<string, number> = {
      pending: 0,
      in_progress: 1,
      completed: 2,
    }
    filtered.sort((a, b) => {
      const aOrder = statusOrder[a.onboarding?.status ?? "completed"] ?? 2
      const bOrder = statusOrder[b.onboarding?.status ?? "completed"] ?? 2
      if (aOrder !== bOrder) return aOrder - bOrder
      return b.createdAt - a.createdAt
    })

    return filtered
  },
})

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!currentUser)
      return {
        totalEmployees: 0,
        pendingOnboardings: 0,
        inProgressOnboardings: 0,
        newThisMonth: 0,
      }

    const profiles = await ctx.db.query("employeeProfiles").collect()
    const checklists = await ctx.db.query("onboardingChecklists").collect()

    const now = new Date()
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime()

    return {
      totalEmployees: profiles.length,
      pendingOnboardings: checklists.filter(
        (c) => c.status === "pending"
      ).length,
      inProgressOnboardings: checklists.filter(
        (c) => c.status === "in_progress"
      ).length,
      newThisMonth: profiles.filter((p) => p.createdAt >= startOfMonth)
        .length,
    }
  },
})

const profileFields = {
  dateOfBirth: v.optional(v.string()),
  gender: v.optional(v.string()),
  fatherName: v.optional(v.string()),
  motherName: v.optional(v.string()),
  maritalStatus: v.optional(v.string()),
  bloodGroup: v.optional(v.string()),
  panNumber: v.optional(v.string()),
  aadharNumber: v.optional(v.string()),
  address: v.optional(v.string()),
  bankName: v.optional(v.string()),
  accountNumber: v.optional(v.string()),
  ifscCode: v.optional(v.string()),
  emergencyContactName: v.optional(v.string()),
  emergencyContactPhone: v.optional(v.string()),
  emergencyContactRelation: v.optional(v.string()),
  dateOfJoining: v.optional(v.string()),
  designation: v.optional(v.string()),
  department: v.optional(v.string()),
}

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    ...profileFields,
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx)
    const isHROrAdmin = ["hr", "admin"].includes(currentUser.role)

    if (!isHROrAdmin && currentUser._id !== args.userId) {
      throw new Error("Unauthorized: can only update own profile")
    }

    const { userId, ...fields } = args

    // Self-service users cannot change designation/department/dateOfJoining
    if (!isHROrAdmin) {
      delete fields.designation
      delete fields.department
      delete fields.dateOfJoining
    }

    const existing = await ctx.db
      .query("employeeProfiles")
      .withIndex("byUserId", (q) => q.eq("userId", userId))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...fields,
        updatedAt: Date.now(),
      })

      await logActivity(ctx, {
        entityType: "employee",
        entityId: existing._id,
        action: "profile_updated",
        details: { fields: Object.keys(fields) },
        performedBy: currentUser._id,
      })

      return existing._id
    } else {
      const profileId = await ctx.db.insert("employeeProfiles", {
        userId,
        ...fields,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      await logActivity(ctx, {
        entityType: "employee",
        entityId: profileId,
        action: "profile_created",
        performedBy: currentUser._id,
      })

      return profileId
    }
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const updatePhoto = mutation({
  args: {
    userId: v.id("users"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireUser(ctx)
    const isHROrAdmin = ["hr", "admin"].includes(currentUser.role)

    if (!isHROrAdmin && currentUser._id !== args.userId) {
      throw new Error("Unauthorized")
    }

    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .unique()

    if (!profile) throw new Error("Employee profile not found")

    await ctx.db.patch(profile._id, {
      photoStorageId: args.storageId,
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "employee",
      entityId: profile._id,
      action: "photo_updated",
      performedBy: currentUser._id,
    })
  },
})
