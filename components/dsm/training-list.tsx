"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TRAINING_DAYS, TOTAL_TRAINING_DAYS } from "@/lib/training"
import { cn } from "@/lib/utils"

export function TrainingList() {
  const progress = useQuery(api.trainingProgress.getMyProgress)
  const completedDays = new Set(progress?.map((p) => p.day))
  const completedCount = completedDays.size
  const progressPercent =
    TOTAL_TRAINING_DAYS > 0
      ? Math.round((completedCount / TOTAL_TRAINING_DAYS) * 100)
      : 0

  if (progress === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Progress summary */}
      <Card>
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {completedCount} of {TOTAL_TRAINING_DAYS} days completed
              </span>
              <span className="font-mono text-xs font-medium">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 w-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day cards */}
      <div className="space-y-3">
        {TRAINING_DAYS.map((day) => {
          const isCompleted = completedDays.has(day.day)
          const isAvailable = day.available

          return (
            <Card
              key={day.day}
              className={cn(!isAvailable && "opacity-50")}
            >
              <CardContent className="flex items-center gap-4 py-4">
                {/* Day number */}
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center border text-sm font-semibold",
                    isCompleted
                      ? "border-green-300 bg-green-50 text-green-700"
                      : isAvailable
                        ? "border-primary/30 bg-primary/5 text-primary"
                        : "border-muted bg-muted text-muted-foreground"
                  )}
                >
                  {day.day}
                </div>

                {/* Title and description */}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium">{day.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {day.description}
                  </p>
                </div>

                {/* Status / action */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <Badge
                      variant="outline"
                      className="border-green-200 bg-green-50 text-green-700"
                    >
                      Completed
                    </Badge>
                  ) : isAvailable ? (
                    <Button size="sm" asChild>
                      <Link href={`/dsm/training/${day.day}`}>View</Link>
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-muted-foreground">
                      Coming Soon
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
