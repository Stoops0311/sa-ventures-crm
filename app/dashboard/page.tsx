"use client"

import { useState } from "react"
import { WhatsAppConnectCard } from "@/components/dashboard/whatsapp-connect"
import { GreetingHeader } from "@/components/dashboard/greeting-header"
import { QuickStatsBar } from "@/components/dashboard/quick-stats-bar"
import { FollowUpsSection } from "@/components/dashboard/follow-ups-section"
import { MyLeadsSection } from "@/components/dashboard/my-leads-section"
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet"
import type { Id } from "@/convex/_generated/dataModel"

export default function SalespersonDashboard() {
  const [selectedLeadId, setSelectedLeadId] = useState<Id<"leads"> | null>(
    null
  )
  const [sheetOpen, setSheetOpen] = useState(false)

  function onViewDetail(id: string) {
    setSelectedLeadId(id as Id<"leads">)
    setSheetOpen(true)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <WhatsAppConnectCard />
      <GreetingHeader />
      <QuickStatsBar />
      <FollowUpsSection onViewDetail={onViewDetail} />
      <MyLeadsSection onViewDetail={onViewDetail} />

      <LeadDetailSheet
        leadId={selectedLeadId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
