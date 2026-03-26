"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { getPettyCashCategoryStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function getDateString(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getMonthStart(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}-01`
}

export function PettyCashReport() {
  const [dateFrom, setDateFrom] = useState(getMonthStart())
  const [dateTo, setDateTo] = useState(getDateString())

  const report = useQuery(api.pettyCash.getReportData, {
    dateFrom,
    dateTo,
  })

  if (report === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (!report) return null

  const handleDownloadCSV = () => {
    // Build CSV content
    let csv = "Category,Given,Returned,Net,Entries\n"
    for (const item of report.categoryBreakdown) {
      const catStyle = getPettyCashCategoryStyle(item.category)
      csv += `"${catStyle.label}",${item.given},${item.returned},${item.returned - item.given},${item.count}\n`
    }
    csv += `\n"TOTAL",${report.totalGiven},${report.totalReturned},${report.netFlow},${report.entryCount}\n`

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `petty-cash-report-${dateFrom}-to-${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Date Range */}
      <div className="flex items-end gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">From</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">To</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
          Download CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-red-50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Total Given
            </p>
            <p className="text-xl font-mono font-bold tabular-nums text-red-700">
              {formatINR(report.totalGiven)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Total Returned
            </p>
            <p className="text-xl font-mono font-bold tabular-nums text-green-700">
              {formatINR(report.totalReturned)}
            </p>
          </CardContent>
        </Card>
        <Card className={report.netFlow >= 0 ? "bg-green-50" : "bg-red-50"}>
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Net Flow
            </p>
            <p className={cn(
              "text-xl font-mono font-bold tabular-nums",
              report.netFlow >= 0 ? "text-green-700" : "text-red-700"
            )}>
              {formatINR(report.netFlow)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-muted">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Total Entries
            </p>
            <p className="text-xl font-mono font-bold tabular-nums">
              {report.entryCount}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardContent className="p-0">
          <div className="p-3 border-b">
            <p className="text-sm font-medium">Category Breakdown</p>
          </div>

          {report.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No data for this period
            </p>
          ) : (
            <div className="divide-y">
              {report.categoryBreakdown
                .sort((a, b) => (b.given + b.returned) - (a.given + a.returned))
                .map((item) => {
                  const catStyle = getPettyCashCategoryStyle(item.category)
                  return (
                    <div key={item.category} className="flex items-center gap-3 p-3">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-5 border shrink-0 min-w-[80px] justify-center",
                          catStyle.bg, catStyle.text, catStyle.border
                        )}
                      >
                        {catStyle.label}
                      </Badge>
                      <div className="flex-1" />
                      <div className="text-xs text-muted-foreground">
                        {item.count} entries
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-xs font-mono text-red-700 tabular-nums">
                          -{formatINR(item.given)}
                        </span>
                      </div>
                      <div className="w-24 text-right">
                        <span className="text-xs font-mono text-green-700 tabular-nums">
                          +{formatINR(item.returned)}
                        </span>
                      </div>
                      <div className="w-24 text-right">
                        <span className={cn(
                          "text-sm font-mono font-medium tabular-nums",
                          (item.returned - item.given) >= 0 ? "text-green-700" : "text-red-700"
                        )}>
                          {formatINR(item.returned - item.given)}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
