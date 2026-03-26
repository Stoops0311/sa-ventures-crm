import { query } from "./_generated/server"
import { v } from "convex/values"
import { getUserWithRole, getUserWithAnyRole } from "./lib/auth"
import { CLOSED_STATUSES } from "./lib/constants"

export const adminDashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithRole(ctx, "admin")
    if (!user) return null

    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime()
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    ).getTime()

    // Start of week (Monday)
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - diffToMonday
    ).getTime()

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime()

    const allLeads = await ctx.db.query("leads").collect()

    const totalActiveLeads = allLeads.filter(
      (l) => !CLOSED_STATUSES.includes(l.status as (typeof CLOSED_STATUSES)[number])
    ).length

    const todayFollowUps = allLeads.filter(
      (l) =>
        l.followUpDate !== undefined &&
        l.followUpDate <= endOfToday &&
        l.followUpDate >= startOfToday
    ).length

    const overdueFollowUps = allLeads.filter(
      (l) =>
        l.followUpDate !== undefined &&
        l.followUpDate < startOfToday &&
        !CLOSED_STATUSES.includes(l.status as (typeof CLOSED_STATUSES)[number])
    ).length

    const visitsThisWeek = allLeads.filter(
      (l) =>
        l.status === "Visit Scheduled" &&
        l.followUpDate !== undefined &&
        l.followUpDate >= startOfWeek &&
        l.followUpDate <= endOfToday + (7 - diffToMonday - 1) * 86400000
    ).length

    const bookingsThisMonth = allLeads.filter(
      (l) => l.status === "Booking Done" && l.createdAt >= startOfMonth
    ).length

    const newLeadsToday = allLeads.filter(
      (l) => l.createdAt >= startOfToday && l.createdAt <= endOfToday
    ).length

    return {
      totalActiveLeads,
      todayFollowUps,
      overdueFollowUps,
      visitsThisWeek,
      bookingsThisMonth,
      newLeadsToday,
    }
  },
})

export const salespersonDashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["salesperson", "admin"])
    if (!user) return null

    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime()
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    ).getTime()

    // Start of week (Monday)
    const dayOfWeek = now.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const startOfWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - diffToMonday
    ).getTime()

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime()

    const myLeads = await ctx.db
      .query("leads")
      .withIndex("byAssignedTo", (q) => q.eq("assignedTo", user._id))
      .collect()

    const myActiveLeads = myLeads.filter(
      (l) => !CLOSED_STATUSES.includes(l.status as (typeof CLOSED_STATUSES)[number])
    ).length

    const newUncontacted = myLeads.filter(
      (l) => l.status === "New"
    ).length

    const visitsThisWeek = myLeads.filter(
      (l) =>
        l.status === "Visit Scheduled" &&
        l.followUpDate !== undefined &&
        l.followUpDate >= startOfWeek &&
        l.followUpDate <= endOfToday + (7 - diffToMonday - 1) * 86400000
    ).length

    const conversionsThisMonth = myLeads.filter(
      (l) =>
        (l.status === "Booking Done" || l.status === "Closed Won") &&
        l.createdAt >= startOfMonth
    ).length

    const followUpsDueToday = myLeads.filter(
      (l) =>
        l.followUpDate !== undefined &&
        l.followUpDate >= startOfToday &&
        l.followUpDate <= endOfToday
    ).length

    const overdueFollowUps = myLeads.filter(
      (l) =>
        l.followUpDate !== undefined &&
        l.followUpDate < startOfToday &&
        !CLOSED_STATUSES.includes(l.status as (typeof CLOSED_STATUSES)[number])
    ).length

    // After-sales active count
    const afterSalesProcesses = await ctx.db
      .query("afterSalesProcesses")
      .withIndex("byAssignedToAndStatus", (q) =>
        q.eq("assignedTo", user._id).eq("status", "in_progress")
      )
      .collect()

    return {
      myActiveLeads,
      newUncontacted,
      visitsThisWeek,
      conversionsThisMonth,
      followUpsDueToday,
      overdueFollowUps,
      afterSalesActive: afterSalesProcesses.length,
    }
  },
})

export const salespersonPivot = query({
  args: {
    periodStart: v.optional(v.number()),
    periodEnd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithRole(ctx, "admin")
    if (!user) return null

    const now = Date.now()
    const startOfToday = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    ).getTime()

    // Default period: this month
    const periodStart =
      args.periodStart ??
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
    const periodEnd = args.periodEnd ?? now

    // Get all salespeople
    const allUsers = await ctx.db.query("users").collect()
    const salespeople = allUsers.filter((u) => u.role === "salesperson")

    // Get presence data
    const allPresence = await ctx.db.query("presence").collect()
    const presenceMap = new Map(
      allPresence.map((p) => [p.userId.toString(), p])
    )
    const threshold = now - 60000

    const rows = await Promise.all(
      salespeople.map(async (sp) => {
        const leads = await ctx.db
          .query("leads")
          .withIndex("byAssignedTo", (q) => q.eq("assignedTo", sp._id))
          .collect()

        const total = leads.length
        let active = 0
        let newLeads = 0
        let followUp = 0
        let overdue = 0
        let visits = 0
        let bookings = 0
        let activeAgeSum = 0

        for (const l of leads) {
          const isClosed = CLOSED_STATUSES.includes(
            l.status as (typeof CLOSED_STATUSES)[number]
          )

          if (!isClosed) {
            active++
            activeAgeSum += now - l.createdAt
          }

          if (l.status === "New") newLeads++
          if (l.status === "Follow Up") followUp++

          if (
            l.followUpDate !== undefined &&
            l.followUpDate < startOfToday &&
            !isClosed
          ) {
            overdue++
          }

          // Period-bounded metrics
          if (
            (l.status === "Visit Scheduled" || l.status === "Visit Done") &&
            l.updatedAt >= periodStart &&
            l.updatedAt <= periodEnd
          ) {
            visits++
          }

          if (
            (l.status === "Booking Done" || l.status === "Closed Won") &&
            l.updatedAt >= periodStart &&
            l.updatedAt <= periodEnd
          ) {
            bookings++
          }
        }

        const conversionRate =
          total > 0 ? Math.round((bookings / total) * 100) : 0
        const avgAgeDays =
          active > 0
            ? Math.round(activeAgeSum / active / 86400000)
            : 0

        const presence = presenceMap.get(sp._id.toString())

        return {
          userId: sp._id,
          userName: sp.name,
          imageUrl: sp.imageUrl,
          isOnline: presence ? presence.lastSeen > threshold : false,
          lastSeen: presence?.lastSeen,
          total,
          active,
          newLeads,
          followUp,
          overdue,
          visits,
          bookings,
          conversionRate,
          avgAgeDays,
        }
      })
    )

    return rows
  },
})

export const salespersonPerformance = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithRole(ctx, "admin")
    if (!user) return null

    const now = new Date()
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime()
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    ).getTime()

    // Get all salespeople
    const allUsers = await ctx.db.query("users").collect()
    const salespeople = allUsers.filter((u) => u.role === "salesperson")

    // Get presence data for online status
    const allPresence = await ctx.db.query("presence").collect()
    const presenceMap = new Map(
      allPresence.map((p) => [p.userId.toString(), p])
    )

    const threshold = Date.now() - 60000

    const performance = await Promise.all(
      salespeople.map(async (sp) => {
        const leads = await ctx.db
          .query("leads")
          .withIndex("byAssignedTo", (q) => q.eq("assignedTo", sp._id))
          .collect()

        const assigned = leads.length

        const contacted = leads.filter(
          (l) => l.status !== "New"
        ).length

        const followUpsDue = leads.filter(
          (l) =>
            l.followUpDate !== undefined &&
            l.followUpDate < startOfToday &&
            !CLOSED_STATUSES.includes(l.status as (typeof CLOSED_STATUSES)[number])
        ).length

        const conversions = leads.filter(
          (l) =>
            (l.status === "Booking Done" || l.status === "Closed Won") &&
            l.createdAt >= startOfMonth
        ).length

        const presence = presenceMap.get(sp._id.toString())

        return {
          userId: sp._id,
          userName: sp.name,
          imageUrl: sp.imageUrl,
          assigned,
          contacted,
          followUpsDue,
          conversions,
          isOnline: presence ? presence.lastSeen > threshold : false,
          lastSeen: presence?.lastSeen,
        }
      })
    )

    return performance
  },
})
