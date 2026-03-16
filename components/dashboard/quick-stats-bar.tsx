"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Skeleton } from "@/components/ui/skeleton"

export function QuickStatsBar() {
  const stats = useQuery(api.stats.salespersonDashboard)

  const items = stats
    ? [
        { label: "My Active Leads", value: stats.myActiveLeads },
        { label: "New (Uncontacted)", value: stats.newUncontacted },
        { label: "Visits This Week", value: stats.visitsThisWeek },
        { label: "Conversions (Month)", value: stats.conversionsThisMonth },
      ]
    : null

  return (
    <div className="bg-muted p-3 flex items-center gap-6 overflow-x-auto">
      {items ? (
        items.map((item) => (
          <div key={item.label} className="shrink-0">
            <p className="text-[10px] text-muted-foreground">
              {item.label}
            </p>
            <p className="font-sans font-bold tabular-nums">{item.value}</p>
          </div>
        ))
      ) : (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shrink-0 space-y-1">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-5 w-8" />
          </div>
        ))
      )}
    </div>
  )
}
