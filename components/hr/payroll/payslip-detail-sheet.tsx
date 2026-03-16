"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileDownloadIcon, PencilEdit01Icon } from "@hugeicons/core-free-icons"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PayslipOverrideDialog } from "./payslip-override-dialog"
import { formatINR, amountToWords } from "@/lib/currency"
import { toast } from "sonner"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

type BreakdownComponent = {
  name: string
  type: string
  amount: number
}

interface EnrichedPayslip {
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
  employeeName: string
  designation?: string | null
  department?: string | null
  panNumber?: string | null
  bankName?: string | null
  accountNumber?: string | null
}

interface PayslipDetailSheetProps {
  payslip: EnrichedPayslip | null
  open: boolean
  onOpenChange: (open: boolean) => void
  runStatus: "draft" | "confirmed"
}

export function PayslipDetailSheet({
  payslip,
  open,
  onOpenChange,
  runStatus,
}: PayslipDetailSheetProps) {
  const [overrideOpen, setOverrideOpen] = useState(false)

  const downloadUrl = useQuery(
    api.payroll.getPayslipDownloadUrl,
    payslip && payslip.pdfStorageId ? { payslipId: payslip._id } : "skip"
  )

  if (!payslip) return null

  let components: BreakdownComponent[] = []
  try {
    const parsed = JSON.parse(payslip.breakdown)
    components = parsed.components ?? []
  } catch {
    /* empty */
  }

  const earnings = components.filter((c) => c.type === "earning")
  const deductions = components.filter((c) => c.type === "deduction")
  const monthLabel = `${MONTH_NAMES[payslip.month - 1]} ${payslip.year}`

  const maskedPAN = payslip.panNumber
    ? "XXXXX" + payslip.panNumber.slice(5)
    : "\u2014"
  const maskedBank = payslip.accountNumber
    ? "XXXX" + payslip.accountNumber.slice(-4)
    : "\u2014"

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank")
      toast.success("Payslip downloaded")
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-[560px] sm:min-w-[420px] flex flex-col p-0">
          {/* Header */}
          <SheetHeader className="sticky top-0 bg-background border-b p-4 z-10">
            <div className="flex items-center gap-2">
              <SheetTitle className="text-base">{payslip.employeeName}</SheetTitle>
              {payslip.isOverridden && (
                <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
                  Overridden
                </Badge>
              )}
            </div>
            <SheetDescription>Payslip for {monthLabel}</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="divide-y">
              {/* Employee info */}
              <div className="bg-muted/30 p-4 grid grid-cols-2 gap-3">
                <InfoField label="Designation" value={payslip.designation ?? "\u2014"} />
                <InfoField label="Department" value={payslip.department ?? "\u2014"} />
                <InfoField label="PAN" value={maskedPAN} />
                <InfoField label="Bank" value={`${payslip.bankName ?? "\u2014"} / ${maskedBank}`} />
              </div>

              {/* Earnings */}
              <div className="p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                  Earnings
                </p>
                {earnings.map((c) => (
                  <div key={c.name} className="flex justify-between text-xs">
                    <span className="font-mono">{c.name}</span>
                    <span className="font-mono tabular-nums">{formatINR(c.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-medium border-t pt-1.5">
                  <span>Gross Earnings</span>
                  <span className="font-mono tabular-nums">{formatINR(payslip.grossEarnings)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-4 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">
                  Deductions
                </p>
                {deductions.map((c) => (
                  <div key={c.name} className="flex justify-between text-xs">
                    <span className="font-mono">{c.name}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">{formatINR(c.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-medium border-t pt-1.5">
                  <span>Total Deductions</span>
                  <span className="font-mono tabular-nums">{formatINR(payslip.totalDeductions)}</span>
                </div>
              </div>

              <Separator />

              {/* Net Pay */}
              <div className="bg-muted/50 p-4 text-center space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Net Pay</p>
                <p className="text-2xl font-bold text-primary tabular-nums">
                  {formatINR(payslip.netPay)}
                </p>
                <p className="text-xs text-muted-foreground italic">
                  {amountToWords(payslip.netPay)}
                </p>
              </div>
            </div>
          </ScrollArea>

          {/* Footer actions */}
          <SheetFooter className="sticky bottom-0 border-t bg-background p-4">
            {runStatus === "draft" && (
              <Button variant="outline" size="sm" onClick={() => setOverrideOpen(true)}>
                <HugeiconsIcon icon={PencilEdit01Icon} className="size-3.5 mr-1.5" strokeWidth={2} />
                Override Amounts
              </Button>
            )}
            {runStatus === "confirmed" && payslip.pdfStorageId && (
              <Button size="sm" onClick={handleDownload} disabled={!downloadUrl}>
                <HugeiconsIcon icon={FileDownloadIcon} className="size-3.5 mr-1.5" strokeWidth={2} />
                {downloadUrl ? "Download PDF" : "Generating..."}
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Override dialog (rendered outside Sheet to avoid z-index issues) */}
      <PayslipOverrideDialog
        payslipId={payslip._id}
        employeeName={payslip.employeeName}
        breakdown={payslip.breakdown}
        open={overrideOpen}
        onOpenChange={setOverrideOpen}
      />
    </>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xs font-mono">{value}</p>
    </div>
  )
}
