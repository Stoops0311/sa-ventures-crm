"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle01Icon,
  Delete01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PayrollReviewTable } from "@/components/hr/payroll/payroll-review-table"
import { formatINR } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-mono">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl font-bold tabular-nums font-sans",
          highlight && "text-primary"
        )}
      >
        {value}
      </p>
    </div>
  )
}

function PayrollRunDetailSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-5 w-24" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="flex gap-8 bg-muted/50 py-3 px-6">
        <Skeleton className="h-14 w-40" />
        <Skeleton className="h-14 w-40" />
        <Skeleton className="h-14 w-40" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export default function PayrollRunDetailPage() {
  const params = useParams()
  const router = useRouter()
  const runId = params.runId as Id<"payrollRuns">

  const runDetail = useQuery(api.payroll.getRunDetail, { runId })
  const confirmRun = useMutation(api.payroll.confirmRun)
  const deleteRun = useMutation(api.payroll.deleteRun)
  const retryPdfs = useMutation(api.payroll.retryPdfGeneration)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [retrying, setRetrying] = useState(false)

  if (runDetail === undefined) return <PayrollRunDetailSkeleton />
  if (runDetail === null) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Payroll run not found.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => router.push("/hr/payroll")}
        >
          Back to Payroll
        </Button>
      </div>
    )
  }

  const monthLabel = `${MONTH_NAMES[runDetail.month - 1]} ${runDetail.year}`
  const totalGross = runDetail.payslips.reduce((s, p) => s + p.grossEarnings, 0)
  const totalDeductions = runDetail.payslips.reduce((s, p) => s + p.totalDeductions, 0)
  const totalNet = runDetail.payslips.reduce((s, p) => s + p.netPay, 0)
  const overrideCount = runDetail.payslips.filter((p) => p.isOverridden).length

  const handleConfirm = async () => {
    setConfirming(true)
    try {
      await confirmRun({ runId })
      setConfirmOpen(false)
      toast.success(
        `Payroll confirmed. Generating ${runDetail.payslips.length} payslips...`
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to confirm")
    } finally {
      setConfirming(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteRun({ runId })
      router.push("/hr/payroll")
      toast.success("Draft payroll run deleted.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-6 space-y-4">
      {/* Back link */}
      <Button
        variant="link"
        size="sm"
        className="px-0 text-muted-foreground"
        onClick={() => router.push("/hr/payroll")}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5 mr-1" strokeWidth={2} />
        Payroll
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Payroll — {monthLabel}</h1>
          <Badge
            variant="secondary"
            className={
              runDetail.status === "draft"
                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                : "bg-green-50 text-green-700 border-green-200"
            }
          >
            {runDetail.status === "draft" ? "Draft" : "Confirmed"}
          </Badge>
        </div>
        <div className="flex gap-2">
          {runDetail.status === "draft" && (
            <>
              <Button onClick={() => setConfirmOpen(true)}>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 mr-2" strokeWidth={2} />
                Confirm Payroll
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <HugeiconsIcon icon={Delete01Icon} className="size-4 mr-2" strokeWidth={2} />
                Delete Run
              </Button>
            </>
          )}
          {runDetail.status === "confirmed" &&
            runDetail.payslips.some((p) => !p.pdfStorageId) && (
              <Button
                variant="outline"
                size="sm"
                disabled={retrying}
                onClick={async () => {
                  setRetrying(true)
                  try {
                    const count = await retryPdfs({ runId })
                    toast.success(`Regenerating ${count} payslip PDFs...`)
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed to retry")
                  } finally {
                    setRetrying(false)
                  }
                }}
              >
                {retrying ? "Generating..." : "Retry PDF Generation"}
              </Button>
            )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="flex items-center bg-muted/50 py-3 px-6 gap-8 flex-wrap">
        <SummaryStat label="Total Gross Earnings" value={formatINR(totalGross)} />
        <SummaryStat label="Total Deductions" value={formatINR(totalDeductions)} />
        <SummaryStat label="Total Net Pay" value={formatINR(totalNet)} highlight />
        <div className="ml-auto text-sm text-muted-foreground">
          {runDetail.payslips.length} employees
          {overrideCount > 0 && (
            <span className="ml-2 text-xs text-amber-600">
              {overrideCount} overridden
            </span>
          )}
        </div>
      </div>

      {/* Review table */}
      <PayrollReviewTable
        payslips={runDetail.payslips}
        runStatus={runDetail.status as "draft" | "confirmed"}
      />

      {/* Confirm AlertDialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {monthLabel} Payroll?</AlertDialogTitle>
            <AlertDialogDescription>
              This will lock all {runDetail.payslips.length} payslips and generate
              PDFs. Amounts cannot be changed after confirmation.
              <br />
              <br />
              <strong>Total disbursement: {formatINR(totalNet)}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={confirming}>
              {confirming ? "Confirming..." : "Confirm & Generate Payslips"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {monthLabel} draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove all {runDetail.payslips.length} draft
              payslips. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
