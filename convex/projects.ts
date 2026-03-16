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

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    location: v.string(),
    priceRange: v.string(),
    amenities: v.optional(v.array(v.string())),
    configurations: v.optional(v.string()),
    possessionDate: v.optional(v.string()),
    developerName: v.optional(v.string()),
    reraNumber: v.optional(v.string()),
    mapEmbedUrl: v.optional(v.string()),
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

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      location: args.location,
      priceRange: args.priceRange,
      slug,
      amenities: args.amenities,
      configurations: args.configurations,
      possessionDate: args.possessionDate,
      developerName: args.developerName,
      reraNumber: args.reraNumber,
      mapEmbedUrl: args.mapEmbedUrl,
      status: "active",
      createdAt: Date.now(),
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
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    priceRange: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    configurations: v.optional(v.string()),
    possessionDate: v.optional(v.string()),
    developerName: v.optional(v.string()),
    reraNumber: v.optional(v.string()),
    mapEmbedUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    const { projectId, ...updates } = args
    const existing = await ctx.db.get(projectId)
    if (!existing) throw new Error("Project not found")

    const patch: Record<string, unknown> = {}
    if (updates.name !== undefined) {
      patch.name = updates.name
      // Update slug when name changes
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
    if (updates.description !== undefined) patch.description = updates.description
    if (updates.location !== undefined) patch.location = updates.location
    if (updates.priceRange !== undefined) patch.priceRange = updates.priceRange
    if (updates.amenities !== undefined) patch.amenities = updates.amenities
    if (updates.configurations !== undefined) patch.configurations = updates.configurations
    if (updates.possessionDate !== undefined) patch.possessionDate = updates.possessionDate
    if (updates.developerName !== undefined) patch.developerName = updates.developerName
    if (updates.reraNumber !== undefined) patch.reraNumber = updates.reraNumber
    if (updates.mapEmbedUrl !== undefined) patch.mapEmbedUrl = updates.mapEmbedUrl

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
