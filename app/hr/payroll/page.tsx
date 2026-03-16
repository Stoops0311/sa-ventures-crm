"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PayrollRunWizard } from "@/components/hr/payroll/payroll-run-wizard"
import { PayrollRunList } from "@/components/hr/payroll/payroll-run-list"

export default function PayrollPage() {
  const runs = useQuery(api.payroll.listRuns, {})

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold font-sans">Payroll</h1>
        <p className="text-sm text-muted-foreground">
          Run monthly payroll and manage payment history.
        </p>
      </div>
      <PayrollRunWizard />
      <PayrollRunList runs={runs} />
    </div>
  )
}
