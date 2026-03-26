"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { getRoleStyle } from "@/lib/constants"
import { formatDuration, formatTimeOfDay, formatDateLabel } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  Coffee01Icon,
  RepeatIcon,
  UserMultipleIcon,
  TaskDone01Icon,
  Comment01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"

interface AttendanceDayDetailProps {
  userId?: Id<"users">
  date: string | null // "YYYY-MM-DD"
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttendanceDayDetail({
  userId,
  date,
  open,
  onOpenChange,
}: AttendanceDayDetailProps) {
  const detail = useQuery(
    api.attendance.getDayDetail,
    date ? { userId, date } : "skip"
  )

  // Fetch break sessions for this day
  const targetUserId = detail?.user.id ?? userId
  const breaks = useQuery(
    api.breakTime.getBreaksForDay,
    targetUserId && date ? { userId: targetUserId, date } : "skip"
  )
  const breakSettings = useQuery(api.breakTime.getSettings)
  const warningThreshold = breakSettings?.warningThresholdMinutes ?? 90

  // Calculate total intentional break time
  const intentionalBreakMs = (breaks ?? []).reduce((sum, b) => {
    const end = b.endTime ?? Date.now()
    return sum + (end - b.startTime)
  }, 0)
  const intentionalBreakMinutes = intentionalBreakMs / (1000 * 60)
  const isExcessiveBreak = (breaks ?? []).length > 0 && intentionalBreakMinutes > warningThreshold

  const isLoading = date !== null && detail === undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full overflow-y-auto">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="font-sans">
            {detail?.user.name ?? "Loading..."}
          </SheetTitle>
          <SheetDescription>
            {date ? formatDateLabel(date) : ""}
            {detail?.user.role && (
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 text-[10px] px-1.5 py-0",
                  getRoleStyle(detail.user.role).bg,
                  getRoleStyle(detail.user.role).text,
                  getRoleStyle(detail.user.role).border
                )}
              >
                {getRoleStyle(detail.user.role).label}
              </Badge>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 space-y-5">
          {isLoading ? (
            <DayDetailSkeleton />
          ) : !detail || detail.sessionCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-xs text-muted-foreground">
                No sessions recorded for this day.
              </p>
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={Clock01Icon}
                  label="Work Time"
                  value={formatDuration(detail.totalMs)}
                  accent
                />
                <StatCard
                  icon={Coffee01Icon}
                  label="Break Time"
                  value={intentionalBreakMs > 0 ? formatDuration(intentionalBreakMs) : formatDuration(detail.breakMs)}
                  warning={isExcessiveBreak}
                />
                <StatCard
                  icon={RepeatIcon}
                  label="Sessions"
                  value={String(detail.sessionCount)}
                />
              </div>

              <Separator />

              {/* Session Timeline */}
              <div>
                <h3 className="font-sans text-xs font-medium mb-3">
                  Session Timeline
                </h3>
                <div className="space-y-2">
                  {detail.sessions.map((session, i) => {
                    // Compute bar width relative to the longest session
                    const maxDuration = Math.max(
                      ...detail.sessions.map((s) => s.durationMs)
                    )
                    const widthPct =
                      maxDuration > 0
                        ? Math.max(
                            8,
                            (session.durationMs / maxDuration) * 100
                          )
                        : 100

                    return (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-[72px] shrink-0 text-right">
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {formatTimeOfDay(session.startTime)}
                          </span>
                        </div>
                        <div className="flex-1 relative h-7">
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 flex items-center px-2",
                              session.isActive
                                ? "bg-primary/15 border border-primary/30"
                                : "bg-muted border border-border"
                            )}
                            style={{ width: `${widthPct}%` }}
                          >
                            <span className="text-[10px] font-medium tabular-nums truncate">
                              {formatDuration(session.durationMs)}
                            </span>
                            {session.isActive && (
                              <span className="ml-1.5 inline-flex size-1.5 bg-primary animate-pulse" />
                            )}
                          </div>
                        </div>
                        <div className="w-[72px] shrink-0">
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {session.isActive
                              ? "Active"
                              : formatTimeOfDay(session.endTime)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Breaks Section */}
              {breaks && breaks.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="font-sans text-xs font-medium">
                        Breaks
                      </h3>
                      {isExcessiveBreak && (
                        <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200">
                          Exceeds {warningThreshold}m threshold
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {breaks.map((b, i) => {
                        const end = b.endTime ?? Date.now()
                        const durationMs = end - b.startTime
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-2 bg-amber-50/50 border border-amber-100"
                          >
                            <HugeiconsIcon icon={Coffee01Icon} className="size-3.5 text-amber-500 shrink-0" strokeWidth={2} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 text-[10px]">
                                <span className="tabular-nums text-muted-foreground">
                                  {formatTimeOfDay(b.startTime)}
                                </span>
                                <span className="text-muted-foreground/50">&rarr;</span>
                                <span className="tabular-nums text-muted-foreground">
                                  {b.endTime ? formatTimeOfDay(b.endTime) : "Active"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-medium tabular-nums">
                                {formatDuration(durationMs)}
                              </span>
                              {b.wasAutoEnded && (
                                <span className="text-[8px] text-muted-foreground">(auto-ended)</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Activity Summary */}
              <div>
                <h3 className="font-sans text-xs font-medium mb-3">
                  Activity Summary
                </h3>
                {detail.activities.total === 0 ? (
                  <p className="text-[10px] text-muted-foreground">
                    No activity logged.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <ActivityItem
                      icon={UserMultipleIcon}
                      label="Leads Created"
                      count={detail.activities.leadsCreated}
                    />
                    <ActivityItem
                      icon={TaskDone01Icon}
                      label="Status Changes"
                      count={detail.activities.statusChanges}
                    />
                    <ActivityItem
                      icon={Comment01Icon}
                      label="Remarks Added"
                      count={detail.activities.remarksAdded}
                    />
                    <ActivityItem
                      icon={Calendar03Icon}
                      label="Follow-ups Set"
                      count={detail.activities.followUpsSet}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function StatCard({
  icon,
  label,
  value,
  accent,
  warning,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"]
  label: string
  value: string
  accent?: boolean
  warning?: boolean
}) {
  return (
    <Card className={cn(
      accent && "border-primary/20 bg-primary/5",
      warning && "border-amber-200 bg-amber-50/50"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <HugeiconsIcon
            icon={icon}
            className={cn(
              "size-3.5",
              accent ? "text-primary" : warning ? "text-amber-500" : "text-muted-foreground"
            )}
            strokeWidth={2}
          />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p
          className={cn(
            "text-sm font-sans font-semibold tabular-nums",
            accent && "text-primary",
            warning && "text-amber-600"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

function ActivityItem({
  icon,
  label,
  count,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"]
  label: string
  count: number
}) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50">
      <HugeiconsIcon
        icon={icon}
        className="size-3.5 text-muted-foreground shrink-0"
        strokeWidth={2}
      />
      <span className="text-[10px] text-muted-foreground truncate">
        {label}
      </span>
      <span className="text-xs font-medium ml-auto tabular-nums">{count}</span>
    </div>
  )
}

function DayDetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      <Separator />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-7" />
        ))}
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    </div>
  )
}
