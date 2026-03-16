"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export function FuelCostTrendChart() {
  const stats = useQuery(api.trips.getDashboardStats)

  if (!stats) {
    return <Skeleton className="h-72" />
  }

  const data = stats.dailyFuelCost.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    cost: d.cost,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Fuel Cost Trend (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={50}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 0,
                  border: "1px solid hsl(var(--border))",
                }}
                formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Cost"]}
              />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
