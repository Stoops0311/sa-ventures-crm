"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/shared/status-badge"
import { TimeDisplay } from "@/components/shared/time-display"
import { QuickUpdatePopover } from "./quick-update-popover"
import { isOverdue, isToday } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import type { Id } from "@/convex/_generated/dataModel"

type Lead = {
  _id: Id<"leads">
  name: string
  mobileNumber: string
  status: string
  projectId: Id<"projects">
  followUpDate?: number
  notes?: string
  updatedAt: number
}

export function FollowUpCard({
  lead,
  projectName,
  onViewDetail,
}: {
  lead: Lead
  projectName?: string
  onViewDetail: (id: string) => void
}) {
  const overdue = isOverdue(lead.followUpDate)
  const today = isToday(lead.followUpDate)

  const borderColor = overdue
    ? "border-l-destructive"
    : today
      ? "border-l-primary"
      : "border-l-yellow-500"

  return (
    <Card className={cn("border-l-4", borderColor)}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <StatusBadge status={lead.status} size="sm" />
          <span className="font-sans font-medium text-sm truncate">
            {lead.name}
          </span>
          <span className="text-xs text-muted-foreground ml-auto shrink-0">
            {lead.mobileNumber}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {projectName && (
            <span className="truncate">{projectName}</span>
          )}
          {lead.notes && (
            <>
              {projectName && <span>·</span>}
              <span className="truncate">{lead.notes}</span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <TimeDisplay timestamp={lead.followUpDate} mode="follow-up" />
          <div className="flex gap-1.5">
            <QuickUpdatePopover
              leadId={lead._id}
              currentStatus={lead.status}
            >
              <Button variant="outline" size="xs">
                Mark Called
              </Button>
            </QuickUpdatePopover>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onViewDetail(lead._id)}
            >
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
