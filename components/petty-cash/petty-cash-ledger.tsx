"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  getPettyCashTypeStyle,
  getPettyCashCategoryStyle,
  PETTY_CASH_CATEGORY_STYLES,
} from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Add01Icon,
  Loading03Icon,
  Cancel01Icon,
  File01Icon,
} from "@hugeicons/core-free-icons"
import { AddEntryDialog } from "./add-entry-dialog"
import { OpeningBalanceDialog } from "./opening-balance-dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatTime(epoch: number): string {
  return new Date(epoch).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function getDateString(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDisplayDate(dateStr: string): string {
  const today = getDateString()
  if (dateStr === today) return "Today"
  const yesterday = getDateString(-1)
  if (dateStr === yesterday) return "Yesterday"
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function PettyCashLedger() {
  const [date, setDate] = useState(getDateString())
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const entries = useQuery(api.pettyCash.list, {
    date,
    type: typeFilter !== "all" ? typeFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  })
  const summary = useQuery(api.pettyCash.getDailySummary, { date })
  const balance = useQuery(api.pettyCash.getRunningBalance, { upToDate: date })

  if (entries === undefined || summary === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!entries || !summary) return null

  return (
    <div className="space-y-4">
      {/* Header: Date nav + balance + actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDate(shiftDate(date, -1))}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          </Button>
          <div className="text-sm font-medium min-w-[140px] text-center">
            {formatDisplayDate(date)}
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={date >= getDateString()}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>

        {balance && (
          <div className="text-sm">
            <span className="text-muted-foreground">Cash in Hand:</span>{" "}
            <span className="font-mono font-bold tabular-nums">
              {formatINR(balance.cashInHand)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <OpeningBalanceDialog>
            <Button variant="outline" size="sm" className="h-8 text-xs">
              Opening Balance
            </Button>
          </OpeningBalanceDialog>
          <AddEntryDialog>
            <Button size="sm" className="h-8 text-xs">
              <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
              Add Entry
            </Button>
          </AddEntryDialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="given">Given</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {PETTY_CASH_CATEGORY_STYLES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Entries Table */}
      <Card>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              No entries for this day
            </p>
          ) : (
            <div className="divide-y">
              {entries.map((entry) => {
                const typeStyle = getPettyCashTypeStyle(entry.type)
                const catStyle = getPettyCashCategoryStyle(entry.category)
                return (
                  <LedgerRow
                    key={entry._id}
                    entry={entry}
                    typeStyle={typeStyle}
                    catStyle={catStyle}
                  />
                )
              })}
            </div>
          )}

          {/* Summary Row */}
          {entries.length > 0 && (
            <div className="border-t-2 bg-muted/50 p-3 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs">
                <span>
                  Given: <span className="font-mono font-medium text-red-700">{formatINR(summary.totalGiven)}</span>
                </span>
                <span>
                  Returned: <span className="font-mono font-medium text-green-700">{formatINR(summary.totalReturned)}</span>
                </span>
              </div>
              <div className="text-sm font-medium">
                Net:{" "}
                <span className={cn(
                  "font-mono tabular-nums",
                  summary.netFlow >= 0 ? "text-green-700" : "text-red-700"
                )}>
                  {formatINR(summary.netFlow)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function LedgerRow({
  entry,
  typeStyle,
  catStyle,
}: {
  entry: any
  typeStyle: ReturnType<typeof getPettyCashTypeStyle>
  catStyle: ReturnType<typeof getPettyCashCategoryStyle>
}) {
  const [voidOpen, setVoidOpen] = useState(false)
  const [voidReason, setVoidReason] = useState("")
  const [voiding, setVoiding] = useState(false)
  const voidEntry = useMutation(api.pettyCash.voidEntry)

  const handleVoid = async () => {
    if (!voidReason.trim()) {
      toast.error("Please enter a reason")
      return
    }
    setVoiding(true)
    try {
      await voidEntry({ entryId: entry._id, reason: voidReason.trim() })
      toast.success("Entry voided")
      setVoidOpen(false)
      setVoidReason("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to void")
    } finally {
      setVoiding(false)
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3",
        entry.isVoided && "opacity-40"
      )}
    >
      <div className="text-[10px] text-muted-foreground font-mono w-14 shrink-0">
        {formatTime(entry.createdAt)}
      </div>

      <Badge
        variant="secondary"
        className={cn(
          "text-[10px] px-1.5 py-0 h-5 border shrink-0",
          typeStyle.bg, typeStyle.text, typeStyle.border
        )}
      >
        {typeStyle.label}
      </Badge>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", entry.isVoided && "line-through")}>
          {entry.personDisplayName}
        </p>
        <p className={cn("text-xs text-muted-foreground truncate", entry.isVoided && "line-through")}>
          {entry.description}
        </p>
      </div>

      <Badge
        variant="secondary"
        className={cn(
          "text-[10px] px-1.5 py-0 h-5 border shrink-0",
          catStyle.bg, catStyle.text, catStyle.border
        )}
      >
        {catStyle.label}
      </Badge>

      {entry.receiptUrl && (
        <a
          href={entry.receiptUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <HugeiconsIcon icon={File01Icon} strokeWidth={2} className="size-4 text-muted-foreground hover:text-foreground" />
        </a>
      )}

      <p className={cn(
        "text-sm font-mono font-medium tabular-nums shrink-0 w-20 text-right",
        entry.type === "given" ? "text-red-700" : "text-green-700",
        entry.isVoided && "line-through"
      )}>
        {entry.type === "given" ? "-" : "+"}{formatINR(entry.amount)}
      </p>

      {!entry.isVoided ? (
        <Popover open={voidOpen} onOpenChange={setVoidOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <p className="text-xs font-medium">Void this entry?</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Reason</Label>
                <Textarea
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Why is this being voided?"
                  rows={2}
                  className="min-h-[3rem] resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleVoid}
                  disabled={voiding}
                  className="flex-1"
                >
                  {voiding ? (
                    <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin size-3" />
                  ) : null}
                  Void
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setVoidOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="w-7 shrink-0" />
      )}

      {entry.isVoided && (
        <span className="text-[10px] text-destructive shrink-0">VOID</span>
      )}
    </div>
  )
}
