"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { FilterIcon, Cancel01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { LEAD_STATUSES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Id } from "@/convex/_generated/dataModel"

export type LeadFilters = {
  search?: string
  projectId?: Id<"projects">
  statuses?: string[]
  assignedTo?: Id<"users">
  overdue?: boolean
}

export function LeadFiltersBar({
  filters,
  onChange,
}: {
  filters: LeadFilters
  onChange: (filters: LeadFilters) => void
}) {
  const projects = useQuery(api.projects.list, { status: "active" })
  const salespeople = useQuery(api.users.list, { role: "salesperson" })
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false)

  const hasActiveFilters =
    (filters.search && filters.search.length > 0) ||
    filters.projectId ||
    (filters.statuses && filters.statuses.length > 0) ||
    filters.assignedTo

  function toggleStatus(status: string) {
    const current = filters.statuses ?? []
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    onChange({ ...filters, statuses: next.length > 0 ? next : undefined })
  }

  return (
    <div className="sticky top-12 z-10 bg-background border-b py-3">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
            strokeWidth={1.5}
          />
          <Input
            placeholder="Search leads..."
            value={filters.search ?? ""}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value || undefined })
            }
            className="pl-7 w-48"
          />
        </div>

        <Select
          value={filters.projectId ?? "all"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              projectId:
                value === "all"
                  ? undefined
                  : (value as Id<"projects">),
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {(projects ?? []).map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="default" className="gap-1.5">
              <HugeiconsIcon
                icon={FilterIcon}
                className="size-3.5"
                strokeWidth={1.5}
              />
              {filters.statuses && filters.statuses.length > 0
                ? `Status (${filters.statuses.length})`
                : "Filter by status"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-52 p-2">
            <div className="space-y-1">
              {LEAD_STATUSES.map((status) => (
                <label
                  key={status.value}
                  className="flex items-center gap-2 px-1 py-1 text-xs cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={filters.statuses?.includes(status.value) ?? false}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <span>{status.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Select
          value={filters.assignedTo ?? "all"}
          onValueChange={(value) =>
            onChange({
              ...filters,
              assignedTo:
                value === "all"
                  ? undefined
                  : (value as Id<"users">),
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Salespeople" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Salespeople</SelectItem>
            {(salespeople ?? []).map((sp) => (
              <SelectItem key={sp._id} value={sp._id}>
                {sp.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => onChange({})}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="size-3"
              strokeWidth={2}
            />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
