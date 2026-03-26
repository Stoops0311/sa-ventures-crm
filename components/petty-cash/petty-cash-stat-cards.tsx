"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function PettyCashStatCards() {
  const balance = useQuery(api.pettyCash.getRunningBalance, {})
  const summary = useQuery(api.pettyCash.getDailySummary, {})

  if (balance === undefined || summary === undefined) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    )
  }

  if (!balance || !summary) return null

  const cards = [
    {
      label: "Cash in Hand",
      value: formatINR(balance.cashInHand),
      color: "text-foreground",
      bg: "bg-muted",
    },
    {
      label: "Today Given",
      value: formatINR(summary.totalGiven),
      color: "text-red-700",
      bg: "bg-red-50",
    },
    {
      label: "Today Returned",
      value: formatINR(summary.totalReturned),
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "Today Net",
      value: formatINR(summary.netFlow),
      color: summary.netFlow >= 0 ? "text-green-700" : "text-red-700",
      bg: summary.netFlow >= 0 ? "bg-green-50" : "bg-red-50",
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
            <p className={`text-xl font-mono font-bold tabular-nums ${card.color}`}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
