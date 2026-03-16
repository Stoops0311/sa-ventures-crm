"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/shared/data-table"
import { getRoleStyle, getOnboardingStatusStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"

type EmployeeRow = {
  _id: string
  userId: string
  user: {
    _id: string
    name: string
    email?: string
    phone?: string
    role: string
    imageUrl?: string
  } | null
  onboarding: {
    status: string
    items: string
  } | null
  department?: string
  dateOfJoining?: string
}

function getOnboardingProgress(onboarding: EmployeeRow["onboarding"]) {
  if (!onboarding) return { completed: 0, total: 7 }
  try {
    const items = JSON.parse(onboarding.items) as { completedAt: number | null }[]
    return {
      completed: items.filter((i) => i.completedAt !== null).length,
      total: items.length,
    }
  } catch {
    return { completed: 0, total: 7 }
  }
}

export function EmployeeTable({
  data,
  loading,
  emptyState,
}: {
  data: EmployeeRow[] | undefined
  loading?: boolean
  emptyState?: React.ReactNode
}) {
  const router = useRouter()

  const columns: Column<EmployeeRow>[] = [
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center border bg-muted text-xs font-medium">
            {row.user?.imageUrl ? (
              <img
                src={row.user.imageUrl}
                alt={row.user.name}
                className="size-full object-cover"
              />
            ) : (
              <span>
                {row.user?.name?.charAt(0).toUpperCase() ?? "?"}
              </span>
            )}
          </div>
          <span className="font-medium text-sm">{row.user?.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      className: "hidden lg:table-cell",
      render: (row) => (
        <span className="text-muted-foreground text-sm truncate max-w-[200px] block">
          {row.user?.email ?? "--"}
        </span>
      ),
    },
    {
      key: "phone",
      label: "Phone",
      className: "hidden md:table-cell",
      render: (row) =>
        row.user?.phone ? (
          <button
            className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(row.user!.phone!)
              toast.success("Phone number copied")
            }}
          >
            {row.user.phone}
          </button>
        ) : (
          <span className="text-muted-foreground text-sm">--</span>
        ),
    },
    {
      key: "role",
      label: "Role",
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
      key: "department",
      label: "Department",
      className: "hidden lg:table-cell",
      render: (row) => (
        <span
          className={cn(
            "text-sm",
            row.department
              ? "text-muted-foreground"
              : "text-muted-foreground italic"
          )}
        >
          {row.department ?? "Not set"}
        </span>
      ),
    },
    {
      key: "onboarding",
      label: "Onboarding",
      render: (row) => {
        if (!row.onboarding) return null
        const style = getOnboardingStatusStyle(row.onboarding.status)
        const progress = getOnboardingProgress(row.onboarding)
        return (
          <div className="flex items-center gap-1.5">
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
            {row.onboarding.status !== "completed" && (
              <span className="text-[10px] text-muted-foreground">
                {progress.completed}/{progress.total}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: "dateOfJoining",
      label: "Date of Joining",
      className: "hidden xl:table-cell",
      render: (row) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.dateOfJoining
            ? format(new Date(row.dateOfJoining), "dd MMM yyyy")
            : "--"}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      onRowClick={(row) => router.push(`/hr/employees/${row._id}`)}
      emptyState={emptyState}
    />
  )
}
