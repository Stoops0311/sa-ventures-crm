"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, type Column } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryDetailSheet } from "./query-detail-sheet"
import { getHrQueryStatusStyle, getHrQueryTypeLabel } from "@/lib/constants"
import { getRelativeTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

type HrQuery = {
  _id: string
  userId: string
  type: string
  subject: string
  status: string
  createdAt: number
  employeeName: string
  employeeImageUrl: string | null
}

export function QueryQueue() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [selectedQuery, setSelectedQuery] = useState<Id<"hrQueries"> | null>(null)

  const stats = useQuery(api.hrQueries.getStats)
  const queries = useQuery(api.hrQueries.listAll, {
    status: statusFilter === "all" ? undefined : statusFilter,
    type: typeFilter === "all" ? undefined : typeFilter,
  })

  const filtered = queries?.filter((q) => {
    if (!debouncedSearch) return true
    const s = debouncedSearch.toLowerCase()
    return (
      q.employeeName.toLowerCase().includes(s) ||
      q.subject.toLowerCase().includes(s)
    )
  })

  const columns: Column<HrQuery>[] = [
    {
      key: "employee",
      label: "Employee",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="size-6 shrink-0 border bg-muted flex items-center justify-center text-[10px] font-medium overflow-hidden">
            {row.employeeImageUrl ? (
              <img src={row.employeeImageUrl} alt="" className="size-full object-cover" />
            ) : (
              <span>{row.employeeName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span className="font-medium">{row.employeeName}</span>
        </div>
      ),
    },
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
        <span className="text-sm truncate max-w-[200px] block" title={row.subject}>
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
      key: "created",
      label: "Created",
      render: (row) => (
        <span className="text-muted-foreground text-xs">
          {getRelativeTime(row.createdAt)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stat pills bar */}
      {stats && (
        <div className="bg-muted py-3 px-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Open:</span>
            <span className={cn("font-bold", stats.open > 0 && "text-blue-700")}>
              {stats.open}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">In Progress:</span>
            <span className={cn("font-bold", stats.inProgress > 0 && "text-yellow-700")}>
              {stats.inProgress}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Resolved Today:</span>
            <span className={cn("font-bold", stats.resolvedToday > 0 && "text-green-700")}>
              {stats.resolvedToday}
            </span>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          />
          <Input
            placeholder="Search by name or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="salary_certificate">Salary Certificate</SelectItem>
            <SelectItem value="experience_letter">Experience Letter</SelectItem>
            <SelectItem value="leave_encashment">Leave Encashment</SelectItem>
            <SelectItem value="salary_advance">Salary Advance</SelectItem>
            <SelectItem value="address_change">Address Change</SelectItem>
            <SelectItem value="bank_detail_change">Bank Detail Change</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered as HrQuery[] | undefined}
        loading={queries === undefined}
        onRowClick={(row) => setSelectedQuery(row._id as Id<"hrQueries">)}
        emptyState={
          statusFilter !== "all" || typeFilter !== "all" || debouncedSearch ? (
            <EmptyState
              icon={Search01Icon}
              title="No queries match your filters"
              description="Try adjusting your filters or search term."
              action={{
                label: "Clear all filters",
                onClick: () => {
                  setStatusFilter("all")
                  setTypeFilter("all")
                  setSearch("")
                },
              }}
            />
          ) : (
            <EmptyState
              icon={CheckmarkCircle01Icon}
              title="No open queries"
              description="All employee requests have been processed."
            />
          )
        }
      />

      {/* Detail Sheet */}
      <QueryDetailSheet
        queryId={selectedQuery}
        open={!!selectedQuery}
        onOpenChange={(open) => {
          if (!open) setSelectedQuery(null)
        }}
      />
    </div>
  )
}
