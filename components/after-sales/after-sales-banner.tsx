"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { AfterSalesProcessDialog } from "./after-sales-process-dialog"

interface AfterSalesBannerProps {
  leadId: string
  leadStatus: string
  canEdit: boolean
}

export function AfterSalesBanner({
  leadId,
  leadStatus,
  canEdit,
}: AfterSalesBannerProps) {
  const typedLeadId = leadId as Id<"leads">
  const process = useQuery(api.afterSales.getByLeadId, {
    leadId: typedLeadId,
  })
  const createProcess = useMutation(api.afterSales.create)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Only show for Booking Done or Closed Won leads
  if (leadStatus !== "Booking Done" && leadStatus !== "Closed Won")
    return null

  // Loading state
  if (process === undefined) return null

  // No process yet — show creation prompt
  if (process === null) {
    const handleCreate = async () => {
      setCreating(true)
      try {
        await createProcess({ leadId: typedLeadId })
        toast.success("After-sales process created")
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to create process"
        )
      } finally {
        setCreating(false)
      }
    }

    return (
      <div className="mx-4 mt-2 p-3 border border-amber-200 bg-amber-50">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-amber-700">
            After-sales process not started yet
          </p>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? "Creating..." : "Start Process"}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Process exists — show progress banner
  return (
    <>
      <div className="mx-4 mt-2 p-3 border border-emerald-200 bg-emerald-50">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs text-emerald-700 font-medium">
            After Sales:
          </span>
          <span className="text-xs text-emerald-700">
            Step {process.completedCount + (process.status === "completed" ? 0 : 1)} of{" "}
            {process.totalSteps} &mdash; {process.currentStepLabel}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 text-[10px] text-emerald-700 hover:text-emerald-900 ml-auto px-2"
            onClick={() => setDialogOpen(true)}
          >
            View
          </Button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-0.5">
          {process.parsedSteps.map((step) => (
            <div
              key={step.key}
              className={cn(
                "h-1 flex-1",
                step.status === "completed" && "bg-green-600",
                step.status === "in_progress" && "bg-blue-500",
                step.status === "skipped" && "bg-gray-400",
                step.status === "pending" && "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      <AfterSalesProcessDialog
        processId={process._id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
