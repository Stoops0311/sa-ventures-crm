"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { usePaginatedQuery, useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/use-current-user"
import { StatusBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getRelativeTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { PencilEdit01Icon, Tick01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

type TimelineEntry = {
  _id: string
  type: "remark" | "status_change" | "system"
  timestamp: number
  content?: string
  createdByName?: string
  createdById?: string
  performedByName?: string
  action?: string
  details?: Record<string, unknown>
}

export function RemarkTimeline({ leadId }: { leadId: Id<"leads"> }) {
  const { user } = useCurrentUser()
  const {
    results: remarks,
    status: remarkStatus,
    loadMore,
  } = usePaginatedQuery(
    api.remarks.listByLead,
    { leadId },
    { initialNumItems: 20 }
  )

  const activityLogs = useQuery(api.activityLogs.listByEntity, {
    entityId: leadId,
  })

  const timeline = useMemo(() => {
    const entries: TimelineEntry[] = []

    // Add remarks
    if (remarks) {
      for (const remark of remarks) {
        entries.push({
          _id: remark._id,
          type: "remark",
          timestamp: remark.createdAt,
          content: remark.content,
          createdByName: remark.createdByName,
          createdById: (remark as Record<string, unknown>).createdBy as string,
        })
      }
    }

    // Add activity logs
    if (activityLogs) {
      for (const log of activityLogs) {
        // Skip remark_added logs since we already show those as remarks
        if (log.action === "remark_added") continue

        let parsedDetails: Record<string, unknown> | undefined
        if (log.details) {
          try {
            parsedDetails =
              typeof log.details === "string"
                ? JSON.parse(log.details)
                : (log.details as Record<string, unknown>)
          } catch {
            parsedDetails = undefined
          }
        }

        entries.push({
          _id: log._id,
          type: log.action === "status_changed" ? "status_change" : "system",
          timestamp: log.timestamp,
          performedByName: log.performedByName,
          action: log.action,
          details: parsedDetails,
        })
      }
    }

    // Sort by timestamp, newest first
    entries.sort((a, b) => b.timestamp - a.timestamp)

    return entries
  }, [remarks, activityLogs])

  if (!remarks && !activityLogs) {
    return (
      <div className="space-y-3 py-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="size-2.5 rounded-full bg-muted mt-1.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 w-32 bg-muted" />
              <div className="h-4 w-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (timeline.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">
        No activity yet
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {timeline.map((entry) => (
        <div key={entry._id} className="relative flex gap-3 pb-4">
          {/* Vertical line */}
          <div className="absolute left-[5px] top-3 bottom-0 w-px bg-border" />

          {/* Dot */}
          <div className="relative z-10 mt-1.5 shrink-0">
            {entry.type === "remark" && (
              <div className="size-2.5 rounded-full bg-foreground" />
            )}
            {entry.type === "status_change" && (
              <div
                className={cn(
                  "size-2.5 rounded-full",
                  getStatusDotColor(
                    entry.details?.newStatus as string | undefined
                  )
                )}
              />
            )}
            {entry.type === "system" && (
              <div className="size-2.5 rounded-full border-2 border-muted-foreground bg-background" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {entry.type === "remark" && (
              <RemarkEntry
                entry={entry}
                canEdit={
                  user?.role === "admin" ||
                  entry.createdById === user?._id?.toString()
                }
              />
            )}

            {entry.type === "status_change" && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-medium">
                  {entry.performedByName}
                </span>
                <span className="text-muted-foreground">
                  changed status from
                </span>
                <StatusBadge
                  status={(entry.details?.oldStatus as string) ?? ""}
                  size="sm"
                />
                <span className="text-muted-foreground">to</span>
                <StatusBadge
                  status={(entry.details?.newStatus as string) ?? ""}
                  size="sm"
                />
                <span className="text-[10px] text-muted-foreground">
                  {getRelativeTime(entry.timestamp)}
                </span>
              </div>
            )}

            {entry.type === "system" && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">
                  {entry.performedByName}
                </span>{" "}
                {formatSystemAction(entry.action, entry.details)}
                <span className="ml-1.5 text-[10px]">
                  {getRelativeTime(entry.timestamp)}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}

      {remarkStatus === "CanLoadMore" && (
        <div className="pt-2 pl-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadMore(20)}
            className="text-xs text-muted-foreground"
          >
            Load more...
          </Button>
        </div>
      )}
    </div>
  )
}

function RemarkEntry({
  entry,
  canEdit,
}: {
  entry: TimelineEntry
  canEdit: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(entry.content ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const updateRemark = useMutation(api.remarks.update)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      )
    }
  }, [isEditing])

  const handleSave = async () => {
    const trimmed = editContent.trim()
    if (!trimmed || isSaving) return

    setIsSaving(true)
    try {
      await updateRemark({
        remarkId: entry._id as Id<"remarks">,
        content: trimmed,
      })
      setIsEditing(false)
      toast("Remark updated")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update remark"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditContent(entry.content ?? "")
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      handleSave()
    }
    if (e.key === "Escape") {
      handleCancel()
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {entry.createdByName}
          </span>
          <span>{getRelativeTime(entry.timestamp)}</span>
        </div>
        <Textarea
          ref={textareaRef}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="min-h-[3rem] max-h-[8rem] resize-none text-xs"
          disabled={isSaving}
        />
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="default"
            onClick={handleSave}
            disabled={!editContent.trim() || isSaving}
            className="h-7 text-xs"
          >
            <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} className="size-3" />
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-7 text-xs"
          >
            Cancel
          </Button>
          <span className="text-[10px] text-muted-foreground ml-auto">
            Ctrl+Enter to save, Esc to cancel
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="group">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span className="font-medium text-foreground">
          {entry.createdByName}
        </span>
        <span>{getRelativeTime(entry.timestamp)}</span>
        {canEdit && (
          <button
            onClick={() => {
              setEditContent(entry.content ?? "")
              setIsEditing(true)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            title="Edit remark"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} strokeWidth={2} className="size-3" />
          </button>
        )}
      </div>
      <p className="mt-0.5 text-xs text-foreground whitespace-pre-wrap break-words">
        {entry.content}
      </p>
    </div>
  )
}

function getStatusDotColor(status: string | undefined): string {
  switch (status) {
    case "New":
      return "bg-blue-500"
    case "No Response":
      return "bg-yellow-500"
    case "Not Interested":
      return "bg-gray-400"
    case "Follow Up":
      return "bg-orange-500"
    case "Other Requirement":
      return "bg-amber-500"
    case "Visit Scheduled":
      return "bg-purple-500"
    case "Visit Done":
      return "bg-indigo-500"
    case "Booking Done":
      return "bg-emerald-500"
    case "Closed Won":
      return "bg-green-500"
    case "Closed Lost":
      return "bg-red-500"
    default:
      return "bg-gray-400"
  }
}

function formatSystemAction(
  action: string | undefined,
  details: Record<string, unknown> | undefined
): string {
  switch (action) {
    case "lead_created":
      return "created this lead"
    case "lead_reassigned":
      return "reassigned this lead"
    case "followup_set":
      return "scheduled a follow-up"
    default:
      return action?.replace(/_/g, " ") ?? "performed an action"
  }
}
