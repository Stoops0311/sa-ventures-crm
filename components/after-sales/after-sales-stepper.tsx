"use client"

import type { Id } from "@/convex/_generated/dataModel"
import { AfterSalesStepNode } from "./after-sales-step-node"

type StepData = {
  key: string
  label: string
  status: "pending" | "in_progress" | "completed" | "skipped"
  completedAt: number | null
  completedBy: string | null
  remark: string | null
  amount: number | null
  paymentMode: string | null
  documents: Array<{
    storageId: string
    fileName: string
    uploadedAt: number
  }> | null
  enrichedDocuments?: Array<{
    storageId: string
    fileName: string
    uploadedAt: number
    url: string | null
  }> | null
  bankName: string | null
  loanAmount: number | null
  sanctionDate: string | null
  registrationNumber: string | null
  registrationDate: string | null
  disbursementAmount: number | null
  disbursementDate: string | null
  bookingAmount: number | null
}

interface StepperProps {
  steps: StepData[]
  processId: Id<"afterSalesProcesses">
  canEdit: boolean
}

export function AfterSalesStepper({ steps, processId, canEdit }: StepperProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        // Find the next non-skipped pending/in_progress step label
        const nextActiveStep = steps
          .slice(index + 1)
          .find((s) => s.status === "pending" || s.status === "in_progress")

        return (
          <AfterSalesStepNode
            key={step.key}
            step={step}
            stepNumber={index + 1}
            isLast={index === steps.length - 1}
            canEdit={canEdit}
            processId={processId}
            nextStepLabel={nextActiveStep?.label}
          />
        )
      })}
    </div>
  )
}
