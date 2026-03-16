import { query } from "./_generated/server"
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

    return {
      myActiveLeads,
      newUncontacted,
      visitsThisWeek,
      conversionsThisMonth,
      followUpsDueToday,
      overdueFollowUps,
    }
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
