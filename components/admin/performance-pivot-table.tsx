"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PresenceDot } from "@/components/shared/presence-dot"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
} from "date-fns"

type Period = "week" | "month" | "30d" | "90d" | "all"

type SortKey =
  | "userName"
  | "total"
  | "active"
  | "newLeads"
  | "followUp"
  | "overdue"
  | "visits"
  | "bookings"
  | "conversionRate"
  | "avgAgeDays"

type SortDir = "asc" | "desc"

function getPeriodRange(period: Period): {
  periodStart?: number
  periodEnd?: number
} {
  const now = new Date()
  switch (period) {
    case "week":
      return {
        periodStart: startOfWeek(now, { weekStartsOn: 1 }).getTime(),
        periodEnd: endOfWeek(now, { weekStartsOn: 1 }).getTime(),
      }
    case "month":
      return {
        periodStart: startOfMonth(now).getTime(),
        periodEnd: endOfMonth(now).getTime(),
      }
    case "30d":
      return {
        periodStart: subDays(now, 30).getTime(),
        periodEnd: now.getTime(),
      }
    case "90d":
      return {
        periodStart: subDays(now, 90).getTime(),
        periodEnd: now.getTime(),
      }
    case "all":
      return {}
  }
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 90 Days" },
  { value: "all", label: "All Time" },
]

export function PerformancePivotTable() {
  const [period, setPeriod] = useState<Period>("month")
  const [sortKey, setSortKey] = useState<SortKey>("overdue")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const range = getPeriodRange(period)
  const data = useQuery(api.stats.salespersonPivot, range)
  const router = useRouter()

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      const numA = (aVal as number) ?? 0
      const numB = (bVal as number) ?? 0
      return sortDir === "asc" ? numA - numB : numB - numA
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const handleCellClick = (userId: string, count: number, column: SortKey) => {
    if (count === 0) return
    const base = `/admin/leads?assignedTo=${userId}`
    const routes: Partial<Record<SortKey, string>> = {
      total:          base,
      active:         `${base}&statusGroup=active`,
      newLeads:       `${base}&status=New`,
      followUp:       `${base}&status=Follow Up`,
      overdue:        `${base}&overdue=true`,
      visits:         `${base}&status=Visit Done`,
      bookings:       `${base}&status=Booking Done`,
      conversionRate: `${base}&status=Booking Done`,
      avgAgeDays:     base,
    }
    router.push(routes[column] ?? base)
  }

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null
    return (
      <span className="ml-0.5 text-[10px]">
        {sortDir === "asc" ? "\u2191" : "\u2193"}
      </span>
    )
  }

  const SortableHead = ({
    column,
    children,
    className,
  }: {
    column: SortKey
    children: React.ReactNode
    className?: string
  }) => (
    <TableHead
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50 transition-colors text-xs whitespace-nowrap",
        className
      )}
      onClick={() => handleSort(column)}
    >
      {children}
      <SortIndicator column={column} />
    </TableHead>
  )

  if (data === undefined) {
    return (
      <div className="space-y-4">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (data === null) return null

  return (
    <div className="space-y-4">
      {/* Period filter */}
      <div className="flex gap-1">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={cn(
              "px-2.5 py-1 text-xs border transition-colors",
              period === opt.value
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead column="userName" className="sticky left-0 bg-background z-10">
                Salesperson
              </SortableHead>
              <SortableHead column="total">Total</SortableHead>
              <SortableHead column="active">Active</SortableHead>
              <SortableHead column="newLeads">New</SortableHead>
              <SortableHead column="followUp">Follow Up</SortableHead>
              <SortableHead column="overdue">Overdue</SortableHead>
              <SortableHead column="visits">Visits</SortableHead>
              <SortableHead column="bookings">Bookings</SortableHead>
              <SortableHead column="conversionRate">Conv %</SortableHead>
              <SortableHead column="avgAgeDays">Avg Age</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-sm text-muted-foreground py-8">
                  No salespeople found
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row) => (
                <TableRow key={row.userId}>
                  {/* Salesperson name — sticky */}
                  <TableCell className="sticky left-0 bg-background z-10">
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center bg-muted text-xs font-medium font-sans shrink-0">
                        {row.userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium truncate max-w-[120px]">
                        {row.userName}
                      </span>
                      <PresenceDot
                        isOnline={row.isOnline}
                        lastSeen={row.lastSeen}
                        size="sm"
                      />
                    </div>
                  </TableCell>

                  {/* Total */}
                  <TableCell
                    className={cn(
                      "font-mono tabular-nums text-xs",
                      row.total > 0 && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => handleCellClick(row.userId, row.total, "total")}
                  >
                    {row.total}
                  </TableCell>

                  {/* Active */}
                  <TableCell
                    className={cn(
                      "font-mono tabular-nums text-xs",
                      row.active > 0 && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => handleCellClick(row.userId, row.active, "active")}
                  >
                    {row.active}
                  </TableCell>

                  {/* New (untouched) */}
                  <TableCell
                    className={cn(
                      "font-mono tabular-nums text-xs",
                      row.newLeads > 0 && "text-yellow-600 font-medium cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => handleCellClick(row.userId, row.newLeads, "newLeads")}
                  >
                    {row.newLeads}
                  </TableCell>

                  {/* Follow Up */}
                  <TableCell
                    className={cn(
                      "font-mono tabular-nums text-xs",
                      row.followUp > 0 && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => handleCellClick(row.userId, row.followUp, "followUp")}
                  >
                    {row.followUp}
                  </TableCell>

                  {/* Overdue */}
                  <TableCell
                    className={cn(
                      "font-mono tabular-nums text-xs",
                      row.overdue > 0 && "text-destructive font-bold cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => handleCellClick(row.userId, row.overdue, "overdue")}
                  >
                    {row.overdue}
                  </TableCell>

                  {/* Visits */}
                  <TableCell
                    className={cn(
                      "font-mono tabular-nums text-xs",
                      row.visits > 0 && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => handleCellClick(row.userId, row.visits, "visits")}
                  >
                    {row.visits}
                  </TableCell>

                  {/* Bookings */}
                  <TableCell
                    className={cn(
                      "font-mono tabular-nums text-xs",
                      row.bookings > 0 && "text-green-600 font-medium cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => handleCellClick(row.userId, row.bookings, "bookings")}
                  >
                    {row.bookings}
                  </TableCell>

                  {/* Conversion % */}
                  <TableCell
                    className={cn(
                      "font-mono tabular-nums text-xs",
                      row.bookings > 0 && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => handleCellClick(row.userId, row.bookings, "conversionRate")}
                  >
                    {row.conversionRate}%
                  </TableCell>

                  {/* Avg Age */}
                  <TableCell
                    className={cn(
                      "font-mono tabular-nums text-xs",
                      row.avgAgeDays > 30 && "text-orange-500 font-medium",
                      row.total > 0 && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => handleCellClick(row.userId, row.total, "avgAgeDays")}
                  >
                    {row.avgAgeDays}d
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
