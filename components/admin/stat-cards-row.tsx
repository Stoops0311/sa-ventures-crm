"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { StatCard } from "@/components/shared/stat-card"
import { StatCardSkeleton } from "@/components/shared/loading-skeleton"

export function StatCardsRow() {
  const stats = useQuery(api.stats.adminDashboard)

  if (stats === undefined || stats === null) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Active Leads"
        value={stats.totalActiveLeads}
      />
      <StatCard
        label="Today's Follow-ups"
        value={stats.todayFollowUps}
        substat={
          stats.overdueFollowUps > 0
            ? `${stats.overdueFollowUps} overdue`
            : undefined
        }
        substatColor={
          stats.overdueFollowUps > 0 ? "text-destructive" : undefined
        }
      />
      <StatCard
        label="Visits Scheduled"
        value={stats.visitsThisWeek}
        substat="this week"
      />
      <StatCard
        label="Bookings This Month"
        value={stats.bookingsThisMonth}
      />
    </div>
  )
}
