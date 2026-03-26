"use client"

import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Coffee01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { useBreakTime } from "@/hooks/use-break-time"
import { getBreakTypeLabel } from "@/lib/constants"

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function BreakOverlay() {
  const { isOnBreak, activeBreak, endBreak } = useBreakTime()
  const [elapsed, setElapsed] = useState(0)
  const [isEnding, setIsEnding] = useState(false)

  useEffect(() => {
    if (!activeBreak) {
      setElapsed(0)
      return
    }

    // Compute initial elapsed
    setElapsed(Date.now() - activeBreak.startTime)

    const interval = setInterval(() => {
      setElapsed(Date.now() - activeBreak.startTime)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeBreak])

  if (!isOnBreak || !activeBreak) return null

  const handleEndBreak = async () => {
    setIsEnding(true)
    try {
      await endBreak()
    } finally {
      setIsEnding(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-xl bg-background/60">
      <div className="flex flex-col items-center gap-6 p-10 border bg-background shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center justify-center size-16 bg-primary/10 text-primary">
          <HugeiconsIcon icon={Coffee01Icon} strokeWidth={1.5} className="size-8" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <h2 className="font-sans text-xl font-semibold">On Break</h2>
          {activeBreak.breakType && (
            <p className="text-sm font-medium text-primary">
              {getBreakTypeLabel(activeBreak.breakType)}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Break started at {formatTime(activeBreak.startTime)}
          </p>
          {activeBreak.remarks && (
            <p className="text-xs text-muted-foreground italic">
              {activeBreak.remarks}
            </p>
          )}
        </div>

        <div className="font-mono text-4xl font-bold tracking-wider tabular-nums">
          {formatElapsed(elapsed)}
        </div>

        <Button
          onClick={handleEndBreak}
          disabled={isEnding}
          size="lg"
          className="w-full"
        >
          {isEnding ? "Ending..." : "End Break"}
        </Button>
      </div>
    </div>
  )
}
