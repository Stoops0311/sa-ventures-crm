"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { getGreeting } from "@/lib/date-utils"
import { HRStatCards } from "@/components/hr/dashboard/hr-stat-cards"
import { OnboardingQueuePreview } from "@/components/hr/dashboard/onboarding-queue-preview"
import { HRQuickActions } from "@/components/hr/dashboard/hr-quick-actions"
import { HRRecentActivity } from "@/components/hr/dashboard/hr-recent-activity"
import { RecentQueriesPreview } from "@/components/hr/dashboard/recent-queries-preview"
import { HRDashboardSkeleton } from "@/components/shared/loading-skeleton"

export default function HRDashboard() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return <HRDashboardSkeleton />
  }

  const greeting = getGreeting()
  const firstName = user?.name?.split(" ")[0] ?? ""

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">
        {greeting}, {firstName}
      </h1>

      <HRStatCards />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <OnboardingQueuePreview />
        </div>
        <div className="lg:col-span-2">
          <HRQuickActions />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentQueriesPreview />
        <HRRecentActivity />
      </div>
    </div>
  )
}
