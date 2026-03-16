"use client"

import { useState, useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { UserTable } from "@/components/users/user-table"
import { UserDialog } from "@/components/users/user-dialog"
import { InviteUserDialog } from "@/components/users/invite-user-dialog"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import { UserGroupIcon } from "@hugeicons/core-free-icons"
import { USER_ROLES } from "@/lib/constants"

interface UserData {
  _id: string
  name: string
  email?: string
  phone?: string
  role: string
  isAvailable: boolean
  imageUrl?: string
}

export default function UsersPage() {
  const [filterRole, setFilterRole] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<UserData | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)

  const users = useQuery(api.users.list, {
    role: filterRole === "all" ? undefined : filterRole,
  })
  const onlineUsers = useQuery(api.presence.getOnlineUsers)
  const trainingProgress = useQuery(api.trainingProgress.getAllDsmProgress)

  const presenceMap = useMemo(() => {
    const map = new Map<string, boolean>()
    if (onlineUsers) {
      for (const u of onlineUsers) {
        map.set(u.userId, true)
      }
    }
    return map
  }, [onlineUsers])

  function handleEdit(user: UserData) {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open)
    if (!open) {
      setSelectedUser(undefined)
    }
  }

  if (users === undefined) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-lg font-semibold">Manage Users</h1>
          <p className="text-xs text-muted-foreground">
            View and manage user roles and availability.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>Invite User</Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {USER_ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {users.length} user{users.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <EmptyState
              icon={UserGroupIcon}
              title="No users found"
              description={
                filterRole === "all"
                  ? "Users will appear here once you invite them."
                  : `No users with the "${filterRole}" role found.`
              }
              className="py-12"
            />
          ) : (
            <UserTable
              users={users as UserData[]}
              presenceMap={presenceMap}
              trainingProgress={trainingProgress ?? {}}
              onEdit={handleEdit}
            />
          )}
        </CardContent>
      </Card>

      <UserDialog
        user={selectedUser}
        open={dialogOpen}
        onOpenChange={handleDialogClose}
      />

      <InviteUserDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}
