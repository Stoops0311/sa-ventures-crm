import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listActiveProjects = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("byStatus", (q) => q.eq("status", "active"))
      .collect()

    const projectsWithCreatives = await Promise.all(
      projects.map(async (project) => {
        const creatives = await ctx.db
          .query("projectCreatives")
          .withIndex("byProjectId", (q) => q.eq("projectId", project._id))
          .collect()

        creatives.sort((a, b) => a.order - b.order)

        const creativesWithUrls = await Promise.all(
          creatives.map(async (creative) => ({
            ...creative,
            url: await ctx.storage.getUrl(creative.storageId),
          }))
        )

        return {
          ...project,
          creatives: creativesWithUrls,
        }
      })
    )

    return projectsWithCreatives
  },
})

export const getProjectBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("bySlug", (q) => q.eq("slug", args.slug))
      .unique()

    if (!project || project.status !== "active") return null

    const creatives = await ctx.db
      .query("projectCreatives")
      .withIndex("byProjectId", (q) => q.eq("projectId", project._id))
      .collect()

    creatives.sort((a, b) => a.order - b.order)

    const creativesWithUrls = await Promise.all(
      creatives.map(async (creative) => ({
        ...creative,
        url: await ctx.storage.getUrl(creative.storageId),
      }))
    )

    return {
      ...project,
      creatives: creativesWithUrls,
    }
  },
})

export const listPublishedArticles = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let articlesQuery

    if (args.category) {
      articlesQuery = ctx.db
        .query("articles")
        .withIndex("byCategory", (q) => q.eq("category", args.category!))
    } else {
      articlesQuery = ctx.db
        .query("articles")
        .withIndex("byStatus", (q) => q.eq("status", "published"))
    }

    const articles = await articlesQuery.collect()

    // Filter to published only (if queried by category)
    const published = args.category
      ? articles.filter((a) => a.status === "published")
      : articles

    // Sort by publishedAt descending
    published.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))

    // Apply limit
    const limited = args.limit ? published.slice(0, args.limit) : published

    // Resolve cover images
    const withCovers = await Promise.all(
      limited.map(async (article) => ({
        ...article,
        coverImageUrl: article.coverImageStorageId
          ? await ctx.storage.getUrl(article.coverImageStorageId)
          : null,
      }))
    )

    return withCovers
  },
})

export const getArticleBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const article = await ctx.db
      .query("articles")
      .withIndex("bySlug", (q) => q.eq("slug", args.slug))
      .unique()

    if (!article || article.status !== "published") return null

    const coverImageUrl = article.coverImageStorageId
      ? await ctx.storage.getUrl(article.coverImageStorageId)
      : null

    // Get author name
    const author = await ctx.db.get(article.authorId)

    return {
      ...article,
      coverImageUrl,
      authorName: author?.name ?? "SA Ventures",
    }
  },
})

export const listActiveProjectsForForm = query({
  args: {},
  handler: async (ctx) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("byStatus", (q) => q.eq("status", "active"))
      .collect()

    return projects.map((p) => ({
      _id: p._id,
      name: p.name,
    }))
  },
})

export const submitInquiry = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Rate limit: reject if same phone submitted in last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const recentInquiries = await ctx.db
      .query("websiteInquiries")
      .withIndex("byCreatedAt")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), fiveMinutesAgo),
          q.eq(q.field("phone"), args.phone)
        )
      )
      .collect()

    if (recentInquiries.length > 0) {
      throw new Error(
        "You have already submitted an inquiry recently. Please wait a few minutes."
      )
    }

    await ctx.db.insert("websiteInquiries", {
      name: args.name,
      phone: args.phone,
      email: args.email,
      projectId: args.projectId,
      message: args.message,
      type: "inquiry",
      status: "new",
      createdAt: Date.now(),
    })
  },
})

export const submitPartnerInquiry = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // Rate limit: reject if same phone submitted in last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const recentInquiries = await ctx.db
      .query("websiteInquiries")
      .withIndex("byCreatedAt")
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), fiveMinutesAgo),
          q.eq(q.field("phone"), args.phone)
        )
      )
      .collect()

    if (recentInquiries.length > 0) {
      throw new Error(
        "You have already submitted a request recently. Please wait a few minutes."
      )
    }

    await ctx.db.insert("websiteInquiries", {
      name: args.name,
      phone: args.phone,
      email: args.email,
      message: args.message,
      type: "partner",
      status: "new",
      createdAt: Date.now(),
    })
  },
})
