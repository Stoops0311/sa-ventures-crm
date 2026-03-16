"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { getHrQueryStatusStyle, getHrQueryTypeLabel } from "@/lib/constants"
import { getRelativeTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { HelpCircleIcon } from "@hugeicons/core-free-icons"

type MyQuery = {
  _id: string
  type: string
  subject: string
  status: string
  createdAt: number
  resolutionNote?: string
}

export function QueryHistory({
  onSubmitFirst,
}: {
  onSubmitFirst?: () => void
}) {
  const queries = useQuery(api.hrQueries.listByUser)

  const columns: Column<MyQuery>[] = [
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <Badge variant="outline" className="text-[10px] font-mono">
          {getHrQueryTypeLabel(row.type)}
        </Badge>
      ),
    },
    {
      key: "subject",
      label: "Subject",
      render: (row) => (
        <span className="text-sm" title={row.subject}>
          {row.subject.length > 50 ? row.subject.slice(0, 50) + "..." : row.subject}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        const style = getHrQueryStatusStyle(row.status)
        return (
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 h-4 border",
              style.bg,
              style.text,
              style.border
            )}
          >
            {style.label}
          </Badge>
        )
      },
    },
    {
      key: "submitted",
      label: "Submitted",
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {getRelativeTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "resolution",
      label: "Resolution",
      render: (row) =>
        row.resolutionNote ? (
          <span className="text-xs text-muted-foreground italic">
            {row.resolutionNote}
          </span>
        ) : (
          <span className="text-muted-foreground">--</span>
        ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={queries as MyQuery[] | undefined}
      loading={queries === undefined}
      emptyState={
        <EmptyState
          icon={HelpCircleIcon}
          title="No queries submitted"
          description="Need a salary certificate, address change, or anything else? Submit a query above."
          action={
            onSubmitFirst
              ? { label: "Submit Your First Query", onClick: onSubmitFirst }
              : undefined
          }
        />
      }
    />
  )
}
