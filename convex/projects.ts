import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserOrNull, requireUserWithRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const list = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []

    if (args.status) {
      return await ctx.db
        .query("projects")
        .withIndex("byStatus", (q) => q.eq("status", args.status!))
        .collect()
    }

    return await ctx.db.query("projects").collect()
  },
})

export const getById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null
    const project = await ctx.db.get(args.projectId)
    if (!project) throw new Error("Project not found")
    return project
  },
})

const projectOptionalFields = {
  description: v.optional(v.string()),
  amenities: v.optional(v.array(v.string())),
  configurations: v.optional(v.string()),
  possessionDate: v.optional(v.string()),
  developerName: v.optional(v.string()),
  reraNumber: v.optional(v.string()),
  mapEmbedUrl: v.optional(v.string()),
  // Property classification
  propertyType: v.optional(v.string()),
  constructionStatus: v.optional(v.string()),
  transactionType: v.optional(v.string()),
  ownershipType: v.optional(v.string()),
  // Building details
  totalFloors: v.optional(v.number()),
  totalTowers: v.optional(v.number()),
  totalUnits: v.optional(v.number()),
  launchDate: v.optional(v.string()),
  completionDate: v.optional(v.string()),
  // Pricing details
  pricePerSqft: v.optional(v.string()),
  maintenanceCharges: v.optional(v.string()),
  bookingAmount: v.optional(v.string()),
  // Specifications
  flooring: v.optional(v.string()),
  waterSupply: v.optional(v.string()),
  powerBackup: v.optional(v.string()),
  overlooking: v.optional(v.array(v.string())),
  gatedCommunity: v.optional(v.boolean()),
  petFriendly: v.optional(v.boolean()),
  furnishingStatus: v.optional(v.string()),
  parkingInfo: v.optional(v.string()),
  // Location details
  city: v.optional(v.string()),
  locality: v.optional(v.string()),
  pincode: v.optional(v.string()),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  // Nearby landmarks
  nearbyLandmarks: v.optional(v.string()),
  // DSM commission
  dsmCommissionAmount: v.optional(v.number()),
}

export const create = mutation({
  args: {
    name: v.string(),
    location: v.string(),
    priceRange: v.string(),
    ...projectOptionalFields,
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    // Generate slug
    let slug = slugify(args.name)
    const existingSlug = await ctx.db
      .query("projects")
      .withIndex("bySlug", (q) => q.eq("slug", slug))
      .unique()
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`
    }

    const { name, location, priceRange, ...optionalFields } = args
    const projectId = await ctx.db.insert("projects", {
      name,
      location,
      priceRange,
      slug,
      status: "active",
      createdAt: Date.now(),
      ...optionalFields,
    })

    await logActivity(ctx, {
      entityType: "project",
      entityId: projectId,
      action: "created",
      details: { name: args.name, location: args.location },
      performedBy: user._id,
    })

    return projectId
  },
})

export const update = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    ...projectOptionalFields,
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    const { projectId, ...updates } = args
    const existing = await ctx.db.get(projectId)
    if (!existing) throw new Error("Project not found")

    const patch: Record<string, unknown> = {}

    // Handle slug update when name changes
    if (updates.name !== undefined) {
      patch.name = updates.name
      let slug = slugify(updates.name)
      const existingSlug = await ctx.db
        .query("projects")
        .withIndex("bySlug", (q) => q.eq("slug", slug))
        .unique()
      if (existingSlug && existingSlug._id !== projectId) {
        slug = `${slug}-${Date.now()}`
      }
      patch.slug = slug
    }

    // Copy all other defined fields into patch
    const { name: _name, ...rest } = updates
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) {
        patch[key] = value
      }
    }

    await ctx.db.patch(projectId, patch)

    await logActivity(ctx, {
      entityType: "project",
      entityId: projectId,
      action: "updated",
      details: patch as Record<string, string>,
      performedBy: user._id,
    })
  },
})

export const archive = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    const existing = await ctx.db.get(args.projectId)
    if (!existing) throw new Error("Project not found")

    await ctx.db.patch(args.projectId, { status: "archived" })

    await logActivity(ctx, {
      entityType: "project",
      entityId: args.projectId,
      action: "archived",
      details: { name: existing.name },
      performedBy: user._id,
    })
  },
})
