"use client"

import { useState, useMemo } from "react"
import { usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/shared/data-table"
import { StatusBadge } from "@/components/shared/status-badge"
import { TimeDisplay } from "@/components/shared/time-display"
import { EmptyState } from "@/components/shared/empty-state"
import { useDebounce } from "@/hooks/use-debounce"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserMultipleIcon } from "@hugeicons/core-free-icons"
import type { Id } from "@/convex/_generated/dataModel"

type LeadRow = {
  _id: string
  name: string
  mobileNumber: string
  status: string
  projectId: Id<"projects">
  followUpDate?: number
  updatedAt: number
}

const ACTIVE_STATUSES = [
  "New",
  "No Response",
  "Follow Up",
  "Other Requirement",
  "Visit Scheduled",
  "Visit Done",
  "Booking Done",
]

const CLOSED_STATUSES = ["Closed Won", "Closed Lost"]

function getStatusFilter(tab: string): string | undefined {
  switch (tab) {
    case "All":
      return undefined
    case "New":
      return "New"
    case "Follow-ups":
      return "Follow Up"
    default:
      return undefined
  }
}

export function MyLeadsSection({
  onViewDetail,
}: {
  onViewDetail: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState("All")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const statusFilter = getStatusFilter(activeTab)

  const { results, status, loadMore } = usePaginatedQuery(
    api.leads.getMyLeads,
    { status: statusFilter },
    { initialNumItems: 25 }
  )

  const projects = useQuery(api.projects.list, {})
  const projectMap = new Map(
    (projects ?? []).map((p) => [p._id, p.name])
  )

  // Client-side filtering for Active/Closed tabs and search
  const filteredResults = useMemo(() => {
    if (!results) return undefined

    let filtered = results
    if (activeTab === "Active") {
      filtered = filtered.filter((l) =>
        ACTIVE_STATUSES.includes(l.status)
      )
    } else if (activeTab === "Closed") {
      filtered = filtered.filter((l) =>
        CLOSED_STATUSES.includes(l.status)
      )
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.mobileNumber.includes(q)
      )
    }

    return filtered
  }, [results, activeTab, debouncedSearch])

  const columns: Column<LeadRow>[] = [
    {
      key: "name",
      label: "Name",
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
      key: "followUp",
      label: "Follow-up",
      render: (row) => (
        <TimeDisplay timestamp={row.followUpDate} mode="follow-up" />
      ),
    },
    {
      key: "updated",
      label: "Updated",
      render: (row) => <TimeDisplay timestamp={row.updatedAt} />,
    },
  ]

  return (
    <div className="space-y-3">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="New">New</TabsTrigger>
          <TabsTrigger value="Follow-ups">Follow-ups</TabsTrigger>
          <TabsTrigger value="Active">Active</TabsTrigger>
          <TabsTrigger value="Closed">Closed</TabsTrigger>
        </TabsList>

        <div className="mt-3">
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <TabsContent value={activeTab} className="mt-3">
          <DataTable<LeadRow>
            columns={columns}
            data={filteredResults as LeadRow[] | undefined}
            loading={results === undefined}
            onRowClick={(row) => onViewDetail(row._id)}
            emptyState={
              <EmptyState
                icon={UserMultipleIcon}
                title="No leads found"
                description={
                  search
                    ? "Try adjusting your search query."
                    : "No leads in this category yet."
                }
              />
            }
          />
        </TabsContent>
      </Tabs>

      {status === "CanLoadMore" && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadMore(25)}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
