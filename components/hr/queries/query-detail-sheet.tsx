"use client"

import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { QueryResolvePopover } from "./query-resolve-popover"
import { getHrQueryStatusStyle, getHrQueryTypeLabel } from "@/lib/constants"
import { getRelativeTime, formatFullDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

export function QueryDetailSheet({
  queryId,
  open,
  onOpenChange,
}: {
  queryId: Id<"hrQueries"> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col">
        {queryId ? <QueryDetailContent queryId={queryId} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function QueryDetailContent({ queryId }: { queryId: Id<"hrQueries"> }) {
  const hrQuery = useQuery(api.hrQueries.getById, { queryId })
  const updateStatus = useMutation(api.hrQueries.updateStatus)

  if (!hrQuery) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const statusStyle = getHrQueryStatusStyle(hrQuery.status)
  const isTerminal = hrQuery.status === "resolved" || hrQuery.status === "rejected"

  async function handleMarkInProgress() {
    try {
      await updateStatus({ queryId, status: "in_progress" })
      toast.success("Query marked as In Progress")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status")
    }
  }

  async function handleResolve(note: string) {
    try {
      await updateStatus({
        queryId,
        status: "resolved",
        resolutionNote: note || undefined,
      })
      toast.success("Query resolved")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to resolve query")
    }
  }

  async function handleReject(note: string) {
    try {
      await updateStatus({
        queryId,
        status: "rejected",
        resolutionNote: note || undefined,
      })
      toast.success("Query rejected")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reject query")
    }
  }

  async function handleReopen() {
    try {
      await updateStatus({ queryId, status: "open" })
      toast.success("Query reopened")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reopen query")
    }
  }

  // Build timeline
  const timeline: { status: string; date: number; name: string; note?: string }[] = [
    { status: "submitted", date: hrQuery.createdAt, name: hrQuery.employeeName },
  ]
  if (hrQuery.status === "in_progress" || hrQuery.status === "resolved" || hrQuery.status === "rejected") {
    timeline.push({
      status: "in_progress",
      date: hrQuery.updatedAt,
      name: hrQuery.resolvedByName ?? "HR",
    })
  }
  if (hrQuery.status === "resolved" || hrQuery.status === "rejected") {
    timeline.push({
      status: hrQuery.status,
      date: hrQuery.resolvedAt ?? hrQuery.updatedAt,
      name: hrQuery.resolvedByName ?? "HR",
      note: hrQuery.resolutionNote ?? undefined,
    })
  }

  const dotColor: Record<string, string> = {
    submitted: "bg-blue-500",
    in_progress: "bg-yellow-500",
    resolved: "bg-green-500",
    rejected: "bg-red-500",
  }

  return (
    <>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <SheetTitle className="font-sans text-xl font-bold">
              {hrQuery.employeeName}
            </SheetTitle>
            <Badge variant="outline" className="text-[10px] font-mono">
              {getHrQueryTypeLabel(hrQuery.type)}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 border",
                statusStyle.bg,
                statusStyle.text,
                statusStyle.border
              )}
            >
              {statusStyle.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted {getRelativeTime(hrQuery.createdAt)}
          </p>
        </SheetHeader>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Request Content */}
          <div>
            <p className="font-semibold text-base">{hrQuery.subject}</p>
            <p className="text-sm mt-2 whitespace-pre-wrap">{hrQuery.description}</p>
          </div>

          {/* Status Timeline */}
          <div>
            <h3 className="font-sans text-sm font-semibold mb-3">Timeline</h3>
            <div className="border-l-2 border-muted pl-4 space-y-4">
              {timeline.map((entry, i) => (
                <div key={i} className="relative">
                  <div
                    className={cn(
                      "absolute -left-[21px] top-1 size-2.5",
                      dotColor[entry.status] ?? "bg-gray-400"
                    )}
                  />
                  <p className="text-sm">
                    <span className="font-medium">{entry.name}</span>{" "}
                    <span className="text-muted-foreground">
                      {entry.status === "submitted" ? "submitted this query" :
                       entry.status === "in_progress" ? "marked as in progress" :
                       entry.status === "resolved" ? "resolved" :
                       "rejected"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatFullDate(entry.date)}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      &ldquo;{entry.note}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Sticky action bar */}
      <div className="sticky bottom-0 z-10 bg-background border-t py-3 px-6 flex items-center gap-2">
        {hrQuery.status === "open" && (
          <>
            <Button variant="outline" size="sm" onClick={handleMarkInProgress}>
              Mark In Progress
            </Button>
            <QueryResolvePopover
              mode="resolve"
              onConfirm={handleResolve}
            />
            <QueryResolvePopover
              mode="reject"
              onConfirm={handleReject}
            />
          </>
        )}
        {hrQuery.status === "in_progress" && (
          <>
            <QueryResolvePopover
              mode="resolve"
              onConfirm={handleResolve}
            />
            <QueryResolvePopover
              mode="reject"
              onConfirm={handleReject}
            />
          </>
        )}
        {isTerminal && (
          <>
            <Button variant="ghost" size="sm" onClick={handleReopen}>
              Reopen
            </Button>
            <p className="text-xs text-muted-foreground ml-auto">
              The employee will see this status update in their self-service page.
            </p>
          </>
        )}
      </div>
    </>
  )
}
