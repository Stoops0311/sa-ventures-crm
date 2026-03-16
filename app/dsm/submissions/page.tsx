"use client"

import { SubmissionsTable } from "@/components/dsm/submissions-table"

export default function DSMSubmissionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-sans text-lg font-semibold">My Submissions</h1>
      <SubmissionsTable />
    </div>
  )
}
