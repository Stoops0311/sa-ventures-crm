"use client"

import { useState } from "react"
import { MyLeadsSection } from "@/components/dashboard/my-leads-section"
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet"

export default function SalespersonLeadsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleViewDetail(id: string) {
    setSelectedLeadId(id)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-6">
      <h1 className="font-sans text-lg font-semibold">My Leads</h1>

      <MyLeadsSection onViewDetail={handleViewDetail} />

      <LeadDetailSheet
        leadId={selectedLeadId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
