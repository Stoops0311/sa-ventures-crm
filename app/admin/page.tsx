"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { getGreeting } from "@/lib/date-utils"
import { StatCardsRow } from "@/components/admin/stat-cards-row"
import { SalespersonPerformance } from "@/components/admin/salesperson-performance"
import { RecentActivityFeed } from "@/components/admin/recent-activity-feed"
import { QuickActions } from "@/components/admin/quick-actions"
import { WhosOnline } from "@/components/admin/whos-online"
import { PageSkeleton } from "@/components/shared/loading-skeleton"

export default function AdminDashboard() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return <PageSkeleton />
  }

  const greeting = getGreeting()
  const firstName = user?.name?.split(" ")[0] ?? ""

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">
        {greeting}, {firstName}
      </h1>

      <StatCardsRow />

      <SalespersonPerformance />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <RecentActivityFeed />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <QuickActions />
          <WhosOnline />
        </div>
      </div>
    </div>
  )
}
