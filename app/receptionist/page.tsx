"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { getGreeting } from "@/lib/date-utils"
import { VisitStatCards } from "@/components/receptionist/visit-stat-cards"
import { VisitorSearch } from "@/components/receptionist/visitor-search"
import { TodaysVisitsTable } from "@/components/receptionist/todays-visits-table"
import { PettyCashStatCards } from "@/components/petty-cash/petty-cash-stat-cards"
import { RecentPettyCashEntries } from "@/components/petty-cash/recent-petty-cash-entries"
import { Skeleton } from "@/components/ui/skeleton"

export default function ReceptionistDashboard() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">
        {getGreeting()}, {user?.name?.split(" ")[0]}
      </h1>

      {/* Visits Section (primary) */}
      <VisitStatCards />
      <VisitorSearch />
      <TodaysVisitsTable />

      {/* Petty Cash Section (secondary) */}
      <div className="pt-2">
        <h2 className="font-sans text-sm font-medium text-muted-foreground mb-3">
          Petty Cash
        </h2>
        <PettyCashStatCards />
        <div className="mt-4">
          <RecentPettyCashEntries />
        </div>
      </div>
    </div>
  )
}
