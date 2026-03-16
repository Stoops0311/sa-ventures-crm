"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ViewIcon,
  PencilEdit01Icon,
  FileDownloadIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PayslipDetailSheet } from "./payslip-detail-sheet"
import { PayslipOverrideDialog } from "./payslip-override-dialog"
import { formatINR } from "@/lib/currency"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type EnrichedPayslip = {
  _id: Id<"payslips">
  payrollRunId: Id<"payrollRuns">
  userId: Id<"users">
  month: number
  year: number
  breakdown: string
  grossEarnings: number
  totalDeductions: number
  netPay: number
  isOverridden: boolean
  pdfStorageId?: Id<"_storage">
  createdAt: number
  employeeName: string
  designation: string | null
  department: string | null
  panNumber: string | null
  bankName: string | null
  accountNumber: string | null
}

interface PayrollReviewTableProps {
  payslips: EnrichedPayslip[]
  runStatus: "draft" | "confirmed"
}

export function PayrollReviewTable({ payslips, runStatus }: PayrollReviewTableProps) {
  const [search, setSearch] = useState("")
  const [selectedPayslip, setSelectedPayslip] = useState<EnrichedPayslip | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [overrideTarget, setOverrideTarget] = useState<EnrichedPayslip | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return payslips
    const q = search.toLowerCase()
    return payslips.filter((p) => p.employeeName.toLowerCase().includes(q))
  }, [payslips, search])

  const totalGross = filtered.reduce((s, p) => s + p.grossEarnings, 0)
  const totalDeductions = filtered.reduce((s, p) => s + p.totalDeductions, 0)
  const totalNet = filtered.reduce((s, p) => s + p.netPay, 0)

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative w-64">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
          strokeWidth={2}
        />
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Table */}
      <div className="overflow-auto border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-muted-foreground text-xs">#</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="hidden md:table-cell">Designation</TableHead>
              <TableHead className="text-right">Gross</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ps, idx) => (
              <PayslipRow
                key={ps._id}
                payslip={ps}
                index={idx + 1}
                runStatus={runStatus}
                onView={() => {
                  setSelectedPayslip(ps)
                  setSheetOpen(true)
                }}
                onOverride={() => setOverrideTarget(ps)}
              />
            ))}
            {/* Summary row */}
            {filtered.length > 0 && (
              <TableRow className="bg-muted font-medium">
                <TableCell />
                <TableCell className="text-xs">TOTAL</TableCell>
                <TableCell className="hidden md:table-cell" />
                <TableCell className="text-right font-mono tabular-nums text-xs">
                  {formatINR(totalGross)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-xs text-muted-foreground">
                  {formatINR(totalDeductions)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums text-xs font-bold">
                  {formatINR(totalNet)}
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? "No employees match your search." : "No payslips in this run."}
        </p>
      )}

      {/* Detail sheet */}
      <PayslipDetailSheet
        payslip={selectedPayslip}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        runStatus={runStatus}
      />

      {/* Override dialog */}
      <PayslipOverrideDialog
        payslipId={overrideTarget?._id}
        employeeName={overrideTarget?.employeeName ?? ""}
        breakdown={overrideTarget?.breakdown ?? ""}
        open={!!overrideTarget}
        onOpenChange={(open) => {
          if (!open) setOverrideTarget(null)
        }}
      />
    </div>
  )
}

function PayslipRow({
  payslip,
  index,
  runStatus,
  onView,
  onOverride,
}: {
  payslip: EnrichedPayslip
  index: number
  runStatus: "draft" | "confirmed"
  onView: () => void
  onOverride: () => void
}) {
  const downloadUrl = useQuery(
    api.payroll.getPayslipDownloadUrl,
    runStatus === "confirmed" && payslip.pdfStorageId
      ? { payslipId: payslip._id }
      : "skip"
  )

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="text-muted-foreground text-xs tabular-nums">{index}</TableCell>
      <TableCell className="font-medium text-xs">{payslip.employeeName}</TableCell>
      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
        {payslip.designation ?? "\u2014"}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums text-xs">
        {formatINR(payslip.grossEarnings)}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums text-xs text-muted-foreground">
        {formatINR(payslip.totalDeductions)}
      </TableCell>
      <TableCell className="text-right font-mono tabular-nums text-xs font-medium">
        {formatINR(payslip.netPay)}
      </TableCell>
      <TableCell>
        {payslip.isOverridden && (
          <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
            Overridden
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon-sm" onClick={onView} title="View details">
            <HugeiconsIcon icon={ViewIcon} className="size-3.5" strokeWidth={2} />
          </Button>
          {runStatus === "draft" && (
            <Button variant="ghost" size="icon-sm" onClick={onOverride} title="Override amounts">
              <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5" strokeWidth={2} />
            </Button>
          )}
          {runStatus === "confirmed" && payslip.pdfStorageId && (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Download PDF"
              disabled={!downloadUrl}
              onClick={() => {
                if (downloadUrl) {
                  window.open(downloadUrl, "_blank")
                  toast.success("Payslip downloaded")
                }
              }}
            >
              <HugeiconsIcon
                icon={FileDownloadIcon}
                className={cn("size-3.5", !downloadUrl && "animate-pulse")}
                strokeWidth={2}
              />
            </Button>
          )}
          {runStatus === "confirmed" && !payslip.pdfStorageId && (
            <span className="text-[10px] text-muted-foreground italic">Generating...</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
