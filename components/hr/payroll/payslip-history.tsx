"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoneyReceiveSquareIcon, FileDownloadIcon } from "@hugeicons/core-free-icons"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { formatINR, amountToWords } from "@/lib/currency"
import { toast } from "sonner"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

type PayslipWithUrl = {
  _id: Id<"payslips">
  month: number
  year: number
  breakdown: string
  grossEarnings: number
  totalDeductions: number
  netPay: number
  isOverridden: boolean
  pdfStorageId?: Id<"_storage">
  downloadUrl: string | null
}

interface PayslipHistoryProps {
  limit?: number
}

export function PayslipHistory({ limit = 12 }: PayslipHistoryProps) {
  const payslips = useQuery(api.payroll.getMyPayslips, { limit })
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipWithUrl | null>(null)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">My Payslips</CardTitle>
      </CardHeader>
      <CardContent>
        {payslips === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : payslips.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <HugeiconsIcon
              icon={MoneyReceiveSquareIcon}
              className="size-10 text-muted-foreground/50 mb-3"
              strokeWidth={1.5}
            />
            <p className="text-sm text-muted-foreground">No payslips yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your payslips will appear here after payroll is processed.
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((ps) => (
                  <TableRow key={ps._id} className="hover:bg-muted/50">
                    <TableCell>
                      <button
                        className="text-xs font-medium hover:underline text-left"
                        onClick={() => setSelectedPayslip(ps)}
                      >
                        {MONTH_NAMES[ps.month - 1]} {ps.year}
                      </button>
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono tabular-nums">
                      {formatINR(ps.grossEarnings)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono tabular-nums text-muted-foreground">
                      {formatINR(ps.totalDeductions)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-mono tabular-nums font-medium">
                      {formatINR(ps.netPay)}
                    </TableCell>
                    <TableCell>
                      {ps.downloadUrl ? (
                        <Button
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            window.open(ps.downloadUrl!, "_blank")
                            toast.success("Payslip downloaded")
                          }}
                        >
                          <HugeiconsIcon icon={FileDownloadIcon} className="size-3.5" strokeWidth={2} />
                        </Button>
                      ) : ps.pdfStorageId ? (
                        <Skeleton className="size-7" />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}

        {/* Read-only detail sheet */}
        <ReadOnlyPayslipSheet
          payslip={selectedPayslip}
          open={!!selectedPayslip}
          onOpenChange={(open) => {
            if (!open) setSelectedPayslip(null)
          }}
        />
      </CardContent>
    </Card>
  )
}

function ReadOnlyPayslipSheet({
  payslip,
  open,
  onOpenChange,
}: {
  payslip: PayslipWithUrl | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!payslip) return null

  let components: { name: string; type: string; amount: number }[] = []
  try {
    const parsed = JSON.parse(payslip.breakdown)
    components = parsed.components ?? []
  } catch {
    /* empty */
  }

  const earnings = components.filter((c) => c.type === "earning")
  const deductions = components.filter((c) => c.type === "deduction")
  const monthLabel = `${MONTH_NAMES[payslip.month - 1]} ${payslip.year}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] flex flex-col p-0">
        <SheetHeader className="sticky top-0 bg-background border-b p-4 z-10">
          <SheetTitle>Payslip</SheetTitle>
          <SheetDescription>{monthLabel}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="divide-y">
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

        <SheetFooter className="sticky bottom-0 border-t bg-background p-4">
          {payslip.downloadUrl && (
            <Button
              size="sm"
              onClick={() => {
                window.open(payslip.downloadUrl!, "_blank")
                toast.success("Payslip downloaded")
              }}
            >
              <HugeiconsIcon icon={FileDownloadIcon} className="size-3.5 mr-1.5" strokeWidth={2} />
              Download PDF
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
