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
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"
import { TableSkeleton } from "./loading-skeleton"

export type Column<T> = {
  key: string
  label: string
  sortable?: boolean
  className?: string
  render: (row: T) => React.ReactNode
}

export type SortConfig = {
  key: string
  direction: "asc" | "desc"
} | null

export function DataTable<T extends { _id: string }>({
  columns,
  data,
  loading,
  selectable,
  selectedIds,
  onSelectionChange,
  onRowClick,
  sort,
  onSortChange,
  emptyState,
  className,
}: {
  columns: Column<T>[]
  data: T[] | undefined
  loading?: boolean
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  onRowClick?: (row: T) => void
  sort?: SortConfig
  onSortChange?: (sort: SortConfig) => void
  emptyState?: React.ReactNode
  className?: string
}) {
  if (loading || data === undefined) {
    return <TableSkeleton cols={columns.length} />
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  const allSelected =
    data.length > 0 && selectedIds?.size === data.length

  function toggleAll() {
    if (!onSelectionChange) return
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(data!.map((r) => r._id)))
    }
  }

  function toggleRow(id: string) {
    if (!onSelectionChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange(next)
  }

  function handleSort(key: string) {
    if (!onSortChange) return
    if (sort?.key === key) {
      onSortChange(
        sort.direction === "asc"
          ? { key, direction: "desc" }
          : null
      )
    } else {
      onSortChange({ key, direction: "asc" })
    }
  }

  return (
    <div className={cn("overflow-auto", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {selectable && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            {columns.map((col) => (
              <TableHead key={col.key} className={col.className}>
                {col.sortable && onSortChange ? (
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
          {data.map((row) => (
            <TableRow
              key={row._id}
              className={cn(
                onRowClick && "cursor-pointer hover:bg-muted/50",
                selectedIds?.has(row._id) && "bg-muted/30"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {selectable && (
                <TableCell
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedIds?.has(row._id)}
                    onCheckedChange={() => toggleRow(row._id)}
                    aria-label={`Select row`}
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell key={col.key} className={col.className}>
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
