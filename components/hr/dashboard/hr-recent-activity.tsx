"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { getRelativeTime } from "@/lib/date-utils"

function parseDetails(raw?: string): Record<string, unknown> {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function formatHRAction(log: {
  action: string
  performedByName: string
  details?: string
  entityType: string
}): string {
  const name = log.performedByName
  const d = parseDetails(log.details)

  switch (log.action) {
    case "profile_created":
    case "profile_auto_created":
      return `${name} created employee profile`
    case "profile_updated":
      return `${name} updated employee profile`
    case "photo_updated":
      return `${name} updated profile photo`
    case "onboarding_created":
      return `${name} created onboarding checklist`
    case "item_completed":
      return `${name} completed "${d.itemLabel ?? "an item"}"`
    case "item_uncompleted":
      return `${name} unchecked "${d.itemLabel ?? "an item"}"`
    case "onboarding_completed":
      return `${name} marked onboarding as complete`
    default:
      return `${name} performed ${log.action.replace(/_/g, " ")}`
  }
}

export function HRRecentActivity() {
  const logs = useQuery(api.activityLogs.listRecent, { limit: 30 })

  const hrLogs = logs?.filter(
    (log) =>
      log.entityType === "employee" || log.entityType === "onboarding"
  ) ?? []
  const display = hrLogs.slice(0, 15)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent HR Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[300px]">
          {logs === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-3 w-16 shrink-0" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))}
            </div>
          ) : display.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No HR activity recorded yet
            </p>
          ) : (
            <div className="space-y-3">
              {display.map((log) => (
                <div
                  key={log._id}
                  className="flex gap-2 items-start animate-in fade-in duration-300"
                >
                  <span className="text-[10px] text-muted-foreground shrink-0 w-16 tabular-nums pt-0.5">
                    {getRelativeTime(log.timestamp)}
                  </span>
                  <p className="text-xs leading-relaxed">
                    {formatHRAction(log)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
