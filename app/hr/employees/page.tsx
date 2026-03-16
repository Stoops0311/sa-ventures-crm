"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, UserMultipleIcon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EmployeeTable } from "@/components/hr/employees/employee-table"
import { EmptyState } from "@/components/shared/empty-state"
import { useDebounce } from "@/hooks/use-debounce"

export default function EmployeeDirectoryPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  const debouncedSearch = useDebounce(search, 300)

  const employees = useQuery(api.employeeProfiles.listAll, {
    search: debouncedSearch || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
    onboardingStatus: statusFilter !== "all" ? statusFilter : undefined,
    department: departmentFilter !== "all" ? departmentFilter : undefined,
  })

  const departments = employees
    ? [...new Set(employees.map((e) => e.department).filter(Boolean))]
    : []

  const hasFilters =
    debouncedSearch || roleFilter !== "all" || statusFilter !== "all" || departmentFilter !== "all"

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            strokeWidth={2}
          />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="salesperson">Salesperson</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        {departments.length > 0 && (
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept!}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {employees?.length ?? 0} employees
        </span>
      </div>

      {/* Table */}
      <EmployeeTable
        data={employees}
        emptyState={
          hasFilters ? (
            <EmptyState
              icon={Search01Icon}
              title="No employees match your filters"
              description="Try adjusting your search or filters"
              action={{
                label: "Clear all filters",
                onClick: () => {
                  setSearch("")
                  setRoleFilter("all")
                  setStatusFilter("all")
                  setDepartmentFilter("all")
                },
              }}
            />
          ) : (
            <EmptyState
              icon={UserMultipleIcon}
              title="No employee profiles yet"
              description="Employee profiles are created automatically when users are assigned non-DSM roles in User Management."
              action={{
                label: "Go to User Management",
                onClick: () => router.push("/admin/users"),
              }}
            />
          )
        }
      />
    </div>
  )
}
