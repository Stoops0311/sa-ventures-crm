"use client"

import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreVerticalCircle01Icon, Edit02Icon, UserRemove02Icon } from "@hugeicons/core-free-icons"
import { PresenceDot } from "@/components/shared/presence-dot"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { getRoleStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface UserData {
  _id: string
  name: string
  email?: string
  phone?: string
  role: string
  isAvailable: boolean
  imageUrl?: string
}

interface UserTableProps {
  users: UserData[]
  presenceMap: Map<string, boolean>
  trainingProgress?: Record<string, number>
  onEdit: (user: UserData) => void
}

export function UserTable({ users, presenceMap, trainingProgress, onEdit }: UserTableProps) {
  const toggleAvailability = useMutation(api.users.toggleAvailability)

  async function handleToggleAvailability(userId: string) {
    try {
      await toggleAvailability({ userId: userId as Id<"users"> })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle availability")
    }
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Training</TableHead>
            <TableHead>Available</TableHead>
            <TableHead className="w-10">Status</TableHead>
            <TableHead className="w-10">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const roleStyle = getRoleStyle(user.role)
            const isOnline = presenceMap.get(user._id) ?? false

            return (
              <TableRow key={user._id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center border text-xs font-medium",
                        "bg-muted text-muted-foreground"
                      )}
                    >
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email ?? "--"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.phone ?? "--"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      roleStyle.bg,
                      roleStyle.text,
                      roleStyle.border
                    )}
                  >
                    {roleStyle.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.role === "dsm" ? (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {trainingProgress?.[user._id] ?? 0}/7
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">--</span>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    size="sm"
                    checked={user.isAvailable}
                    onCheckedChange={() => handleToggleAvailability(user._id)}
                  />
                </TableCell>
                <TableCell>
                  <PresenceDot isOnline={isOnline} size="sm" />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-xs">
                        <HugeiconsIcon icon={MoreVerticalCircle01Icon} strokeWidth={2} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
                        Edit
                      </DropdownMenuItem>
                      <ConfirmDialog
                        trigger={
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={(e) => e.preventDefault()}
                          >
                            <HugeiconsIcon icon={UserRemove02Icon} strokeWidth={2} />
                            Deactivate
                          </DropdownMenuItem>
                        }
                        title="Deactivate User"
                        description={`Are you sure you want to deactivate ${user.name}? They will no longer be able to access the CRM.`}
                        confirmLabel="Deactivate"
                        variant="destructive"
                        onConfirm={() => handleToggleAvailability(user._id)}
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
