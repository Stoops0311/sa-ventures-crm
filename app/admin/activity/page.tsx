"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TimeDisplay } from "@/components/shared/time-display"
import { EmptyState } from "@/components/shared/empty-state"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import { Clock01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

const ENTITY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "lead", label: "Lead" },
  { value: "project", label: "Project" },
  { value: "user", label: "User" },
]

const ACTION_LABELS: Record<string, string> = {
  status_changed: "Changed Status",
  lead_created: "Created Lead",
  lead_imported: "Imported Lead",
  lead_updated: "Updated Lead",
  bulk_import: "Bulk Import",
  created: "Created",
  updated: "Updated",
  archived: "Archived",
  creative_added: "Added Creative",
  creative_removed: "Removed Creative",
  availability_toggled: "Toggled Availability",
  user_updated: "Updated User",
  remark_added: "Added Remark",
  follow_up_set: "Set Follow-up",
  reassigned: "Reassigned",
}

function formatAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action]
  // Fallback: convert snake_case to Title Case
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function getEntityBadgeStyle(entityType: string) {
  switch (entityType) {
    case "lead":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "project":
      return "bg-purple-50 text-purple-700 border-purple-200"
    case "user":
      return "bg-orange-50 text-orange-700 border-orange-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export default function ActivityPage() {
  const [entityTypeFilter, setEntityTypeFilter] = useState("all")
  const [limit, setLimit] = useState(50)

  const logs = useQuery(api.activityLogs.listRecent, { limit })
  const users = useQuery(api.users.list, {})

  const filteredLogs = useMemo(() => {
    if (!logs) return undefined

    let filtered = logs
    if (entityTypeFilter !== "all") {
      filtered = filtered.filter((log) => log.entityType === entityTypeFilter)
    }

    return filtered
  }, [logs, entityTypeFilter])

  if (filteredLogs === undefined) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-lg font-semibold">Activity Log</h1>
        <p className="text-xs text-muted-foreground">
          System-wide activity log showing all actions performed across the CRM.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground">
          Showing {filteredLogs.length} activit{filteredLogs.length !== 1 ? "ies" : "y"}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={Clock01Icon}
              title="No activity yet"
              description="Activity will appear here as users interact with the CRM."
              className="py-12"
            />
          ) : (
            <>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="whitespace-nowrap">
                          <TimeDisplay timestamp={log.timestamp} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.performedByImageUrl ? (
                              <img
                                src={log.performedByImageUrl}
                                alt={log.performedByName}
                                className="size-5 object-cover"
                              />
                            ) : (
                              <div className="flex size-5 items-center justify-center bg-muted text-[10px] font-medium">
                                {log.performedByName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-xs">{log.performedByName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatAction(log.action)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(getEntityBadgeStyle(log.entityType))}
                          >
                            {log.entityType.charAt(0).toUpperCase() + log.entityType.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-64">
                          <span className="text-xs text-muted-foreground truncate block">
                            {log.details
                              ? (() => {
                                  try {
                                    const parsed = JSON.parse(log.details) as Record<string, unknown>
                                    return Object.entries(parsed)
                                      .filter(([, v]) => v !== undefined && v !== null)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(", ")
                                  } catch {
                                    return log.details
                                  }
                                })()
                              : "--"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Load more */}
              {logs && logs.length >= limit && (
                <div className="flex justify-center py-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLimit((l) => l + 50)}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
