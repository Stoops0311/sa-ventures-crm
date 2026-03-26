"use client"

import { Suspense, useState, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { LeadFiltersBar, type LeadFilters } from "@/components/admin/lead-filters"
import { LeadTable, type Lead } from "@/components/admin/lead-table"
import { BulkActionBar } from "@/components/admin/bulk-action-bar"
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"
import type { SortConfig } from "@/components/shared/data-table"
import type { Id } from "@/convex/_generated/dataModel"
import { AddLeadDialog } from "@/components/admin/add-lead-dialog"
import { ACTIVE_LEAD_STATUSES } from "@/lib/constants"

export default function AdminLeadsPage() {
  return (
    <Suspense>
      <AdminLeadsContent />
    </Suspense>
  )
}

function AdminLeadsContent() {
  const searchParams = useSearchParams()

  // Initialize filters from URL params
  const [filters, setFilters] = useState<LeadFilters>(() => {
    const assignedTo = searchParams.get("assignedTo")
    const status = searchParams.get("status")
    const statusGroup = searchParams.get("statusGroup")
    const overdue = searchParams.get("overdue")

    const statuses = status
      ? [status]
      : statusGroup === "active"
      ? [...ACTIVE_LEAD_STATUSES]
      : undefined

    return {
      assignedTo: assignedTo ? (assignedTo as Id<"users">) : undefined,
      statuses,
      overdue: overdue === "true" ? true : undefined,
    }
  })

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const [sort, setSort] = useState<SortConfig>(null)

  const debouncedSearch = useDebounce(filters.search, 300)

  // Build query args for the Convex list query.
  // The list query accepts a single status string, so when multiple statuses
  // are selected we pass the first one (best-effort) or undefined.
  // For search queries, Convex search index can't paginate.
  const queryArgs = useMemo(() => {
    const args: {
      searchQuery?: string
      projectId?: Id<"projects">
      status?: string
      assignedTo?: Id<"users">
    } = {}

    if (debouncedSearch && debouncedSearch.trim().length > 0) {
      args.searchQuery = debouncedSearch.trim()
    }
    if (filters.projectId) {
      args.projectId = filters.projectId
    }
    // Convex list query accepts a single status string
    if (filters.statuses && filters.statuses.length === 1) {
      args.status = filters.statuses[0]
    }
    if (filters.assignedTo) {
      args.assignedTo = filters.assignedTo
    }

    return args
  }, [debouncedSearch, filters.projectId, filters.statuses, filters.assignedTo])

  const { results, status, loadMore } = usePaginatedQuery(
    api.leads.list,
    queryArgs,
    { initialNumItems: 50 }
  )

  // Fetch lookup data for projects and users
  const allProjects = useQuery(api.projects.list, {})
  const allUsers = useQuery(api.users.list, {})

  const projectMap = useMemo(() => {
    const map = new Map<string, string>()
    if (allProjects) {
      for (const p of allProjects) {
        map.set(p._id, p.name)
      }
    }
    return map
  }, [allProjects])

  const userMap = useMemo(() => {
    const map = new Map<string, string>()
    if (allUsers) {
      for (const u of allUsers) {
        map.set(u._id, u.name)
      }
    }
    return map
  }, [allUsers])

  // Client-side multi-status filtering (when multiple statuses are selected)
  const filteredResults = useMemo(() => {
    if (!results) return undefined
    let filtered = results as Lead[]

    // Apply multi-status filter client-side when more than 1 status selected
    if (filters.statuses && filters.statuses.length > 1) {
      const statusSet = new Set(filters.statuses)
      filtered = filtered.filter((l) => statusSet.has(l.status))
    }

    // Apply overdue filter: Follow Up leads with past followUpDate
    if (filters.overdue) {
      const now = Date.now()
      filtered = filtered.filter(
        (l) => l.status === "Follow Up" && l.followUpDate != null && l.followUpDate < now
      )
    }

    // Client-side sorting
    if (sort) {
      filtered = [...filtered].sort((a, b) => {
        let aVal: string | number | undefined
        let bVal: string | number | undefined

        switch (sort.key) {
          case "name":
            aVal = a.name.toLowerCase()
            bVal = b.name.toLowerCase()
            break
          case "followUpDate":
            aVal = a.followUpDate ?? 0
            bVal = b.followUpDate ?? 0
            break
          case "updatedAt":
            aVal = a.updatedAt
            bVal = b.updatedAt
            break
          default:
            return 0
        }

        if (aVal < bVal) return sort.direction === "asc" ? -1 : 1
        if (aVal > bVal) return sort.direction === "asc" ? 1 : -1
        return 0
      })
    }

    return filtered
  }, [results, filters.statuses, sort])

  const handleRowClick = useCallback((lead: Lead) => {
    setSelectedLeadId(lead._id)
    setSheetOpen(true)
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isLoading = status === "LoadingFirstPage"
  const canLoadMore = status === "CanLoadMore"

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-0">
        <h1 className="font-sans text-lg font-semibold">Leads</h1>
        <Button onClick={() => setAddLeadOpen(true)}>Add Lead</Button>
      </div>

      <LeadFiltersBar filters={filters} onChange={setFilters} />

      <div className="flex-1 mt-4">
        <LeadTable
          data={filteredResults}
          loading={isLoading}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onRowClick={handleRowClick}
          sort={sort}
          onSortChange={setSort}
          projectMap={projectMap}
          userMap={userMap}
        />

        {canLoadMore && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadMore(50)}
            >
              Load more
            </Button>
          </div>
        )}

        {status === "Exhausted" && filteredResults && filteredResults.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-center py-4">
            All {filteredResults.length} leads loaded
          </p>
        )}
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={handleClearSelection}
      />

      <LeadDetailSheet
        leadId={selectedLeadId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
    </div>
  )
}
