"use client"

import { PerformancePivotTable } from "@/components/admin/performance-pivot-table"

export default function PerformancePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">Team Performance</h1>
      <PerformancePivotTable />
    </div>
  )
}
