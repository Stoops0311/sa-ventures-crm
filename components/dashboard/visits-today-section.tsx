"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getVisitLocationStyle, getVisitCheckinStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"

function formatTime(epoch: number): string {
  return new Date(epoch).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function getUrgencyBorder(visit: { visitDate: number; checkinStatus: string }): string {
  if (visit.checkinStatus === "arrived") return "border-l-green-500"
  if (visit.checkinStatus === "no_show") return "border-l-red-500"

  const now = Date.now()
  const diff = visit.visitDate - now
  if (diff < 0) return "border-l-destructive"
  if (diff < 30 * 60 * 1000) return "border-l-primary"
  return "border-l-yellow-500"
}

export function VisitsTodaySection() {
  const visits = useQuery(api.visits.getMyTodaysVisits)

  if (visits === undefined) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!visits || visits.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Visits Today
          <span className="text-muted-foreground font-normal ml-1.5">
            ({visits.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visits.map((visit) => {
            const locStyle = getVisitLocationStyle(visit.visitLocation)
            const checkinStyle = getVisitCheckinStyle(visit.checkinStatus)
            return (
              <div
                key={visit._id}
                className={cn(
                  "flex items-center gap-3 p-3 border border-l-4 bg-background",
                  getUrgencyBorder(visit)
                )}
              >
                <div className="w-16 shrink-0">
                  <p className="text-sm font-mono font-medium tabular-nums">
                    {formatTime(visit.visitDate)}
                  </p>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{visit.leadName}</p>
                  <p className="text-xs text-muted-foreground">
                    {visit.leadPhone} &middot; {visit.projectName}
                  </p>
                </div>

                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-5 border shrink-0",
                    locStyle.bg, locStyle.text, locStyle.border
                  )}
                >
                  {locStyle.label}
                </Badge>

                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-5 border shrink-0",
                    checkinStyle.bg, checkinStyle.text, checkinStyle.border
                  )}
                >
                  {checkinStyle.label}
                  {visit.checkinAt && (
                    <span className="ml-1">
                      {formatTime(visit.checkinAt)}
                    </span>
                  )}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
