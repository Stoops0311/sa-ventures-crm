"use client"

import { PettyCashReport } from "@/components/petty-cash/petty-cash-report"

export default function ReceptionistPettyCashReportPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">Petty Cash Report</h1>
      <PettyCashReport />
    </div>
  )
}
