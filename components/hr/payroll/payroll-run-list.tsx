"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MoneyReceiveSquareIcon,
  ViewIcon,
  Delete01Icon,
  MoreVerticalIcon,
} from "@hugeicons/core-free-icons"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DataTable, type Column } from "@/components/shared/data-table"
import { EmptyState } from "@/components/shared/empty-state"
import { formatINR } from "@/lib/currency"
import { toast } from "sonner"

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

type RunWithMeta = {
  _id: Id<"payrollRuns">
  month: number
  year: number
  status: string
  processedBy: Id<"users">
  confirmedAt?: number
  createdAt: number
  employeeCount: number
  totalNetPay: number
  processedByName: string
}

export function PayrollRunList({
  runs,
}: {
  runs: RunWithMeta[] | undefined
}) {
  const router = useRouter()
  const deleteRun = useMutation(api.payroll.deleteRun)
  const [filterYear, setFilterYear] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<RunWithMeta | null>(null)

  const filteredRuns = runs
    ?.filter((r) => filterYear === "all" || r.year === parseInt(filterYear))
    .filter((r) => filterStatus === "all" || r.status === filterStatus)

  const distinctYears = runs
    ? [...new Set(runs.map((r) => r.year))].sort((a, b) => b - a)
    : []

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteRun({ runId: deleteTarget._id })
      toast.success("Draft payroll run deleted.")
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete")
    }
  }

  const columns: Column<RunWithMeta>[] = [
    {
      key: "month",
      label: "Month / Year",
      render: (row) => (
        <button
          className="font-medium hover:underline text-left"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/hr/payroll/${row._id}`)
          }}
        >
          {MONTH_NAMES[row.month - 1]} {row.year}
        </button>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Badge
          variant="secondary"
          className={
            row.status === "draft"
              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
              : "bg-green-50 text-green-700 border-green-200"
          }
        >
          {row.status === "draft" ? "Draft" : "Confirmed"}
        </Badge>
      ),
    },
    {
      key: "employees",
      label: "Employees",
      className: "text-muted-foreground",
      render: (row) => row.employeeCount,
    },
    {
      key: "totalNetPay",
      label: "Total Net Pay",
      className: "text-right",
      render: (row) => (
        <span className="font-mono tabular-nums">{formatINR(row.totalNetPay)}</span>
      ),
    },
    {
      key: "processedBy",
      label: "Processed By",
      className: "text-muted-foreground text-xs hidden lg:table-cell",
      render: (row) => row.processedByName,
    },
    {
      key: "date",
      label: "Date",
      className: "text-muted-foreground text-xs hidden lg:table-cell",
      render: (row) => {
        const d = new Date(row.createdAt)
        return d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      },
    },
    {
      key: "actions",
      label: "",
      className: "w-10",
      render: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <HugeiconsIcon icon={MoreVerticalIcon} className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/hr/payroll/${row._id}`)}>
              <HugeiconsIcon icon={ViewIcon} className="size-3.5 mr-2" />
              View Details
            </DropdownMenuItem>
            {row.status === "draft" && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteTarget(row)}
              >
                <HugeiconsIcon icon={Delete01Icon} className="size-3.5 mr-2" />
                Delete Run
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold font-sans">Payroll History</h2>
        <div className="flex gap-2">
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-28 h-7">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {distinctYears.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28 h-7">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredRuns}
        onRowClick={(row) => router.push(`/hr/payroll/${row._id}`)}
        emptyState={
          <EmptyState
            icon={MoneyReceiveSquareIcon}
            title="No payroll runs yet"
            description="Select a month above and run your first payroll."
          />
        }
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteTarget ? `${MONTH_NAMES[deleteTarget.month - 1]} ${deleteTarget.year}` : ""} payroll run?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {deleteTarget?.employeeCount ?? 0} draft payslips. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
