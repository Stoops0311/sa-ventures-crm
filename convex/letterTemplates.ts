import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserWithAnyRole, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import {
  LETTER_TEMPLATE_TYPES,
  DEFAULT_LETTER_TEMPLATES,
} from "./lib/constants"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return []

    const templates = await ctx.db.query("letterTemplates").collect()
    templates.sort((a, b) => a.updatedAt - b.updatedAt)
    return templates
  },
})

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return []

    const templates = await ctx.db
      .query("letterTemplates")
      .withIndex("byIsActive", (q) => q.eq("isActive", true))
      .collect()

    templates.sort((a, b) => {
      const aIdx = LETTER_TEMPLATE_TYPES.indexOf(a.type as typeof LETTER_TEMPLATE_TYPES[number])
      const bIdx = LETTER_TEMPLATE_TYPES.indexOf(b.type as typeof LETTER_TEMPLATE_TYPES[number])
      return aIdx - bIdx
    })

    return templates
  },
})

export const getById = query({
  args: { templateId: v.id("letterTemplates") },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return null

    return await ctx.db.get(args.templateId)
  },
})

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    const existing = await ctx.db.query("letterTemplates").first()
    if (existing) return // Already seeded

    const now = Date.now()

    for (const type of LETTER_TEMPLATE_TYPES) {
      const template = DEFAULT_LETTER_TEMPLATES[type]
      const templateId = await ctx.db.insert("letterTemplates", {
        type,
        name: template.name,
        content: template.content,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })

      await logActivity(ctx, {
        entityType: "template",
        entityId: templateId,
        action: "template_seeded",
        details: { type, name: template.name },
        performedBy: user._id,
      })
    }
  },
})

export const upsert = mutation({
  args: {
    templateId: v.optional(v.id("letterTemplates")),
    name: v.string(),
    content: v.string(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])
    const now = Date.now()

    if (args.templateId) {
      const existing = await ctx.db.get(args.templateId)
      if (!existing) throw new Error("Template not found")

      await ctx.db.patch(args.templateId, {
        name: args.name,
        content: args.content,
        isActive: args.isActive ?? existing.isActive,
        updatedAt: now,
      })

      await logActivity(ctx, {
        entityType: "template",
        entityId: args.templateId,
        action: "template_updated",
        details: { name: args.name },
        performedBy: user._id,
      })

      return args.templateId
    }

    // Create new (shouldn't normally happen since we seed, but support it)
    const templateId = await ctx.db.insert("letterTemplates", {
      type: "appointment", // Default type
      name: args.name,
      content: args.content,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "template",
      entityId: templateId,
      action: "template_created",
      details: { name: args.name },
      performedBy: user._id,
    })

    return templateId
  },
})

export const toggleActive = mutation({
  args: { templateId: v.id("letterTemplates") },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    const template = await ctx.db.get(args.templateId)
    if (!template) throw new Error("Template not found")

    const newActive = !template.isActive
    await ctx.db.patch(args.templateId, {
      isActive: newActive,
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "template",
      entityId: args.templateId,
      action: newActive ? "template_activated" : "template_deactivated",
      details: { name: template.name, type: template.type },
      performedBy: user._id,
    })
  },
})
