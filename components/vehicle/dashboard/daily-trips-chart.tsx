"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export function DailyTripsChart() {
  const stats = useQuery(api.trips.getDashboardStats)

  if (!stats) {
    return <Skeleton className="h-72" />
  }

  const data = stats.dailyTrips.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    trips: d.count,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Daily Trips (Last 14 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 0,
                  border: "1px solid hsl(var(--border))",
                }}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar
                dataKey="trips"
                fill="hsl(var(--primary))"
                radius={[0, 0, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
