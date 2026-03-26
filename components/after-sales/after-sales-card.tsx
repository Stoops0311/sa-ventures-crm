"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getRelativeTime } from "@/lib/date-utils"

type AfterSalesProcess = {
  _id: string
  status: string
  currentStep: string
  completedCount: number
  totalSteps: number
  currentStepLabel: string
  leadName: string
  leadPhone: string
  projectName: string
  updatedAt: number
}

interface AfterSalesCardProps {
  process: AfterSalesProcess
  onView: (processId: string) => void
}

export function AfterSalesCard({ process, onView }: AfterSalesCardProps) {
  const now = Date.now()
  const daysSinceUpdate = (now - process.updatedAt) / (24 * 60 * 60 * 1000)

  const borderColor =
    daysSinceUpdate >= 5
      ? "border-l-destructive"
      : daysSinceUpdate >= 3
        ? "border-l-primary"
        : "border-l-blue-500"

  const stepDisplay = process.status === "completed"
    ? "Completed"
    : `Step ${process.completedCount + 1} of ${process.totalSteps}: ${process.currentStepLabel}`

  return (
    <Card className={cn("border-l-4", borderColor)}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-sans font-medium text-sm truncate">
            {process.leadName}
          </span>
          <span className="text-xs text-muted-foreground">
            {process.projectName}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">{stepDisplay}</p>

        <div className="flex items-center gap-2">
          {/* Mini progress bar */}
          <div className="flex gap-0.5 flex-1">
            {Array.from({ length: process.totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1",
                  i < process.completedCount
                    ? "bg-green-600"
                    : i === process.completedCount && process.status !== "completed"
                      ? "bg-blue-500"
                      : "bg-gray-200"
                )}
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {getRelativeTime(process.updatedAt)}
          </span>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onView(process._id)}
          >
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
