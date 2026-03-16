"use client"

import { TripsTable } from "@/components/vehicle/trips-table"

export default function TripsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">Trip Log</h1>
      <TripsTable />
    </div>
  )
}
