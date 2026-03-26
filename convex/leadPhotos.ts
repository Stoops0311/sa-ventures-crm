import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { requireUser, getUserOrNull } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const save = mutation({
  args: {
    leadId: v.id("leads"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    // Auth: admin OR the lead's assigned salesperson
    if (user.role !== "admin") {
      const lead = await ctx.db.get(args.leadId)
      if (!lead) throw new Error("Lead not found")
      if (lead.assignedTo !== user._id) {
        throw new Error("Unauthorized: you are not assigned to this lead")
      }
    }

    const photoId = await ctx.db.insert("leadPhotos", {
      leadId: args.leadId,
      storageId: args.storageId,
      fileName: args.fileName,
      fileType: args.fileType,
      uploadedBy: user._id,
      uploadedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "lead",
      entityId: args.leadId,
      action: "photo_uploaded",
      details: { fileName: args.fileName, fileType: args.fileType },
      performedBy: user._id,
    })

    return photoId
  },
})

export const listByLead = query({
  args: {
    leadId: v.id("leads"),
  },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []

    // Auth: admin or lead's assigned salesperson
    if (user.role !== "admin") {
      const lead = await ctx.db.get(args.leadId)
      if (!lead) return []
      if (lead.assignedTo !== user._id) return []
    }

    const photos = await ctx.db
      .query("leadPhotos")
      .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
      .collect()

    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        const url = await ctx.storage.getUrl(photo.storageId)
        return { ...photo, url }
      })
    )

    return photosWithUrls.sort((a, b) => b.uploadedAt - a.uploadedAt)
  },
})

export const remove = mutation({
  args: {
    photoId: v.id("leadPhotos"),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)

    const photo = await ctx.db.get(args.photoId)
    if (!photo) throw new Error("Photo not found")

    // Auth: uploader or admin
    if (user.role !== "admin" && photo.uploadedBy !== user._id) {
      throw new Error("Unauthorized: you can only delete your own photos")
    }

    await ctx.storage.delete(photo.storageId)
    await ctx.db.delete(args.photoId)

    await logActivity(ctx, {
      entityType: "lead",
      entityId: photo.leadId,
      action: "photo_removed",
      details: { fileName: photo.fileName },
      performedBy: user._id,
    })
  },
})
