import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserWithAnyRole, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import type { Doc } from "./_generated/dataModel"

const RECEPTIONIST_ACCESS_ROLES = ["receptionist", "admin"] as const
const accessRoles = [...RECEPTIONIST_ACCESS_ROLES]

// Helper to safely get a lead document
async function getLead(ctx: any, leadId: Doc<"visits">["leadId"]) {
  if (!leadId) return null
  return (await ctx.db.get(leadId)) as Doc<"leads"> | null
}
async function getProject(ctx: any, projectId: Doc<"visits">["projectId"]) {
  if (!projectId) return null
  return (await ctx.db.get(projectId)) as Doc<"projects"> | null
}
async function getUser(ctx: any, userId: Doc<"visits">["assignedTo"]) {
  if (!userId) return null
  return (await ctx.db.get(userId)) as Doc<"users"> | null
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get today's visits (for receptionist dashboard).
 * Handles both scheduled (lead-linked) and walk-in visits.
 */
export const getTodaysVisits = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, [...accessRoles])
    if (!user) return null

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000

    const allVisits = await ctx.db
      .query("visits")
      .withIndex("byVisitDate")
      .collect()

    const todaysVisits = allVisits.filter(
      (v) => v.visitDate >= startOfDay && v.visitDate < endOfDay
    )

    const enriched = await Promise.all(
      todaysVisits.map(async (visit) => {
        if (visit.visitType === "walk_in" || !visit.leadId) {
          return {
            ...visit,
            leadName: visit.walkinName ?? "Walk-in",
            leadPhone: visit.walkinPhone ?? "",
            projectName: visit.walkinPurpose ?? "—",
            salespersonName: "—",
          }
        }
        const lead = await getLead(ctx, visit.leadId)
        const project = await getProject(ctx, visit.projectId)
        const salesperson = await getUser(ctx, visit.assignedTo)
        return {
          ...visit,
          leadName: lead?.name ?? "Unknown",
          leadPhone: lead?.mobileNumber ?? "",
          projectName: project?.name ?? "Unknown",
          salespersonName: salesperson?.name ?? "Unknown",
        }
      })
    )

    return enriched.sort((a, b) => a.visitDate - b.visitDate)
  },
})

/**
 * Get today's visits for a specific salesperson.
 */
export const getMyTodaysVisits = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["salesperson", "admin"])
    if (!user) return null

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000

    const myVisits = await ctx.db
      .query("visits")
      .withIndex("byAssignedTo", (q) => q.eq("assignedTo", user._id))
      .collect()

    const todaysVisits = myVisits.filter(
      (v) => v.visitDate >= startOfDay && v.visitDate < endOfDay
    )

    const enriched = await Promise.all(
      todaysVisits.map(async (visit) => {
        if (visit.visitType === "walk_in" || !visit.leadId) {
          return {
            ...visit,
            leadName: visit.walkinName ?? "Walk-in",
            leadPhone: visit.walkinPhone ?? "",
            projectName: visit.walkinPurpose ?? "—",
          }
        }
        const lead = await getLead(ctx, visit.leadId)
        const project = await getProject(ctx, visit.projectId)
        return {
          ...visit,
          leadName: lead?.name ?? "Unknown",
          leadPhone: lead?.mobileNumber ?? "",
          projectName: project?.name ?? "Unknown",
        }
      })
    )

    return enriched.sort((a, b) => a.visitDate - b.visitDate)
  },
})

/**
 * Search visitors by name or phone (receptionist).
 */
export const searchVisitors = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, { searchTerm }) => {
    const user = await getUserWithAnyRole(ctx, [...accessRoles])
    if (!user) return null

    if (searchTerm.length < 2) return []

    const matchingLeads = await ctx.db
      .query("leads")
      .withSearchIndex("searchByName", (q) => q.search("name", searchTerm))
      .take(20)

    if (/^\d+$/.test(searchTerm)) {
      const phoneMatches = await ctx.db
        .query("leads")
        .withSearchIndex("searchByPhone", (q) =>
          q.search("mobileNumber", searchTerm)
        )
        .take(20)
      const existingIds = new Set(matchingLeads.map((l) => l._id.toString()))
      for (const lead of phoneMatches) {
        if (!existingIds.has(lead._id.toString())) {
          matchingLeads.push(lead)
        }
      }
    }

    const results = await Promise.all(
      matchingLeads.slice(0, 15).map(async (lead) => {
        const visits = await ctx.db
          .query("visits")
          .withIndex("byLeadId", (q) => q.eq("leadId", lead._id))
          .collect()
        const activeVisit = visits.find((v) => v.checkinStatus === "expected")
        const project = await ctx.db.get(lead.projectId)
        const salesperson = await ctx.db.get(lead.assignedTo)
        return {
          leadId: lead._id,
          leadName: lead.name,
          leadPhone: lead.mobileNumber,
          projectName: project?.name ?? "Unknown",
          salespersonName: salesperson?.name ?? "Unknown",
          status: lead.status,
          activeVisit: activeVisit
            ? {
                _id: activeVisit._id,
                visitDate: activeVisit.visitDate,
                visitLocation: activeVisit.visitLocation,
                checkinStatus: activeVisit.checkinStatus,
              }
            : null,
        }
      })
    )

    return results
  },
})

/**
 * Receptionist dashboard stats.
 */
export const receptionistStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, [...accessRoles])
    if (!user) return null

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000

    const allVisits = await ctx.db
      .query("visits")
      .withIndex("byVisitDate")
      .collect()

    const todaysVisits = allVisits.filter(
      (v) => v.visitDate >= startOfDay && v.visitDate < endOfDay
    )

    const expected = todaysVisits.filter((v) => v.checkinStatus === "expected").length
    const arrived = todaysVisits.filter((v) => v.checkinStatus === "arrived").length
    const noShow = todaysVisits.filter((v) => v.checkinStatus === "no_show").length
    const walkIns = todaysVisits.filter((v) => v.visitType === "walk_in").length

    return {
      expected,
      arrived,
      noShow,
      walkIns,
      total: todaysVisits.length,
    }
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Mark a visitor as arrived (receptionist check-in).
 */
export const markArrived = mutation({
  args: {
    visitId: v.id("visits"),
  },
  handler: async (ctx, { visitId }) => {
    const user = await requireUserWithAnyRole(ctx, [...accessRoles])

    const visit = await ctx.db.get(visitId)
    if (!visit) throw new Error("Visit not found")
    if (visit.checkinStatus !== "expected") {
      throw new Error("Visit is not in 'expected' status")
    }

    const now = Date.now()
    await ctx.db.patch(visitId, {
      checkinStatus: "arrived",
      checkinAt: now,
      checkinBy: user._id,
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "visit",
      entityId: (visit.leadId as string) ?? visitId,
      action: "visitor_checked_in",
      details: {
        visitId,
        checkedInBy: user.name,
      },
      performedBy: user._id,
    })
  },
})

/**
 * Mark a visitor as no-show (receptionist).
 */
export const markNoShow = mutation({
  args: {
    visitId: v.id("visits"),
  },
  handler: async (ctx, { visitId }) => {
    const user = await requireUserWithAnyRole(ctx, [...accessRoles])

    const visit = await ctx.db.get(visitId)
    if (!visit) throw new Error("Visit not found")
    if (visit.checkinStatus !== "expected") {
      throw new Error("Visit is not in 'expected' status")
    }

    const now = Date.now()
    await ctx.db.patch(visitId, {
      checkinStatus: "no_show",
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "visit",
      entityId: (visit.leadId as string) ?? visitId,
      action: "visitor_no_show",
      details: { visitId },
      performedBy: user._id,
    })
  },
})

/**
 * Log a walk-in visit (receptionist).
 * For visitors who show up without a scheduled visit.
 * Can optionally link to an existing lead, or use custom visitor info.
 */
export const createWalkIn = mutation({
  args: {
    leadId: v.optional(v.id("leads")),
    walkinName: v.optional(v.string()),
    walkinPhone: v.optional(v.string()),
    walkinPurpose: v.optional(v.string()),
    visitLocation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, [...accessRoles])

    if (!args.leadId && !args.walkinName) {
      throw new Error("Either select an existing lead or enter a visitor name")
    }

    const now = Date.now()

    let walkinName = args.walkinName
    let walkinPhone = args.walkinPhone
    let projectId: any
    let assignedTo: any

    // If linking to existing lead, pull their info
    if (args.leadId) {
      const lead = await ctx.db.get(args.leadId)
      if (!lead) throw new Error("Lead not found")
      projectId = lead.projectId
      assignedTo = lead.assignedTo
      walkinName = walkinName ?? lead.name
      walkinPhone = walkinPhone ?? lead.mobileNumber
    }

    const visitId = await ctx.db.insert("visits", {
      visitType: "walk_in",
      leadId: args.leadId,
      projectId,
      assignedTo,
      walkinName,
      walkinPhone,
      walkinPurpose: args.walkinPurpose,
      visitLocation: args.visitLocation ?? "office",
      visitDate: now,
      checkinStatus: "arrived",
      checkinAt: now,
      checkinBy: user._id,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "visit",
      entityId: (args.leadId as string) ?? visitId,
      action: "walk_in_logged",
      details: {
        visitId,
        visitorName: walkinName,
        purpose: args.walkinPurpose,
        linkedToLead: !!args.leadId,
      },
      performedBy: user._id,
    })

    return visitId
  },
})
