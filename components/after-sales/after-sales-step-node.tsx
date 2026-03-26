"use client"

import { useState } from "react"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Tick02Icon,
  MinusSignIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { AfterSalesStepComplete } from "./after-sales-step-complete"

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

interface StepNodeProps {
  step: StepData
  stepNumber: number
  isLast: boolean
  canEdit: boolean
  processId: Id<"afterSalesProcesses">
  nextStepLabel?: string
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function AfterSalesStepNode({
  step,
  stepNumber,
  isLast,
  canEdit,
  processId,
  nextStepLabel,
}: StepNodeProps) {
  const [expanded, setExpanded] = useState(false)

  const isCompleted = step.status === "completed"
  const isCurrent = step.status === "in_progress"
  const isPending = step.status === "pending"
  const isSkipped = step.status === "skipped"

  const hasDetails =
    step.remark ||
    step.amount ||
    step.bankName ||
    step.loanAmount ||
    step.registrationNumber ||
    step.disbursementAmount ||
    step.bookingAmount ||
    (step.enrichedDocuments && step.enrichedDocuments.length > 0)

  return (
    <div className="flex gap-3">
      {/* Left: indicator + connecting line */}
      <div className="flex flex-col items-center">
        {/* Step indicator */}
        <div
          className={cn(
            "size-7 flex items-center justify-center text-xs font-mono font-bold shrink-0",
            isCompleted &&
              "bg-green-600 text-white",
            isCurrent &&
              "bg-primary text-primary-foreground",
            isPending &&
              "border-2 border-muted-foreground/30 bg-muted/50 text-muted-foreground",
            isSkipped &&
              "border-2 border-dashed border-muted-foreground/40 bg-muted/30 text-muted-foreground"
          )}
        >
          {isCompleted ? (
            <HugeiconsIcon icon={Tick02Icon} strokeWidth={2.5} className="size-4" />
          ) : isSkipped ? (
            <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} className="size-3.5" />
          ) : (
            stepNumber
          )}
        </div>

        {/* Connecting line */}
        {!isLast && (
          <div
            className={cn(
              "w-0.5 flex-1 min-h-4",
              isCompleted || isSkipped ? "bg-green-600" : "bg-border"
            )}
          />
        )}
      </div>

      {/* Right: content */}
      <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
        {/* Header row */}
        <div className="flex items-center gap-2 min-h-7">
          <span
            className={cn(
              "text-xs font-mono",
              isCompleted && "line-through text-muted-foreground",
              isCurrent && "font-sans font-medium text-foreground",
              isPending && "text-muted-foreground",
              isSkipped && "line-through text-muted-foreground"
            )}
          >
            {step.label}
          </span>

          {isSkipped && (
            <span className="text-[10px] text-muted-foreground border border-dashed border-muted-foreground/40 px-1.5 py-0.5">
              Skipped
            </span>
          )}

          {isCompleted && step.completedAt && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {format(new Date(step.completedAt), "dd MMM yyyy")}
            </span>
          )}

          {/* Expand/collapse for completed steps with details */}
          {(isCompleted || isSkipped) && hasDetails && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 ml-auto"
              onClick={() => setExpanded(!expanded)}
            >
              <HugeiconsIcon
                icon={expanded ? ArrowUp01Icon : ArrowDown01Icon}
                strokeWidth={2}
                className="size-3"
              />
            </Button>
          )}
        </div>

        {/* Expanded details for completed/skipped steps */}
        {(isCompleted || isSkipped) && expanded && hasDetails && (
          <div className="mt-2 space-y-1.5">
            {step.remark && (
              <p className="text-[11px] text-muted-foreground">
                {step.remark}
              </p>
            )}

            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px]">
              {step.bookingAmount != null && (
                <>
                  <dt className="text-muted-foreground">Booking Amount</dt>
                  <dd className="font-medium">
                    {formatCurrency(step.bookingAmount)}
                  </dd>
                </>
              )}
              {step.amount != null && (
                <>
                  <dt className="text-muted-foreground">Amount</dt>
                  <dd className="font-medium">
                    {formatCurrency(step.amount)}
                  </dd>
                </>
              )}
              {step.paymentMode && (
                <>
                  <dt className="text-muted-foreground">Payment Mode</dt>
                  <dd className="capitalize">{step.paymentMode}</dd>
                </>
              )}
              {step.bankName && (
                <>
                  <dt className="text-muted-foreground">Bank</dt>
                  <dd>{step.bankName}</dd>
                </>
              )}
              {step.loanAmount != null && (
                <>
                  <dt className="text-muted-foreground">Loan Amount</dt>
                  <dd className="font-medium">
                    {formatCurrency(step.loanAmount)}
                  </dd>
                </>
              )}
              {step.sanctionDate && (
                <>
                  <dt className="text-muted-foreground">Sanction Date</dt>
                  <dd>{step.sanctionDate}</dd>
                </>
              )}
              {step.registrationNumber && (
                <>
                  <dt className="text-muted-foreground">Registration No.</dt>
                  <dd>{step.registrationNumber}</dd>
                </>
              )}
              {step.registrationDate && (
                <>
                  <dt className="text-muted-foreground">Registration Date</dt>
                  <dd>{step.registrationDate}</dd>
                </>
              )}
              {step.disbursementAmount != null && (
                <>
                  <dt className="text-muted-foreground">Disbursement</dt>
                  <dd className="font-medium">
                    {formatCurrency(step.disbursementAmount)}
                  </dd>
                </>
              )}
              {step.disbursementDate && (
                <>
                  <dt className="text-muted-foreground">Disbursement Date</dt>
                  <dd>{step.disbursementDate}</dd>
                </>
              )}
            </dl>

            {/* Documents */}
            {step.enrichedDocuments && step.enrichedDocuments.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-medium">
                  Documents
                </p>
                {step.enrichedDocuments.map((doc) => (
                  <a
                    key={doc.storageId}
                    href={doc.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[10px] text-blue-600 hover:underline truncate"
                  >
                    {doc.fileName}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Current step: inline complete action */}
        {isCurrent && canEdit && (
          <AfterSalesStepComplete
            processId={processId}
            stepKey={step.key}
            stepLabel={step.label}
            nextStepLabel={nextStepLabel}
            existingDocuments={step.enrichedDocuments}
          />
        )}
      </div>
    </div>
  )
}
