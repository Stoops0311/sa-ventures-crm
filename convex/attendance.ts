import { query } from "./_generated/server"
import { v } from "convex/values"
import { getUserWithAnyRole, getUserOrNull } from "./lib/auth"
import { FULL_DAY_HOURS } from "./lib/constants"

type AttendanceStatus = "present" | "partial" | "absent" | "weekend"

function getDateString(timestamp: number): string {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00")
  const day = d.getDay()
  return day === 0 || day === 6
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function computeStatus(totalHoursMs: number, dateStr: string, isFuture: boolean): AttendanceStatus {
  if (isWeekend(dateStr)) return "weekend"
  if (isFuture) return "absent" // no data yet, will show as empty
  const hours = totalHoursMs / (1000 * 60 * 60)
  if (hours === 0) return "absent"
  if (hours < FULL_DAY_HOURS) return "partial"
  return "present"
}

export const getTeamMonthGrid = query({
  args: {
    year: v.number(),
    month: v.number(), // 1-12
  },
  handler: async (ctx, { year, month }) => {
    const user = await getUserWithAnyRole(ctx, ["admin"])
    if (!user) return null

    const daysInMonth = getDaysInMonth(year, month)
    const today = getDateString(Date.now())

    // Get all admin + salesperson users
    const allUsers = await ctx.db.query("users").collect()
    const teamUsers = allUsers.filter(
      (u) => u.role === "admin" || u.role === "salesperson" || u.role === "hr" || u.role === "vehicle" || u.role === "receptionist"
    )

    // Build date range strings for the month
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`
    const dateStrings: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      dateStrings.push(`${monthPrefix}-${String(d).padStart(2, "0")}`)
    }

    // Get all sessions for this month
    const allSessions = await ctx.db
      .query("attendanceSessions")
      .withIndex("byDate")
      .collect()

    const monthSessions = allSessions.filter(
      (s) => s.date.startsWith(monthPrefix)
    )

    // Build per-user summaries
    const teamData = teamUsers.map((u) => {
      const userSessions = monthSessions.filter(
        (s) => s.userId === u._id
      )

      const days = dateStrings.map((dateStr) => {
        const daySessions = userSessions.filter((s) => s.date === dateStr)
        const totalMs = daySessions.reduce(
          (sum, s) => sum + (s.endTime - s.startTime),
          0
        )
        const isFuture = dateStr > today
        return {
          date: dateStr,
          totalHours: totalMs / (1000 * 60 * 60),
          totalMs,
          sessionCount: daySessions.length,
          status: isFuture ? ("weekend" as AttendanceStatus) : computeStatus(totalMs, dateStr, false),
        }
      })

      // Compute averages (only for past non-weekend days with attendance)
      const workedDays = days.filter(
        (d) => d.status === "present" || d.status === "partial"
      )
      const avgHours =
        workedDays.length > 0
          ? workedDays.reduce((sum, d) => sum + d.totalHours, 0) /
            workedDays.length
          : 0

      const workingDaysPast = days.filter(
        (d) => !isWeekend(d.date) && d.date <= today
      )
      const daysPresent = workingDaysPast.filter(
        (d) => d.status === "present" || d.status === "partial"
      ).length
      const attendanceRate =
        workingDaysPast.length > 0
          ? (daysPresent / workingDaysPast.length) * 100
          : 0

      return {
        userId: u._id,
        name: u.name,
        role: u.role,
        imageUrl: u.imageUrl,
        days,
        avgHours,
        attendanceRate,
      }
    })

    // Team-wide aggregates
    const allAvgHours =
      teamData.length > 0
        ? teamData.reduce((sum, u) => sum + u.avgHours, 0) / teamData.length
        : 0

    const allAttendanceRate =
      teamData.length > 0
        ? teamData.reduce((sum, u) => sum + u.attendanceRate, 0) /
          teamData.length
        : 0

    const workingDaysInMonth = dateStrings.filter(
      (d) => !isWeekend(d)
    ).length

    return {
      teamData,
      teamAvgHours: allAvgHours,
      teamAttendanceRate: allAttendanceRate,
      workingDaysInMonth,
      daysInMonth,
    }
  },
})

export const getMonthSummary = query({
  args: {
    year: v.number(),
    month: v.number(),
  },
  handler: async (ctx, { year, month }) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null
    if (user.role === "dsm") return null

    const daysInMonth = getDaysInMonth(year, month)
    const today = getDateString(Date.now())
    const monthPrefix = `${year}-${String(month).padStart(2, "0")}`

    const dateStrings: string[] = []
    for (let d = 1; d <= daysInMonth; d++) {
      dateStrings.push(`${monthPrefix}-${String(d).padStart(2, "0")}`)
    }

    // Get sessions for this user this month
    const userSessions = await ctx.db
      .query("attendanceSessions")
      .withIndex("byUserIdAndDate", (q) => q.eq("userId", user._id))
      .collect()

    const monthSessions = userSessions.filter(
      (s) => s.date.startsWith(monthPrefix)
    )

    const days = dateStrings.map((dateStr) => {
      const daySessions = monthSessions.filter((s) => s.date === dateStr)
      const totalMs = daySessions.reduce(
        (sum, s) => sum + (s.endTime - s.startTime),
        0
      )
      const isFuture = dateStr > today
      return {
        date: dateStr,
        totalHours: totalMs / (1000 * 60 * 60),
        totalMs,
        sessionCount: daySessions.length,
        status: isFuture ? ("weekend" as AttendanceStatus) : computeStatus(totalMs, dateStr, false),
      }
    })

    const workedDays = days.filter(
      (d) => d.status === "present" || d.status === "partial"
    )
    const avgHours =
      workedDays.length > 0
        ? workedDays.reduce((sum, d) => sum + d.totalHours, 0) /
          workedDays.length
        : 0

    const workingDaysPast = days.filter(
      (d) => !isWeekend(d.date) && d.date <= today
    )
    const daysPresent = workingDaysPast.filter(
      (d) => d.status === "present" || d.status === "partial"
    ).length
    const attendanceRate =
      workingDaysPast.length > 0
        ? (daysPresent / workingDaysPast.length) * 100
        : 0

    return {
      userId: user._id,
      name: user.name,
      role: user.role,
      days,
      avgHours,
      attendanceRate,
      daysPresent,
      workingDaysPast: workingDaysPast.length,
    }
  },
})

export const getDayDetail = query({
  args: {
    userId: v.optional(v.id("users")),
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, { userId, date }) => {
    const currentUser = await getUserOrNull(ctx)
    if (!currentUser) return null

    // Determine target user
    const targetUserId =
      currentUser.role === "admin" && userId ? userId : currentUser._id

    // Non-admin roles can only see own data
    if (currentUser.role !== "admin" && userId && userId !== currentUser._id) {
      return null
    }

    const targetUser = await ctx.db.get(targetUserId)
    if (!targetUser) return null

    // Get sessions for this day
    const allUserSessions = await ctx.db
      .query("attendanceSessions")
      .withIndex("byUserIdAndDate", (q) =>
        q.eq("userId", targetUserId).eq("date", date)
      )
      .collect()

    const sessions = allUserSessions
      .sort((a, b) => a.startTime - b.startTime)
      .map((s) => ({
        startTime: s.startTime,
        endTime: s.endTime,
        durationMs: s.endTime - s.startTime,
        isActive: s.isActive,
      }))

    const totalMs = sessions.reduce((sum, s) => sum + s.durationMs, 0)

    // Calculate break time (gaps between consecutive sessions)
    let breakMs = 0
    for (let i = 1; i < sessions.length; i++) {
      breakMs += sessions[i].startTime - sessions[i - 1].endTime
    }

    // Get activity counts from activityLogs for this day
    const dayStart = new Date(date + "T00:00:00").getTime()
    const dayEnd = new Date(date + "T23:59:59.999").getTime()

    const allLogs = await ctx.db
      .query("activityLogs")
      .withIndex("byPerformedBy", (q) => q.eq("performedBy", targetUserId))
      .collect()

    const dayLogs = allLogs.filter(
      (l) => l.timestamp >= dayStart && l.timestamp <= dayEnd
    )

    const activities = {
      leadsCreated: dayLogs.filter((l) => l.action === "lead_created").length,
      statusChanges: dayLogs.filter((l) => l.action === "status_changed").length,
      remarksAdded: dayLogs.filter((l) => l.action === "remark_added").length,
      followUpsSet: dayLogs.filter((l) => l.action === "follow_up_set").length,
      total: dayLogs.length,
    }

    return {
      user: {
        id: targetUser._id,
        name: targetUser.name,
        role: targetUser.role,
        imageUrl: targetUser.imageUrl,
      },
      date,
      sessions,
      totalMs,
      totalHours: totalMs / (1000 * 60 * 60),
      breakMs,
      sessionCount: sessions.length,
      activities,
    }
  },
})
