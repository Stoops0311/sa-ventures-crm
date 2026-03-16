"use client"

import { usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { TimeDisplay } from "@/components/shared/time-display"
import { EmptyState } from "@/components/shared/empty-state"
import { FileUploadIcon } from "@hugeicons/core-free-icons"
import type { Id } from "@/convex/_generated/dataModel"

type SubmissionRow = {
  _id: string
  name: string
  mobileNumber: string
  status: string
  projectId: Id<"projects">
  createdAt: number
}

export function SubmissionsTable() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.leads.getMySubmissions,
    {},
    { initialNumItems: 25 }
  )

  const projects = useQuery(api.projects.list, {})
  const projectMap = new Map(
    (projects ?? []).map((p) => [p._id, p.name])
  )

  const columns: Column<SubmissionRow>[] = [
    {
      key: "name",
      label: "Lead Name",
      render: (row) => (
        <span className="font-sans font-medium">{row.name}</span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      render: (row) => (
        <span className="text-muted-foreground">{row.mobileNumber}</span>
      ),
    },
    {
      key: "project",
      label: "Project",
      render: (row) => (
        <span className="text-muted-foreground">
          {projectMap.get(row.projectId) ?? "..."}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: "submitted",
      label: "Submitted",
      render: (row) => <TimeDisplay timestamp={row.createdAt} />,
    },
  ]

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2">
        <CardTitle className="font-sans">My Submissions</CardTitle>
        {results && (
          <Badge variant="secondary">{results.length}</Badge>
        )}
      </CardHeader>
      <CardContent>
        <DataTable<SubmissionRow>
          columns={columns}
          data={results as SubmissionRow[] | undefined}
          loading={results === undefined}
          emptyState={
            <EmptyState
              icon={FileUploadIcon}
              title="No submissions yet"
              description="You haven't submitted any leads yet. Use the form above to get started."
            />
          }
        />

        {status === "CanLoadMore" && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMore(25)}
            >
              Load more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
