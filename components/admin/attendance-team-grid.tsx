"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getRoleStyle, getBreakTypeLabel } from "@/lib/constants"
import { isWeekend, getDateString, getDayOfWeek } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Clock01Icon,
  UserCheck01Icon,
  Calendar03Icon,
  Coffee01Icon,
} from "@hugeicons/core-free-icons"
import { AttendanceDayDetail } from "@/components/shared/attendance-day-detail"

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function AttendanceTeamGrid() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-indexed

  const data = useQuery(api.attendance.getTeamMonthGrid, { year, month })
  const isLoading = data === undefined

  const todayStr = getDateString(now)

  // Break time data
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`
  const userIds = data?.teamData.map((m) => m.userId) ?? []
  const breakData = useQuery(
    api.breakTime.getBreaksForDateRange,
    userIds.length > 0
      ? { userIds, startDate: `${monthPrefix}-01`, endDate: `${monthPrefix}-31` }
      : "skip"
  )
  const breakSettings = useQuery(api.breakTime.getSettings)
  const teamBreakStatus = useQuery(api.breakTime.getTeamBreakStatus)
  const warningThreshold = breakSettings?.warningThresholdMinutes ?? 90

  // Helper: get break stats for a user on a specific day
  function getDayBreakStats(userId: string, date: string) {
    if (!breakData) return { count: 0, totalMs: 0 }
    const dayBreaks = breakData.filter((b) => b.userId === userId && b.date === date)
    const totalMs = dayBreaks.reduce((sum, b) => {
      const end = b.endTime ?? Date.now()
      return sum + (end - b.startTime)
    }, 0)
    return { count: dayBreaks.length, totalMs }
  }

  // Helper: get current break info for a user
  function getUserBreak(userId: string) {
    return teamBreakStatus?.find((b) => b.userId === userId) ?? null
  }

  // Day detail sheet state
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | undefined>()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleCellClick(userId: Id<"users">, date: string) {
    setSelectedUserId(userId)
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

  // Get day numbers for the header
  const daysInMonth = data?.daysInMonth ?? 31
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  return (
    <TooltipProvider delayDuration={200}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-sans">Team Attendance</CardTitle>
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
          {/* Summary stats */}
          {!isLoading && data && (
            <div className="flex items-center gap-6 px-6 py-2.5 border-y bg-muted/30">
              <div className="flex items-center gap-1.5 text-[10px]">
                <HugeiconsIcon icon={Clock01Icon} className="size-3 text-muted-foreground" strokeWidth={2} />
                <span className="text-muted-foreground">Team avg:</span>
                <span className="font-medium tabular-nums">
                  {data.teamAvgHours.toFixed(1)}h/day
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <HugeiconsIcon icon={UserCheck01Icon} className="size-3 text-muted-foreground" strokeWidth={2} />
                <span className="text-muted-foreground">Attendance:</span>
                <span className="font-medium tabular-nums">
                  {data.teamAttendanceRate.toFixed(0)}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <HugeiconsIcon icon={Calendar03Icon} className="size-3 text-muted-foreground" strokeWidth={2} />
                <span className="text-muted-foreground">Working days:</span>
                <span className="font-medium tabular-nums">
                  {data.workingDaysInMonth}
                </span>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                {/* Day of week header */}
                <tr className="bg-muted/20">
                  <th className="text-left p-2.5 pl-6 sticky left-0 bg-muted/20 z-10 min-w-[160px]">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Team Member
                    </span>
                  </th>
                  {dayNumbers.map((dayNum) => {
                    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
                    const dow = getDayOfWeek(dateStr)
                    const weekend = isWeekend(dateStr)
                    const isToday = dateStr === todayStr
                    return (
                      <th
                        key={dayNum}
                        className={cn(
                          "p-0 text-center min-w-[28px] w-[28px]",
                          weekend && "bg-muted/30"
                        )}
                      >
                        <div className="flex flex-col items-center py-1.5">
                          <span
                            className={cn(
                              "text-[9px] leading-none",
                              weekend
                                ? "text-muted-foreground/50"
                                : "text-muted-foreground"
                            )}
                          >
                            {DAY_LABELS[dow]}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] leading-none mt-0.5 tabular-nums",
                              isToday
                                ? "font-bold text-primary"
                                : weekend
                                  ? "text-muted-foreground/50"
                                  : "text-muted-foreground"
                            )}
                          >
                            {dayNum}
                          </span>
                        </div>
                      </th>
                    )
                  })}
                  <th className="p-2 text-right pr-6 min-w-[48px] border-l">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Avg
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2.5 pl-6 sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-2">
                          <Skeleton className="size-6" />
                          <div className="space-y-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-2.5 w-12" />
                          </div>
                        </div>
                      </td>
                      {Array.from({ length: daysInMonth }).map((_, j) => (
                        <td key={j} className="p-0 text-center">
                          <Skeleton className="size-2.5 mx-auto" />
                        </td>
                      ))}
                      <td className="p-2 text-right pr-6 border-l">
                        <Skeleton className="h-3 w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : data?.teamData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={daysInMonth + 2}
                      className="text-center py-12 text-xs text-muted-foreground"
                    >
                      No team members found.
                    </td>
                  </tr>
                ) : (
                  data?.teamData.map((member) => {
                    const roleStyle = getRoleStyle(member.role)
                    return (
                      <tr key={member.userId} className="border-t group">
                        {/* User info */}
                        <td className="p-2.5 pl-6 sticky left-0 bg-background z-10 group-hover:bg-muted/20 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="flex size-6 shrink-0 items-center justify-center bg-muted text-[10px] font-medium">
                              {member.imageUrl ? (
                                <img
                                  src={member.imageUrl}
                                  alt={member.name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <span>
                                  {member.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1">
                                <div className="text-[11px] font-medium leading-tight truncate max-w-[100px]">
                                  {member.name}
                                </div>
                                {(() => {
                                  const brk = getUserBreak(member.userId)
                                  if (!brk) return null
                                  const typeLabel = brk.breakType ? getBreakTypeLabel(brk.breakType) : "On Break"
                                  return (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-0.5">
                                          <HugeiconsIcon icon={Coffee01Icon} className="size-3 text-amber-500" strokeWidth={2} />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" className="text-[10px]">
                                        {typeLabel}
                                        {brk.remarks && `: ${brk.remarks}`}
                                      </TooltipContent>
                                    </Tooltip>
                                  )
                                })()}
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[8px] px-1 py-0 h-3 mt-0.5",
                                  roleStyle.bg,
                                  roleStyle.text,
                                  roleStyle.border
                                )}
                              >
                                {roleStyle.label}
                              </Badge>
                            </div>
                          </div>
                        </td>

                        {/* Day cells */}
                        {member.days.map((day) => {
                          const weekend = isWeekend(day.date)
                          const isToday = day.date === todayStr
                          const isFuture = day.date > todayStr

                          return (
                            <td
                              key={day.date}
                              className={cn(
                                "p-0 text-center",
                                weekend && "bg-muted/15",
                                isToday && "bg-primary/5",
                                !weekend && !isFuture && "cursor-pointer group-hover:bg-muted/20"
                              )}
                              onClick={() => {
                                if (!weekend && !isFuture) {
                                  handleCellClick(member.userId, day.date)
                                }
                              }}
                            >
                              <div className="flex items-center justify-center py-2">
                                {isFuture && !weekend ? (
                                  <div className="size-2.5" />
                                ) : (
                                  (() => {
                                    const breakStats = getDayBreakStats(member.userId, day.date)
                                    const breakMinutes = breakStats.totalMs / (1000 * 60)
                                    const isExcessiveBreak = breakStats.count > 0 && breakMinutes > warningThreshold

                                    return (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="relative">
                                            <div
                                              className={cn(
                                                "size-2.5 transition-transform hover:scale-150",
                                                day.status === "present" && "bg-emerald-500",
                                                day.status === "partial" && "bg-amber-400",
                                                day.status === "absent" && !weekend && "bg-red-400",
                                                day.status === "weekend" && "bg-muted-foreground/20",
                                                weekend && "bg-muted-foreground/20",
                                                isToday && "ring-2 ring-primary ring-offset-1"
                                              )}
                                            />
                                            {isExcessiveBreak && (
                                              <div className="absolute -top-1 -right-1 size-1.5 bg-amber-500" title="Excessive break time" />
                                            )}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                          side="top"
                                          className="text-[10px]"
                                        >
                                          {weekend ? (
                                            "Weekend"
                                          ) : day.status === "absent" ? (
                                            "Absent"
                                          ) : (
                                            <div className="flex flex-col gap-0.5">
                                              <span className="tabular-nums">
                                                {day.totalHours.toFixed(1)}h
                                                {" \u00B7 "}
                                                {day.sessionCount} session
                                                {day.sessionCount !== 1 ? "s" : ""}
                                              </span>
                                              {breakStats.count > 0 && (
                                                <span className="tabular-nums text-amber-500">
                                                  {breakStats.count} break{breakStats.count !== 1 ? "s" : ""}
                                                  {" \u00B7 "}
                                                  {Math.round(breakMinutes)}m
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </TooltipContent>
                                      </Tooltip>
                                    )
                                  })()
                                )}
                              </div>
                            </td>
                          )
                        })}

                        {/* Avg column */}
                        <td className="p-2 text-right pr-6 border-l">
                          <span className="text-[11px] font-medium tabular-nums">
                            {member.avgHours > 0
                              ? `${member.avgHours.toFixed(1)}h`
                              : "\u2014"}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
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
            <div className="flex items-center gap-1.5">
              <div className="size-2 bg-emerald-500 ring-2 ring-primary ring-offset-1" />
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AttendanceDayDetail
        userId={selectedUserId}
        date={selectedDate}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </TooltipProvider>
  )
}
