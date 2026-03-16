"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { CheckmarkCircle01Icon, TaskDone01Icon } from "@hugeicons/core-free-icons"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { OnboardingList } from "@/components/hr/onboarding/onboarding-list"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"

export default function OnboardingQueuePage() {
  const [tab, setTab] = useState("all")

  const allOnboardings = useQuery(api.onboarding.listAll, {})

  const counts = {
    all: allOnboardings?.length ?? 0,
    pending: allOnboardings?.filter((o) => o.status === "pending").length ?? 0,
    in_progress: allOnboardings?.filter((o) => o.status === "in_progress").length ?? 0,
    completed: allOnboardings?.filter((o) => o.status === "completed").length ?? 0,
  }

  const filtered =
    tab === "all"
      ? allOnboardings
      : allOnboardings?.filter((o) => o.status === tab)

  // Batch awareness: aggregate remaining items across all pending/in-progress
  const pendingItems = allOnboardings?.filter(
    (o) => o.status !== "completed"
  ) ?? []
  const itemCounts: Record<string, number> = {}
  for (const o of pendingItems) {
    for (const item of o.remainingItems) {
      itemCounts[item] = (itemCounts[item] ?? 0) + 1
    }
  }
  const batchSummary = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            All
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              {counts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5">
            Pending
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 border",
                counts.pending > 0 && "bg-yellow-50 text-yellow-700 border-yellow-200"
              )}
            >
              {counts.pending}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-1.5">
            In Progress
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 border",
                counts.in_progress > 0 && "bg-blue-50 text-blue-700 border-blue-200"
              )}
            >
              {counts.in_progress}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            Completed
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] px-1.5 py-0 h-4 border",
                counts.completed > 0 && "bg-green-50 text-green-700 border-green-200"
              )}
            >
              {counts.completed}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Batch awareness summary */}
      {batchSummary.length > 0 && tab !== "completed" && (
        <p className="text-xs text-muted-foreground">
          {batchSummary.map(([item, count]) => `${count} need "${item}"`).join(", ")}
        </p>
      )}

      <OnboardingList
        data={filtered}
        emptyState={
          tab === "all" ? (
            <EmptyState
              icon={CheckmarkCircle01Icon}
              title="All employees are fully onboarded"
              description="New onboarding checklists are created automatically when users join the system."
            />
          ) : (
            <EmptyState
              icon={TaskDone01Icon}
              title={`No ${tab === "in_progress" ? "in-progress" : tab} onboardings`}
              description={`All current onboardings are in other statuses.`}
            />
          )
        }
      />
    </div>
  )
}
