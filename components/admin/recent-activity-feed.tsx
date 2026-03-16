"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
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

function formatAction(log: {
  action: string
  performedByName: string
  details?: string
}): string {
  const name = log.performedByName
  const d = parseDetails(log.details)

  switch (log.action) {
    case "lead_created":
      return `${name} created lead "${d.name ?? "Unknown"}"`
    case "status_changed":
      return `${name} changed status from ${d.oldStatus ?? "?"} to ${d.newStatus ?? "?"}`
    case "lead_reassigned":
      return `${name} reassigned a lead${d.bulk ? " (bulk)" : ""}`
    case "followup_set":
      return `${name} set a follow-up`
    case "lead_imported":
      return `${name} imported ${d.count ?? "?"} leads`
    case "created":
      return `${name} created project "${d.name ?? ""}"`
    case "updated":
      return `${name} updated project "${d.name ?? ""}"`
    case "archived":
      return `${name} archived project "${d.name ?? ""}"`
    case "availability_toggled":
      return `${name} toggled availability for ${d.userName ?? "a user"}`
    case "user_updated":
      return `${name} updated user ${d.userName ?? ""}`
    default:
      return `${name} performed ${log.action.replace(/_/g, " ")}`
  }
}

export function RecentActivityFeed() {
  const logs = useQuery(api.activityLogs.listRecent, { limit: 20 })

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <ScrollArea className="max-h-[400px]">
          {logs === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-3 w-16 shrink-0" />
                  <Skeleton className="h-3 flex-1" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No recent activity
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log._id} className="flex gap-2 items-start">
                  <span className="text-[10px] text-muted-foreground shrink-0 w-16 tabular-nums pt-0.5">
                    {getRelativeTime(log.timestamp)}
                  </span>
                  <p className="text-xs leading-relaxed">
                    {formatAction(log)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-0">
        <Link
          href="/admin/activity"
          className="text-xs text-primary hover:underline underline-offset-2"
        >
          View All
        </Link>
      </CardFooter>
    </Card>
  )
}
