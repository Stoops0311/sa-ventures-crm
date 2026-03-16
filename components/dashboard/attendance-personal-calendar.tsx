"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { isWeekend, getDateString, getDayOfWeek } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  UserCheck01Icon,
  Calendar03Icon,
} from "@hugeicons/core-free-icons"
import { AttendanceDayDetail } from "@/components/shared/attendance-day-detail"

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function AttendancePersonalCalendar() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const data = useQuery(api.attendance.getMonthSummary, { year, month })
  const isLoading = data === undefined

  const todayStr = getDateString(now)

  // Day detail sheet state
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleDayClick(date: string) {
    setSelectedDate(date)
    setSheetOpen(true)
  }

  function navigateMonth(delta: number) {
    let newMonth = month + delta
    let newYear = year
    if (newMonth < 1) {
      newMonth = 12
      newYear--
    } else if (newMonth > 12) {
      newMonth = 1
      newYear++
    }
    setMonth(newMonth)
    setYear(newYear)
  }

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1

  // Build calendar grid (7 columns, starting from Sunday)
  const firstDayStr = `${year}-${String(month).padStart(2, "0")}-01`
  const firstDow = getDayOfWeek(firstDayStr) // 0=Sunday

  // Create grid cells: leading empties + day cells
  const dayCells = data?.days ?? []
  const leadingBlanks = firstDow
  const totalCells = leadingBlanks + dayCells.length
  const rows = Math.ceil(totalCells / 7)

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-sans">My Attendance</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => navigateMonth(-1)}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              </Button>
              <span className="text-xs font-medium min-w-[120px] text-center tabular-nums">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => navigateMonth(1)}
                disabled={isCurrentMonth}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Personal stats */}
          {!isLoading && data && (
            <div className="flex items-center gap-6 px-6 py-2.5 border-y bg-muted/30">
              <div className="flex items-center gap-1.5 text-[10px]">
                <HugeiconsIcon icon={Clock01Icon} className="size-3 text-muted-foreground" strokeWidth={2} />
                <span className="text-muted-foreground">Avg hours:</span>
                <span className="font-medium tabular-nums">
                  {data.avgHours.toFixed(1)}h/day
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <HugeiconsIcon icon={UserCheck01Icon} className="size-3 text-muted-foreground" strokeWidth={2} />
                <span className="text-muted-foreground">Attendance:</span>
                <span className="font-medium tabular-nums">
                  {data.attendanceRate.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <HugeiconsIcon icon={Calendar03Icon} className="size-3 text-muted-foreground" strokeWidth={2} />
                <span className="text-muted-foreground">Days present:</span>
                <span className="font-medium tabular-nums">
                  {data.daysPresent}/{data.workingDaysPast}
                </span>
              </div>
            </div>
          )}

          {/* Calendar grid */}
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Skeleton key={j} className="h-14" />
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {DAY_HEADERS.map((label, i) => (
                    <div
                      key={label}
                      className={cn(
                        "text-center text-[10px] font-medium uppercase tracking-wider py-1",
                        i === 0 || i === 6
                          ? "text-muted-foreground/50"
                          : "text-muted-foreground"
                      )}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Calendar cells */}
                {Array.from({ length: rows }).map((_, rowIdx) => (
                  <div key={rowIdx} className="grid grid-cols-7 gap-2 mb-2">
                    {Array.from({ length: 7 }).map((_, colIdx) => {
                      const cellIdx = rowIdx * 7 + colIdx
                      const dayIdx = cellIdx - leadingBlanks

                      if (dayIdx < 0 || dayIdx >= dayCells.length) {
                        return <div key={colIdx} />
                      }

                      const day = dayCells[dayIdx]
                      const weekend = isWeekend(day.date)
                      const isToday = day.date === todayStr
                      const isFuture = day.date > todayStr
                      const dayNum = dayIdx + 1

                      return (
                        <Tooltip key={colIdx}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => {
                                if (!weekend && !isFuture) {
                                  handleDayClick(day.date)
                                }
                              }}
                              disabled={weekend || isFuture}
                              className={cn(
                                "relative flex flex-col items-center justify-center h-14 border transition-colors",
                                isToday && "border-primary bg-primary/5",
                                !isToday && "border-border",
                                weekend && "bg-muted/20 border-border/50",
                                !weekend && !isFuture && "hover:bg-muted/40 cursor-pointer",
                                isFuture && "opacity-40"
                              )}
                            >
                              <span
                                className={cn(
                                  "text-[10px] tabular-nums",
                                  isToday
                                    ? "font-bold text-primary"
                                    : weekend
                                      ? "text-muted-foreground/50"
                                      : "text-muted-foreground"
                                )}
                              >
                                {dayNum}
                              </span>
                              {!isFuture && (
                                <div
                                  className={cn(
                                    "size-2 mt-1",
                                    day.status === "present" && "bg-emerald-500",
                                    day.status === "partial" && "bg-amber-400",
                                    day.status === "absent" && !weekend && "bg-red-400",
                                    (day.status === "weekend" || weekend) && "bg-muted-foreground/20"
                                  )}
                                />
                              )}
                              {!weekend && !isFuture && day.totalHours > 0 && (
                                <span className="text-[8px] text-muted-foreground tabular-nums mt-0.5">
                                  {day.totalHours.toFixed(1)}h
                                </span>
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-[10px]">
                            {weekend ? (
                              "Weekend"
                            ) : isFuture ? (
                              "Upcoming"
                            ) : day.status === "absent" ? (
                              "Absent"
                            ) : (
                              <span className="tabular-nums">
                                {day.totalHours.toFixed(1)}h
                                {" \u00B7 "}
                                {day.sessionCount} session
                                {day.sessionCount !== 1 ? "s" : ""}
                              </span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-6 py-2.5 border-t text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="size-2 bg-emerald-500" />
              <span>Full day (6+ hrs)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 bg-amber-400" />
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 bg-red-400" />
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-2 bg-muted-foreground/20" />
              <span>Weekend</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AttendanceDayDetail
        date={selectedDate}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </TooltipProvider>
  )
}
