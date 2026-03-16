"use client"

import { useCurrentUser } from "@/hooks/use-current-user"
import { getGreeting } from "@/lib/date-utils"
import { VehicleStatCards } from "@/components/vehicle/dashboard/stat-cards-row"
import { DailyTripsChart } from "@/components/vehicle/dashboard/daily-trips-chart"
import { FuelCostTrendChart } from "@/components/vehicle/dashboard/fuel-cost-trend-chart"
import { VehicleUtilizationChart } from "@/components/vehicle/dashboard/vehicle-utilization-chart"
import { RecentTripsTable } from "@/components/vehicle/dashboard/recent-trips-table"
import { Skeleton } from "@/components/ui/skeleton"

export default function VehicleDashboard() {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    )
  }

  const greeting = getGreeting()
  const firstName = user?.name?.split(" ")[0] ?? ""

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">
        {greeting}, {firstName}
      </h1>

      <VehicleStatCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyTripsChart />
        <FuelCostTrendChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VehicleUtilizationChart />
        <RecentTripsTable />
      </div>
    </div>
  )
}
