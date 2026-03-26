"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function VisitStatCards() {
  const stats = useQuery(api.visits.receptionistStats)

  if (stats === undefined) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    {
      label: "Expected",
      value: stats.expected,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Arrived",
      value: stats.arrived,
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "Walk-ins",
      value: stats.walkIns,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
    {
      label: "No Show",
      value: stats.noShow,
      color: "text-red-700",
      bg: "bg-red-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className={card.bg}>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {card.label}
            </p>
            <p className={`text-2xl font-mono font-bold tabular-nums ${card.color}`}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
