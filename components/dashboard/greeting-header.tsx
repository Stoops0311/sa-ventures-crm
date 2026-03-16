"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/use-current-user"
import { getGreeting } from "@/lib/date-utils"
import { Skeleton } from "@/components/ui/skeleton"

export function GreetingHeader() {
  const { user } = useCurrentUser()
  const stats = useQuery(api.stats.salespersonDashboard)

  const firstName = user?.name?.split(" ")[0] ?? ""
  const greeting = getGreeting()

  return (
    <div className="space-y-1">
      <div className="font-sans text-xl font-bold tracking-tight">
        {user ? (
          `${greeting}, ${firstName}`
        ) : (
          <Skeleton className="h-7 w-64 inline-block" />
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        {stats ? (
          `You have ${stats.followUpsDueToday + stats.overdueFollowUps} follow-ups today and ${stats.newUncontacted} new leads to contact`
        ) : (
          <Skeleton className="h-3.5 w-80 inline-block" />
        )}
      </div>
    </div>
  )
}
