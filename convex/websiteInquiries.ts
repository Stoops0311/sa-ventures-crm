import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserWithRole, requireUserWithRole } from "./lib/auth"

export const list = query({
  args: {
    status: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithRole(ctx, "admin")
    if (!user) return []

    let inquiries
    if (args.type) {
      inquiries = await ctx.db
        .query("websiteInquiries")
        .withIndex("byType", (q) => q.eq("type", args.type!))
        .collect()
      if (args.status) {
        inquiries = inquiries.filter((i) => i.status === args.status)
      }
    } else if (args.status) {
      inquiries = await ctx.db
        .query("websiteInquiries")
        .withIndex("byStatus", (q) => q.eq("status", args.status!))
        .collect()
    } else {
      inquiries = await ctx.db.query("websiteInquiries").collect()
    }

    // Sort by createdAt descending
    inquiries.sort((a, b) => b.createdAt - a.createdAt)

    // Resolve project names
    const withProjectNames = await Promise.all(
      inquiries.map(async (inquiry) => {
        let projectName: string | null = null
        if (inquiry.projectId) {
          const project = await ctx.db.get(inquiry.projectId)
          projectName = project?.name ?? null
        }
        return { ...inquiry, projectName }
      })
    )

    return withProjectNames
  },
})

export const updateStatus = mutation({
  args: {
    inquiryId: v.id("websiteInquiries"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserWithRole(ctx, "admin")

    const inquiry = await ctx.db.get(args.inquiryId)
    if (!inquiry) throw new Error("Inquiry not found")

    await ctx.db.patch(args.inquiryId, { status: args.status })
  },
})

export const count = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithRole(ctx, "admin")
    if (!user) return 0

    const newInquiries = await ctx.db
      .query("websiteInquiries")
      .withIndex("byStatus", (q) => q.eq("status", "new"))
      .collect()

    return newInquiries.length
  },
})
