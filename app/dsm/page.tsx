"use client"

import { AddLeadForm } from "@/components/dsm/add-lead-form"
import { SubmissionsTable } from "@/components/dsm/submissions-table"

export default function DSMDashboard() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <AddLeadForm />
      <SubmissionsTable />
    </div>
  )
}
