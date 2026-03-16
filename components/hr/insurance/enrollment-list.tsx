"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTable, type Column } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { EnrollmentStatusBadge } from "./enrollment-status-badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Shield01Icon } from "@hugeicons/core-free-icons"
import { useDebounce } from "@/hooks/use-debounce"

type Enrollment = {
  _id: string
  userId: string
  employeeName: string
  status: string
  policyNumber?: string
  expiryDate?: string
  nomineeName: string
  nomineeRelation: string
}

export function EnrollmentList({
  onRowClick,
}: {
  onRowClick?: (enrollment: Enrollment) => void
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  const enrollments = useQuery(api.insurance.listAll, {
    status: statusFilter === "all" ? undefined : statusFilter,
  })

  const filtered = enrollments?.filter((e) => {
    if (!debouncedSearch) return true
    const q = debouncedSearch.toLowerCase()
    return (
      e.employeeName.toLowerCase().includes(q) ||
      e.policyNumber?.toLowerCase().includes(q)
    )
  })

  const columns: Column<Enrollment>[] = [
    {
      key: "employeeName",
      label: "Employee",
      render: (row) => (
        <span className="font-medium">{row.employeeName}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <EnrollmentStatusBadge status={row.status} />,
    },
    {
      key: "policyNumber",
      label: "Policy Number",
      render: (row) => (
        <span className="font-mono text-muted-foreground text-xs">
          {row.policyNumber ?? "--"}
        </span>
      ),
    },
    {
      key: "expiryDate",
      label: "Expiry Date",
      render: (row) => {
        if (!row.expiryDate) {
          return <span className="text-muted-foreground">--</span>
        }
        const now = new Date()
        const expiry = new Date(row.expiryDate + "T00:00:00")
        const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={cn(
                  "font-mono text-xs",
                  daysRemaining <= 7 ? "text-destructive font-medium" :
                  daysRemaining <= 30 ? "text-yellow-600" :
                  "text-muted-foreground"
                )}
              >
                {row.expiryDate}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {daysRemaining > 0
                ? `Expires in ${daysRemaining} days`
                : daysRemaining === 0
                  ? "Expires today"
                  : `Expired ${Math.abs(daysRemaining)} days ago`}
            </TooltipContent>
          </Tooltip>
        )
      },
    },
    {
      key: "nominee",
      label: "Nominee",
      render: (row) => {
        const full = `${row.nomineeName} (${row.nomineeRelation})`
        const display = row.nomineeName.length > 20
          ? row.nomineeName.slice(0, 20) + "..."
          : row.nomineeName
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm">{display}</span>
            </TooltipTrigger>
            <TooltipContent>{full}</TooltipContent>
          </Tooltip>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          />
          <Input
            placeholder="Search employee..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="enrolled">Enrolled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="renewed">Renewed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered as Enrollment[] | undefined}
        loading={enrollments === undefined}
        onRowClick={onRowClick}
        emptyState={
          <EmptyState
            icon={Shield01Icon}
            title="No insurance enrollments"
            description="Employees can enroll from their self-service page."
          />
        }
      />
    </div>
  )
}
