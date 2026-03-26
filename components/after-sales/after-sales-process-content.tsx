"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/use-current-user"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AfterSalesStepper } from "./after-sales-stepper"
import { AfterSalesStatusBadge } from "./after-sales-status-badge"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ProcessContentProps {
  processId: string
}

export function AfterSalesProcessContent({ processId }: ProcessContentProps) {
  const typedId = processId as Id<"afterSalesProcesses">
  const process = useQuery(api.afterSales.getById, { processId: typedId })
  const updateStatus = useMutation(api.afterSales.updateStatus)
  const { user } = useCurrentUser()

  if (process === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (process === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xs text-muted-foreground">Process not found</p>
      </div>
    )
  }

  const canEdit =
    user?.role === "admin" ||
    (user?.role === "salesperson" &&
      process.assignedTo.toString() === user?._id.toString())

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ processId: typedId, status: newStatus })
      toast.success(`Status changed to ${newStatus.replace("_", " ")}`)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status"
      )
    }
  }

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(process.leadPhone)
    toast.success("Phone copied")
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 space-y-2">
        <div className="flex items-center gap-3">
          <h3 className="font-sans font-semibold text-sm truncate">
            {process.leadName}
          </h3>
          <span className="text-xs text-muted-foreground">
            {process.projectName}
          </span>
          <div className="ml-auto">
            {canEdit && process.status !== "completed" ? (
              <Select
                value={process.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="h-6 text-[10px] w-auto gap-1 px-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <AfterSalesStatusBadge status={process.status} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <button
            onClick={handleCopyPhone}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            {process.leadPhone}
            <HugeiconsIcon
              icon={Copy01Icon}
              strokeWidth={2}
              className="size-3"
            />
          </button>
          <span>Salesperson: {process.assignedUserName}</span>
          <span className="ml-auto font-mono">
            {process.completedCount}/{process.totalSteps} steps
          </span>
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

      {/* Stepper */}
      <div className="px-6 py-4">
        <AfterSalesStepper
          steps={process.parsedSteps}
          processId={typedId}
          canEdit={canEdit ?? false}
        />
      </div>
    </div>
  )
}
