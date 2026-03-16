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
import { getVehicleTypeStyle } from "@/lib/constants"

export function VehicleUtilizationChart() {
  const stats = useQuery(api.trips.getDashboardStats)

  if (!stats) {
    return <Skeleton className="h-72" />
  }

  const data = stats.vehicleUtilization.slice(0, 10).map((v) => ({
    name: v.registrationNumber,
    trips: v.tripCount,
    type: getVehicleTypeStyle(v.type).label,
  }))

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Vehicle Utilization (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            No trip data this month
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Vehicle Utilization (This Month)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 0,
                  border: "1px solid hsl(var(--border))",
                }}
                formatter={(value) => [`${value} trips`, "Vehicle"]}
              />
              <Bar
                dataKey="trips"
                fill="hsl(var(--primary))"
                radius={[0, 0, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
