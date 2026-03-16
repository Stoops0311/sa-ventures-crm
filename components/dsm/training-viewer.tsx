"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TimeDisplay } from "@/components/shared/time-display"
import { TRAINING_DAYS } from "@/lib/training"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export function TrainingViewer({ day }: { day: number }) {
  const [marking, setMarking] = useState(false)

  const trainingDay = TRAINING_DAYS.find((d) => d.day === day)
  const progress = useQuery(api.trainingProgress.getMyProgress)
  const markComplete = useMutation(api.trainingProgress.markDayComplete)

  // Invalid or unavailable day
  if (!trainingDay || !trainingDay.available) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">This training day is not available.</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dsm/training">Back to Training</Link>
        </Button>
      </div>
    )
  }

  // Loading state
  if (progress === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[70vh] w-full" />
      </div>
    )
  }

  const completionRecord = progress.find((p) => p.day === day)
  const isCompleted = !!completionRecord

  async function handleMarkComplete() {
    setMarking(true)
    try {
      await markComplete({ day })
      toast.success(`Day ${day} marked as complete!`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to mark as complete"
      )
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-xs" asChild>
          <Link href="/dsm/training">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Link>
        </Button>
        <div>
          <p className="text-xs text-muted-foreground">Day {day}</p>
          <h1 className="font-sans text-lg font-semibold">{trainingDay.title}</h1>
        </div>
      </div>

      {/* PDF viewer */}
      <div className="border bg-muted/30">
        <object
          data={`/training/day-${day}.pdf`}
          type="application/pdf"
          className="h-[70vh] w-full"
        >
          <iframe
            src={`/training/day-${day}.pdf`}
            className="h-[70vh] w-full"
            title={`Day ${day} - ${trainingDay.title}`}
          />
        </object>
      </div>

      {/* Completion section */}
      <div className="flex items-center justify-between border p-4">
        {isCompleted ? (
          <div className="flex items-center gap-2 text-green-700">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} size={20} />
            <span className="text-sm font-medium">
              Completed <TimeDisplay timestamp={completionRecord.completedAt} />
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Finished reviewing this module?
            </p>
            <Button onClick={handleMarkComplete} disabled={marking} size="sm">
              {marking ? "Marking..." : "Mark as Complete"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
