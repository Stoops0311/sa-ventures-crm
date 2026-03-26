"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AfterSalesCard } from "./after-sales-card"
import { AfterSalesProcessDialog } from "./after-sales-process-dialog"
import Link from "next/link"

export function AfterSalesSection() {
  const processes = useQuery(api.afterSales.getMyProcesses, {
    status: "in_progress",
  })

  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(
    null
  )
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleView = (processId: string) => {
    setSelectedProcessId(processId)
    setDialogOpen(true)
  }

  // Don't render anything if no processes
  if (processes === undefined) return null
  if (processes.length === 0) return null

  // Sort: stale first (oldest updatedAt first)
  const sorted = [...processes].sort((a, b) => a.updatedAt - b.updatedAt)

  const now = Date.now()
  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000
  const staleCount = sorted.filter(
    (p) => now - p.updatedAt > fiveDaysMs
  ).length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-sans text-sm font-medium">After Sales</h2>
        <Badge variant="secondary">{processes.length}</Badge>
        {staleCount > 0 && (
          <Badge variant="destructive">{staleCount} stale</Badge>
        )}
        <Link href="/dashboard/after-sales" className="ml-auto">
          <Button variant="ghost" size="xs">
            View All
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        {sorted.slice(0, 5).map((process) => (
          <AfterSalesCard
            key={process._id}
            process={process}
            onView={handleView}
          />
        ))}
        {sorted.length > 5 && (
          <p className="text-xs text-muted-foreground text-center">
            +{sorted.length - 5} more &middot;{" "}
            <Link
              href="/dashboard/after-sales"
              className="text-primary hover:underline"
            >
              View all
            </Link>
          </p>
        )}
      </div>

      <AfterSalesProcessDialog
        processId={selectedProcessId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
