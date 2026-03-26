"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getVisitLocationStyle, getVisitCheckinStyle } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, Add01Icon } from "@hugeicons/core-free-icons"
import { LogWalkInDialog } from "./log-walkin-dialog"
import { toast } from "sonner"
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
  if (diff < 0) return "border-l-destructive" // past, still expected
  if (diff < 30 * 60 * 1000) return "border-l-primary" // within 30 min
  return "border-l-yellow-500" // later today
}

export function TodaysVisitsTable() {
  const visits = useQuery(api.visits.getTodaysVisits)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [noShowId, setNoShowId] = useState<string | null>(null)

  const markArrived = useMutation(api.visits.markArrived)
  const markNoShow = useMutation(api.visits.markNoShow)

  if (visits === undefined) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!visits) return null

  const handleMarkArrived = async (visitId: string) => {
    setMarkingId(visitId)
    try {
      await markArrived({ visitId: visitId as any })
      toast.success("Visitor checked in")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to check in")
    } finally {
      setMarkingId(null)
    }
  }

  const handleMarkNoShow = async (visitId: string) => {
    setNoShowId(visitId)
    try {
      await markNoShow({ visitId: visitId as any })
      toast.success("Marked as no-show")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark no-show")
    } finally {
      setNoShowId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">
          Today&apos;s Visits
          {visits.length > 0 && (
            <span className="text-muted-foreground font-normal ml-1.5">
              ({visits.length})
            </span>
          )}
        </CardTitle>
        <LogWalkInDialog>
          <Button size="sm" variant="outline" className="h-7 text-xs">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-3.5" />
            Log Walk-in
          </Button>
        </LogWalkInDialog>
      </CardHeader>
      <CardContent>
        {visits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No visits scheduled for today
          </p>
        ) : (
          <div className="space-y-2">
            {visits.map((visit) => (
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
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{visit.leadName}</p>
                    {visit.visitType === "walk_in" && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] px-1 py-0 h-4 border bg-amber-50 text-amber-700 border-amber-200 shrink-0"
                      >
                        Walk-in
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {visit.leadPhone && <>{visit.leadPhone} &middot; </>}{visit.projectName}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground shrink-0">
                  {visit.salespersonName}
                </div>

                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-5 border shrink-0",
                    getVisitLocationStyle(visit.visitLocation).bg,
                    getVisitLocationStyle(visit.visitLocation).text,
                    getVisitLocationStyle(visit.visitLocation).border
                  )}
                >
                  {getVisitLocationStyle(visit.visitLocation).label}
                </Badge>

                {visit.checkinStatus === "expected" ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleMarkArrived(visit._id)}
                      disabled={markingId === visit._id}
                      className="h-7 text-xs"
                    >
                      {markingId === visit._id ? (
                        <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin size-3" />
                      ) : (
                        "Arrived"
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkNoShow(visit._id)}
                      disabled={noShowId === visit._id}
                      className="h-7 text-xs text-muted-foreground"
                    >
                      No Show
                    </Button>
                  </div>
                ) : (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-5 border shrink-0",
                      getVisitCheckinStyle(visit.checkinStatus).bg,
                      getVisitCheckinStyle(visit.checkinStatus).text,
                      getVisitCheckinStyle(visit.checkinStatus).border
                    )}
                  >
                    {getVisitCheckinStyle(visit.checkinStatus).label}
                    {visit.checkinAt && (
                      <span className="ml-1">
                        {formatTime(visit.checkinAt)}
                      </span>
                    )}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
