"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoneyReceiveSquareIcon } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function PayrollRunWizard() {
  const router = useRouter()
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [loading, setLoading] = useState(false)

  const canRun = useQuery(api.payroll.canRunPayroll, {
    month: selectedMonth,
    year: selectedYear,
  })
  const createRun = useMutation(api.payroll.createRun)

  const handleRunPayroll = async () => {
    setLoading(true)
    try {
      const runId = await createRun({ month: selectedMonth, year: selectedYear })
      toast.success(`Draft payroll created for ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`)
      router.push(`/hr/payroll/${runId}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create payroll run")
    } finally {
      setLoading(false)
    }
  }

  const currentYear = now.getFullYear()
  const yearOptions = [currentYear, currentYear - 1]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Run Payroll</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((name, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleRunPayroll}
            disabled={loading || !canRun?.canRun}
          >
            <HugeiconsIcon icon={MoneyReceiveSquareIcon} className="size-4 mr-2" />
            {loading ? "Processing..." : "Run Payroll"}
          </Button>
        </div>

        {/* Validation messages */}
        {canRun && !canRun.canRun && canRun.existingRun && (
          <>
            {canRun.existingRun.status === "draft" ? (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="flex items-center justify-between text-yellow-700">
                  <span>
                    A draft payroll run exists for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-yellow-700 underline px-0"
                    onClick={() => router.push(`/hr/payroll/${canRun.existingRun!._id}`)}
                  >
                    Continue reviewing
                  </Button>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="flex items-center justify-between text-green-700">
                  <span>
                    Payroll for {MONTH_NAMES[selectedMonth - 1]} {selectedYear} has been confirmed.
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-green-700 underline px-0"
                    onClick={() => router.push(`/hr/payroll/${canRun.existingRun!._id}`)}
                  >
                    View details
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
