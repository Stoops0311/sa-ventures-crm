"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getRelativeTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

export function PresenceDot({
  isOnline,
  lastSeen,
  size = "default",
}: {
  isOnline: boolean
  lastSeen?: number
  size?: "sm" | "default"
}) {
  const tooltipText = isOnline
    ? "Online"
    : lastSeen
      ? `Last seen: ${getRelativeTime(lastSeen)}`
      : "Offline"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-block shrink-0 rounded-full",
              size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
              isOnline
                ? "bg-green-500 animate-pulse [animation-duration:3s]"
                : "bg-gray-400"
            )}
          />
        </TooltipTrigger>
        <TooltipContent>{tooltipText}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
