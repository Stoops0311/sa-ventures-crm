"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AfterSalesStatusBadge } from "@/components/after-sales/after-sales-status-badge"
import { AfterSalesProcessDialog } from "@/components/after-sales/after-sales-process-dialog"
import { getRelativeTime } from "@/lib/date-utils"
import { getAfterSalesStepStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"

export default function AdminAfterSalesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [assignedToFilter, setAssignedToFilter] = useState<string>("all")

  const stats = useQuery(api.afterSales.getStats)
  const processes = useQuery(api.afterSales.listAll, {
    status: statusFilter === "all" ? undefined : statusFilter,
    assignedTo:
      assignedToFilter === "all"
        ? undefined
        : (assignedToFilter as Id<"users">),
  })
  const users = useQuery(api.users.list, {})

  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(
    null
  )
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleRowClick = (processId: string) => {
    setSelectedProcessId(processId)
    setDialogOpen(true)
  }

  const salespeople = (users ?? []).filter(
    (u) => u.role === "salesperson" || u.role === "admin"
  )

  const fiveDaysMs = 5 * 24 * 60 * 60 * 1000
  const now = Date.now()

  return (
    <div className="space-y-6">
      <h1 className="font-sans text-lg font-semibold">After Sales</h1>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Active
              </p>
              <p className="text-2xl font-mono font-bold">
                {stats.inProgress}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                On Hold
              </p>
              <p className="text-2xl font-mono font-bold">{stats.onHold}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Stale (&gt;5d)
              </p>
              <p className="text-2xl font-mono font-bold text-destructive">
                {stats.stale}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Completed
              </p>
              <p className="text-2xl font-mono font-bold text-green-600">
                {stats.completed}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <SelectValue placeholder="Salesperson" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Salespeople</SelectItem>
            {salespeople.map((u) => (
              <SelectItem key={u._id} value={u._id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Customer</TableHead>
              <TableHead className="text-xs">Phone</TableHead>
              <TableHead className="text-xs">Project</TableHead>
              <TableHead className="text-xs">Salesperson</TableHead>
              <TableHead className="text-xs">Progress</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {processes === undefined ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-xs py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : processes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-xs text-muted-foreground py-8"
                >
                  No after-sales processes found
                </TableCell>
              </TableRow>
            ) : (
              processes.map((p) => {
                const isStale = now - p.updatedAt > fiveDaysMs
                const stepStyle = getAfterSalesStepStyle(p.currentStep)

                return (
                  <TableRow
                    key={p._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(p._id)}
                  >
                    <TableCell className="text-xs font-medium">
                      {p.leadName}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {p.leadPhone}
                    </TableCell>
                    <TableCell className="text-xs">{p.projectName}</TableCell>
                    <TableCell className="text-xs">
                      {p.assignedUserName}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-mono">
                        {p.completedCount}/{p.totalSteps}
                      </span>{" "}
                      <span
                        className={cn(
                          "text-[10px]",
                          stepStyle.text
                        )}
                      >
                        {stepStyle.shortLabel}
                      </span>
                    </TableCell>
                    <TableCell>
                      <AfterSalesStatusBadge status={p.status} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-xs",
                        isStale && "text-destructive font-medium"
                      )}
                    >
                      {getRelativeTime(p.updatedAt)}
                      {isStale && " ⚠"}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AfterSalesProcessDialog
        processId={selectedProcessId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
