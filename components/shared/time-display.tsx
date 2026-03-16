"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  getRelativeTime,
  formatFullDate,
  formatFollowUpDate,
  isOverdue,
  isToday,
} from "@/lib/date-utils"
import { cn } from "@/lib/utils"

export function TimeDisplay({
  timestamp,
  mode = "relative",
}: {
  timestamp?: number
  mode?: "relative" | "absolute" | "follow-up"
}) {
  if (mode === "follow-up") {
    if (!timestamp) {
      return <span className="text-muted-foreground">--</span>
    }

    const overdue = isOverdue(timestamp)
    const today = isToday(timestamp)

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                overdue && "text-destructive font-medium",
                today && "text-primary font-medium",
                !overdue && !today && "text-muted-foreground"
              )}
            >
              {formatFollowUpDate(timestamp)}
            </span>
          </TooltipTrigger>
          <TooltipContent>{formatFullDate(timestamp)}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (!timestamp) {
    return <span className="text-muted-foreground">--</span>
  }

  if (mode === "absolute") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>{formatFullDate(timestamp)}</span>
          </TooltipTrigger>
          <TooltipContent>{getRelativeTime(timestamp)}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // mode === "relative" (default)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{getRelativeTime(timestamp)}</span>
        </TooltipTrigger>
        <TooltipContent>{formatFullDate(timestamp)}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
