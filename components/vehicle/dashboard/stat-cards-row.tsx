"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatINR } from "@/lib/currency"

function ChangeIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  if (pct === 0) return null

  return (
    <span className={`text-xs font-mono ${pct > 0 ? "text-emerald-600" : "text-red-600"}`}>
      {pct > 0 ? "+" : ""}{pct}%
    </span>
  )
}

export function VehicleStatCards() {
  const stats = useQuery(api.trips.getDashboardStats)
  const vehicleStats = useQuery(api.vehicles.getStats)

  if (!stats || !vehicleStats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      label: "Total Vehicles",
      value: vehicleStats.total.toString(),
      sub: `${vehicleStats.active} active`,
    },
    {
      label: "Trips Today",
      value: stats.tripsToday.toString(),
    },
    {
      label: "Km This Month",
      value: stats.kmThisMonth.toLocaleString("en-IN"),
      change: { current: stats.kmThisMonth, previous: stats.kmPrevMonth },
    },
    {
      label: "Fuel Cost This Month",
      value: formatINR(stats.fuelCostThisMonth),
      change: { current: stats.fuelCostThisMonth, previous: stats.fuelCostPrevMonth },
    },
    {
      label: "Avg Cost/Km",
      value: stats.avgCostPerKm > 0 ? `${formatINR(stats.avgCostPerKm)}/km` : "—",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-xl font-mono font-semibold">{card.value}</p>
              {card.change && (
                <ChangeIndicator
                  current={card.change.current}
                  previous={card.change.previous}
                />
              )}
            </div>
            {card.sub && (
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
