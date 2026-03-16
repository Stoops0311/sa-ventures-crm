import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { paginationOptsValidator } from "convex/server"
import { getUserWithAnyRole, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"

export const listByLead = query({
  args: {
    leadId: v.id("leads"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "salesperson"])
    if (!user) return { page: [], isDone: true, continueCursor: "" }

    // If salesperson, verify they're assigned to this lead
    if (user.role === "salesperson") {
      const lead = await ctx.db.get(args.leadId)
      if (!lead) return { page: [], isDone: true, continueCursor: "" }
      if (lead.assignedTo !== user._id) {
        return { page: [], isDone: true, continueCursor: "" }
      }
    }

    const results = await ctx.db
      .query("remarks")
      .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
      .order("desc")
      .paginate(args.paginationOpts)

    // Join with user names for createdBy
    const remarksWithUsers = await Promise.all(
      results.page.map(async (remark) => {
        const creator = await ctx.db.get(remark.createdBy)
        return {
          ...remark,
          createdByName: creator?.name ?? "Unknown",
        }
      })
    )

    return {
      ...results,
      page: remarksWithUsers,
    }
  },
})

export const create = mutation({
  args: {
    leadId: v.id("leads"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    // If salesperson, verify they're assigned to this lead
    if (user.role === "salesperson") {
      const lead = await ctx.db.get(args.leadId)
      if (!lead) throw new Error("Lead not found")
      if (lead.assignedTo !== user._id) {
        throw new Error("Unauthorized: not assigned to this lead")
      }
    }

    const remarkId = await ctx.db.insert("remarks", {
      leadId: args.leadId,
      content: args.content,
      createdBy: user._id,
      createdAt: Date.now(),
    })

    // If lead is in "Follow Up", adding a remark means the follow-up happened
    const lead = await ctx.db.get(args.leadId)
    if (lead && lead.status === "Follow Up") {
      await ctx.db.patch(args.leadId, {
        followUpDate: undefined,
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.patch(args.leadId, { updatedAt: Date.now() })
    }

    await logActivity(ctx, {
      entityType: "lead",
      entityId: args.leadId,
      action: "remark_added",
      details: { content: args.content },
      performedBy: user._id,
    })

    return remarkId
  },
})

export const update = mutation({
  args: {
    remarkId: v.id("remarks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    const remark = await ctx.db.get(args.remarkId)
    if (!remark) throw new Error("Remark not found")

    // Only the creator or an admin can edit
    if (user.role !== "admin" && remark.createdBy !== user._id) {
      throw new Error("Unauthorized: can only edit your own remarks")
    }

    await ctx.db.patch(args.remarkId, {
      content: args.content,
    })

    await ctx.db.patch(remark.leadId, { updatedAt: Date.now() })
  },
})
