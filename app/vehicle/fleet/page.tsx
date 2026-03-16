"use client"

import { FleetTable } from "@/components/vehicle/fleet-table"

export default function FleetPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">Fleet Management</h1>
      <FleetTable />
    </div>
  )
}
