"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/shared/data-table"
import { getRoleStyle, getOnboardingStatusStyle } from "@/lib/constants"
import { getRelativeTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type OnboardingRow = {
  _id: string
  userId: string
  employeeProfileId: string
  status: string
  completedCount: number
  totalItems: number
  remainingItems: string[]
  createdAt: number
  user: {
    _id: string
    name: string
    role: string
    imageUrl?: string
  } | null
}

export function OnboardingList({
  data,
  loading,
  emptyState,
}: {
  data: OnboardingRow[] | undefined
  loading?: boolean
  emptyState?: React.ReactNode
}) {
  const router = useRouter()

  const columns: Column<OnboardingRow>[] = [
    {
      key: "employee",
      label: "Employee",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex size-6 shrink-0 items-center justify-center border bg-muted text-[10px] font-medium">
            {row.user?.imageUrl ? (
              <img src={row.user.imageUrl} alt={row.user.name} className="size-full object-cover" />
            ) : (
              <span>{row.user?.name?.charAt(0).toUpperCase() ?? "?"}</span>
            )}
          </div>
          <span className="font-medium text-sm">{row.user?.name}</span>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      className: "hidden md:table-cell",
      render: (row) => {
        const style = getRoleStyle(row.user?.role ?? "")
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
      key: "status",
      label: "Status",
      render: (row) => {
        const style = getOnboardingStatusStyle(row.status)
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
      key: "progress",
      label: "Progress",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                row.completedCount === row.totalItems
                  ? "bg-green-500"
                  : "bg-primary"
              )}
              style={{
                width: `${(row.completedCount / row.totalItems) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {row.completedCount}/{row.totalItems}
          </span>
        </div>
      ),
    },
    {
      key: "remaining",
      label: "Items Remaining",
      className: "hidden lg:table-cell max-w-[250px]",
      render: (row) => {
        if (row.remainingItems.length === 0) return <span className="text-xs text-green-600">All done</span>
        const shown = row.remainingItems.slice(0, 2)
        const extra = row.remainingItems.length - 2
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs text-muted-foreground truncate block cursor-default">
                {shown.join(", ")}
                {extra > 0 && ` +${extra} more`}
              </span>
            </TooltipTrigger>
            {extra > 0 && (
              <TooltipContent>
                {row.remainingItems.map((item) => (
                  <div key={item} className="text-xs">{item}</div>
                ))}
              </TooltipContent>
            )}
          </Tooltip>
        )
      },
    },
    {
      key: "created",
      label: "Created",
      className: "hidden md:table-cell",
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {getRelativeTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      className: "w-16",
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/hr/employees/${row.employeeProfileId}`)
          }}
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onRowClick={(row) => router.push(`/hr/employees/${row.employeeProfileId}`)}
      emptyState={emptyState}
    />
  )
}
