import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { requireUserWithRole, getUserWithRole } from "./lib/auth"
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
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithRole(ctx, "admin")
    if (!user) return []

    let articles
    if (args.status) {
      articles = await ctx.db
        .query("articles")
        .withIndex("byStatus", (q) => q.eq("status", args.status!))
        .collect()
    } else {
      articles = await ctx.db.query("articles").collect()
    }

    // Sort by createdAt descending
    articles.sort((a, b) => b.createdAt - a.createdAt)

    // Resolve cover images and author names
    const withExtras = await Promise.all(
      articles.map(async (article) => {
        const author = await ctx.db.get(article.authorId)
        const coverImageUrl = article.coverImageStorageId
          ? await ctx.storage.getUrl(article.coverImageStorageId)
          : null
        return {
          ...article,
          coverImageUrl,
          authorName: author?.name ?? "Unknown",
        }
      })
    )

    return withExtras
  },
})

export const getById = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const user = await getUserWithRole(ctx, "admin")
    if (!user) return null

    const article = await ctx.db.get(args.articleId)
    if (!article) return null

    const coverImageUrl = article.coverImageStorageId
      ? await ctx.storage.getUrl(article.coverImageStorageId)
      : null

    return { ...article, coverImageUrl }
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    excerpt: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    // Generate slug
    let slug = slugify(args.title)
    const existing = await ctx.db
      .query("articles")
      .withIndex("bySlug", (q) => q.eq("slug", slug))
      .unique()
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const now = Date.now()
    const articleId = await ctx.db.insert("articles", {
      title: args.title,
      slug,
      body: args.body,
      excerpt: args.excerpt,
      coverImageStorageId: args.coverImageStorageId,
      category: args.category,
      tags: args.tags,
      status: args.status,
      authorId: user._id,
      publishedAt: args.status === "published" ? now : undefined,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "article",
      entityId: articleId,
      action: "created",
      details: { title: args.title, status: args.status },
      performedBy: user._id,
    })

    return articleId
  },
})

export const update = mutation({
  args: {
    articleId: v.id("articles"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    const existing = await ctx.db.get(args.articleId)
    if (!existing) throw new Error("Article not found")

    const patch: Record<string, unknown> = { updatedAt: Date.now() }

    if (args.title !== undefined) {
      patch.title = args.title
      // Update slug if title changed
      let slug = slugify(args.title)
      const existingSlug = await ctx.db
        .query("articles")
        .withIndex("bySlug", (q) => q.eq("slug", slug))
        .unique()
      if (existingSlug && existingSlug._id !== args.articleId) {
        slug = `${slug}-${Date.now()}`
      }
      patch.slug = slug
    }
    if (args.body !== undefined) patch.body = args.body
    if (args.excerpt !== undefined) patch.excerpt = args.excerpt
    if (args.coverImageStorageId !== undefined)
      patch.coverImageStorageId = args.coverImageStorageId
    if (args.category !== undefined) patch.category = args.category
    if (args.tags !== undefined) patch.tags = args.tags
    if (args.status !== undefined) {
      patch.status = args.status
      if (args.status === "published" && !existing.publishedAt) {
        patch.publishedAt = Date.now()
      }
    }

    await ctx.db.patch(args.articleId, patch)

    await logActivity(ctx, {
      entityType: "article",
      entityId: args.articleId,
      action: "updated",
      details: { title: args.title ?? existing.title },
      performedBy: user._id,
    })
  },
})

export const remove = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, args) => {
    const user = await requireUserWithRole(ctx, "admin")

    const article = await ctx.db.get(args.articleId)
    if (!article) throw new Error("Article not found")

    // Delete cover image from storage
    if (article.coverImageStorageId) {
      await ctx.storage.delete(article.coverImageStorageId)
    }

    await ctx.db.delete(args.articleId)

    await logActivity(ctx, {
      entityType: "article",
      entityId: args.articleId,
      action: "deleted",
      details: { title: article.title },
      performedBy: user._id,
    })
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserWithRole(ctx, "admin")
    return await ctx.storage.generateUploadUrl()
  },
})
