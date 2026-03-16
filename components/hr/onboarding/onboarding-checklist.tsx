"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"
import { UPLOADABLE_CHECKLIST_ITEMS } from "@/convex/lib/constants"

type ChecklistItem = {
  key: string
  label: string
  completedAt: number | null
  completedBy: string | null
  storageId?: string | null
  uploadedAt?: number | null
  documentUrl?: string | null
}

type Props = {
  checklistId: Id<"onboardingChecklists">
  items: ChecklistItem[]
  status: string
  completedAt?: number
  employeeName?: string
  isHROrAdmin: boolean
}

export function OnboardingChecklist({
  checklistId,
  items,
  status,
  completedAt,
  employeeName,
  isHROrAdmin,
}: Props) {
  const toggleItem = useMutation(api.onboarding.toggleItem)
  const markComplete = useMutation(api.onboarding.markComplete)

  const completedCount = items.filter((i) => i.completedAt !== null).length
  const allDone = completedCount === items.length

  async function handleToggle(itemKey: string) {
    try {
      await toggleItem({ checklistId, itemKey })
      const item = items.find((i) => i.key === itemKey)
      const wasCompleted = item?.completedAt !== null
      toast.success(
        wasCompleted ? "Item marked as incomplete" : "Item marked as complete"
      )
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle item")
    }
  }

  async function handleMarkComplete() {
    try {
      await markComplete({ checklistId })
      toast.success("Onboarding marked as complete")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to mark complete")
    }
  }

  // Employee can only toggle these items
  const employeeToggleable = ["complete_personal_info", "submit_emergency_contact"]

  return (
    <div className="space-y-3">
      {status === "completed" && completedAt && (
        <p className="text-xs text-green-600 font-medium">
          Completed on {format(new Date(completedAt), "dd MMM yyyy")}
        </p>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const canToggle = isHROrAdmin || employeeToggleable.includes(item.key)
          const isChecked = item.completedAt !== null

          const isUploadable = (UPLOADABLE_CHECKLIST_ITEMS as readonly string[]).includes(item.key)
          const hasDocument = !!item.documentUrl

          return (
            <div
              key={item.key}
              className="flex items-center justify-between py-1 gap-2"
            >
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  disabled={!canToggle}
                  onCheckedChange={() => handleToggle(item.key)}
                />
                <span
                  className={cn(
                    "text-sm",
                    isChecked && "line-through text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isUploadable && hasDocument && (
                  <a
                    href={item.documentUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary hover:underline"
                  >
                    View Document
                  </a>
                )}
                {isUploadable && !hasDocument && !isChecked && (
                  <span className="text-[10px] text-muted-foreground">
                    No document
                  </span>
                )}
                {isChecked && item.completedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(item.completedAt), "dd MMM yyyy")}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isHROrAdmin && allDone && status !== "completed" && (
        <div className="pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button>Mark Onboarding Complete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark onboarding as complete?</AlertDialogTitle>
                <AlertDialogDescription>
                  Mark {employeeName ? `${employeeName}'s` : "this employee's"}{" "}
                  onboarding as complete? This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkComplete}>
                  Mark Complete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  )
}
