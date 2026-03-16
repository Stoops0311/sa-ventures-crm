"use client"

import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { StatCard } from "@/components/shared/stat-card"

export function HRStatCards() {
  const router = useRouter()
  const stats = useQuery(api.employeeProfiles.getStats)
  const queryStats = useQuery(api.hrQueries.getStats)
  const insuranceStats = useQuery(api.insurance.getStats)

  const pending = (stats?.pendingOnboardings ?? 0) + (stats?.inProgressOnboardings ?? 0)
  const openQueries = queryStats?.open ?? 0
  const newToday = queryStats?.newToday ?? 0
  const expiringWithin30 = insuranceStats?.expiringWithin30 ?? 0
  const expiringWithin7 = insuranceStats?.expiringWithin7 ?? 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Employees"
        value={stats?.totalEmployees ?? 0}
        substat={
          stats?.newThisMonth
            ? `+${stats.newThisMonth} this month`
            : undefined
        }
        substatColor={stats?.newThisMonth ? "text-primary" : undefined}
        onClick={() => router.push("/hr/employees")}
      />
      <StatCard
        label="Pending Onboardings"
        value={pending}
        substat={
          pending > 0
            ? `${stats?.pendingOnboardings ?? 0} new, ${stats?.inProgressOnboardings ?? 0} in progress`
            : "All clear"
        }
        substatColor={pending > 0 ? "text-primary" : undefined}
        onClick={() => router.push("/hr/onboarding")}
      />
      <StatCard
        label="Open Queries"
        value={openQueries}
        substat={
          newToday > 0
            ? `${newToday} new today`
            : openQueries > 0
              ? `${queryStats?.inProgress ?? 0} in progress`
              : "All clear"
        }
        substatColor={newToday > 0 ? "text-primary" : undefined}
        onClick={() => router.push("/hr/queries")}
      />
      <StatCard
        label="Insurance Renewals"
        value={expiringWithin30}
        substat={
          expiringWithin7 > 0
            ? `${expiringWithin7} within 7 days`
            : expiringWithin30 > 0
              ? "Within 30 days"
              : "All current"
        }
        substatColor={expiringWithin7 > 0 ? "text-destructive" : undefined}
        onClick={() => router.push("/hr/insurance")}
      />
    </div>
  )
}
