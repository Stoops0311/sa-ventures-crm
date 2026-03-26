"use client"

import { PettyCashLedger } from "@/components/petty-cash/petty-cash-ledger"

export default function ReceptionistPettyCashPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">Petty Cash</h1>
      <PettyCashLedger />
    </div>
  )
}
