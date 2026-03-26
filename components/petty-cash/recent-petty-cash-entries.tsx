"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getPettyCashTypeStyle, getPettyCashCategoryStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"
import Link from "next/link"

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

export function RecentPettyCashEntries() {
  const entries = useQuery(api.pettyCash.list, {})

  if (entries === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!entries) return null

  const recentEntries = entries.slice(0, 5)

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Recent Entries</CardTitle>
        <Link
          href="/receptionist/petty-cash"
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent>
        {recentEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No entries today
          </p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map((entry) => {
              const typeStyle = getPettyCashTypeStyle(entry.type)
              const catStyle = getPettyCashCategoryStyle(entry.category)
              return (
                <div
                  key={entry._id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 border bg-background",
                    entry.isVoided && "opacity-50 line-through"
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
                    <p className="text-xs truncate">{entry.personDisplayName}</p>
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
                  <p className={cn(
                    "text-sm font-mono font-medium tabular-nums shrink-0",
                    entry.type === "given" ? "text-red-700" : "text-green-700"
                  )}>
                    {entry.type === "given" ? "-" : "+"}{formatINR(entry.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
