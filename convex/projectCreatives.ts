import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserWithAnyRole, requireUserWithRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"

export const listByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "salesperson"])
    if (!user) return []

    const creatives = await ctx.db
      .query("projectCreatives")
      .withIndex("byProjectId", (q) => q.eq("projectId", args.projectId))
      .collect()

    // Sort by order
    creatives.sort((a, b) => a.order - b.order)

    // Generate URLs for each creative
    const creativesWithUrls = await Promise.all(
      creatives.map(async (creative) => {
        const url = await ctx.storage.getUrl(creative.storageId)
        return {
          ...creative,
          url,
        }
      })
    )

    return creativesWithUrls
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserWithRole(ctx, "admin")
    return await ctx.storage.generateUploadUrl()
  },
})

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    // Get max order for this project
    const existingCreatives = await ctx.db
      .query("projectCreatives")
      .withIndex("byProjectId", (q) => q.eq("projectId", args.projectId))
      .collect()

    const maxOrder = existingCreatives.reduce(
      (max, c) => Math.max(max, c.order),
      0
    )

    const creativeId = await ctx.db.insert("projectCreatives", {
      projectId: args.projectId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      order: maxOrder + 1,
      createdAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "project",
      entityId: args.projectId,
      action: "creative_added",
      details: { fileName: args.fileName, fileType: args.fileType },
      performedBy: user._id,
    })

    return creativeId
  },
})

export const remove = mutation({
  args: {
    creativeId: v.id("projectCreatives"),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    const creative = await ctx.db.get(args.creativeId)
    if (!creative) throw new Error("Creative not found")

    // Delete from storage
    await ctx.storage.delete(creative.storageId)

    // Delete document
    await ctx.db.delete(args.creativeId)

    await logActivity(ctx, {
      entityType: "project",
      entityId: creative.projectId,
      action: "creative_removed",
      details: { fileName: creative.fileName },
      performedBy: user._id,
    })
  },
})
