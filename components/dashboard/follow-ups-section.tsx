"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { FollowUpCardSkeleton } from "@/components/shared/loading-skeleton"
import { FollowUpCard } from "./follow-up-card"
import { isOverdue } from "@/lib/date-utils"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import type { Id } from "@/convex/_generated/dataModel"

export function FollowUpsSection({
  onViewDetail,
}: {
  onViewDetail: (id: string) => void
}) {
  const followUps = useQuery(api.leads.getFollowUps)
  const projects = useQuery(api.projects.list, {})

  const projectMap = new Map(
    (projects ?? []).map((p) => [p._id, p.name])
  )

  if (followUps === undefined) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-sans text-sm font-medium">
            Today&apos;s Follow-Ups
          </h2>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <FollowUpCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  const overdueCount = followUps.filter((l) =>
    isOverdue(l.followUpDate)
  ).length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-sans text-sm font-medium">
          Today&apos;s Follow-Ups
        </h2>
        <Badge variant="secondary">{followUps.length}</Badge>
        {overdueCount > 0 && (
          <Badge variant="destructive">
            {overdueCount} overdue
          </Badge>
        )}
      </div>

      {followUps.length === 0 ? (
        <EmptyState
          icon={CheckmarkCircle02Icon}
          title="All caught up for today"
          description="No follow-ups due. Great work staying on top of your leads!"
        />
      ) : (
        <div className="space-y-3">
          {followUps.map((lead) => (
            <FollowUpCard
              key={lead._id}
              lead={lead as { _id: Id<"leads">; name: string; mobileNumber: string; status: string; projectId: Id<"projects">; followUpDate?: number; notes?: string; updatedAt: number }}
              projectName={projectMap.get(lead.projectId)}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </div>
  )
}
