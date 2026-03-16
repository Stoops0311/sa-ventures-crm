"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons"
import { StatusBadge } from "@/components/shared/status-badge"
import { TimeDisplay } from "@/components/shared/time-display"
import { Badge } from "@/components/ui/badge"
import { LeadContextMenu } from "@/components/admin/lead-context-menu"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { SortConfig } from "@/components/shared/data-table"
import type { Id } from "@/convex/_generated/dataModel"

export type Lead = {
  _id: Id<"leads">
  _creationTime: number
  name: string
  mobileNumber: string
  email?: string
  projectId: Id<"projects">
  status: string
  assignedTo: Id<"users">
  followUpDate?: number
  updatedAt: number
  createdAt: number
  source: string
  budget?: string
  notes?: string
  submittedBy?: Id<"users">
}

type ColumnDef = {
  key: string
  label: string
  sortable?: boolean
  className?: string
}

const COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "mobileNumber", label: "Phone" },
  { key: "projectId", label: "Project" },
  { key: "status", label: "Status" },
  { key: "assignedTo", label: "Assigned To" },
  { key: "followUpDate", label: "Follow-up", sortable: true },
  { key: "updatedAt", label: "Updated", sortable: true },
]

export function LeadTable({
  data,
  loading,
  selectedIds,
  onSelectionChange,
  onRowClick,
  sort,
  onSortChange,
  projectMap,
  userMap,
}: {
  data: Lead[] | undefined
  loading?: boolean
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onRowClick: (lead: Lead) => void
  sort: SortConfig
  onSortChange: (sort: SortConfig) => void
  projectMap: Map<string, string>
  userMap: Map<string, string>
}) {
  if (loading || data === undefined) {
    return <TableSkeleton cols={COLUMNS.length + 1} />
  }

  if (data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-12">
        No leads found matching your filters.
      </p>
    )
  }

  const allSelected = data.length > 0 && selectedIds.size === data.length

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(data!.map((r) => r._id)))
    }
  }

  function toggleRow(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange(next)
  }

  function handleSort(key: string) {
    if (sort?.key === key) {
      onSortChange(
        sort.direction === "asc" ? { key, direction: "desc" } : null
      )
    } else {
      onSortChange({ key, direction: "asc" })
    }
  }

  async function handleCopyPhone(phone: string, e: React.MouseEvent) {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(phone)
      toast.success("Phone copied to clipboard")
    } catch {
      toast.error("Failed to copy phone")
    }
  }

  function renderCell(lead: Lead, key: string) {
    switch (key) {
      case "name":
        return <span className="font-medium">{lead.name}</span>
      case "mobileNumber":
        return (
          <button
            className="text-xs tabular-nums hover:text-primary hover:underline underline-offset-2 transition-colors"
            onClick={(e) => handleCopyPhone(lead.mobileNumber, e)}
          >
            {lead.mobileNumber}
          </button>
        )
      case "projectId":
        return (
          <Badge variant="outline" className="text-[10px]">
            {projectMap.get(lead.projectId) ?? "Unknown"}
          </Badge>
        )
      case "status":
        return <StatusBadge status={lead.status} size="sm" />
      case "assignedTo":
        return (
          <span className="text-xs text-muted-foreground">
            {userMap.get(lead.assignedTo) ?? "Unknown"}
          </span>
        )
      case "followUpDate":
        return <TimeDisplay timestamp={lead.followUpDate} mode="follow-up" />
      case "updatedAt":
        return <TimeDisplay timestamp={lead.updatedAt} />
      default:
        return null
    }
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
              />
            </TableHead>
            {COLUMNS.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.sortable ? (
                  <button
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sort?.key === col.key && (
                      <HugeiconsIcon
                        icon={
                          sort.direction === "asc"
                            ? ArrowUp01Icon
                            : ArrowDown01Icon
                        }
                        className="size-3"
                      />
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((lead) => (
            <LeadContextMenu
              key={lead._id}
              leadId={lead._id}
              phone={lead.mobileNumber}
            >
              <TableRow
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  selectedIds.has(lead._id) && "bg-muted/30"
                )}
                onClick={() => onRowClick(lead)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(lead._id)}
                    onCheckedChange={() => toggleRow(lead._id)}
                    aria-label={`Select ${lead.name}`}
                  />
                </TableCell>
                {COLUMNS.map((col) => (
                  <TableCell key={col.key}>{renderCell(lead, col.key)}</TableCell>
                ))}
              </TableRow>
            </LeadContextMenu>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
