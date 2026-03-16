"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PresenceDot } from "@/components/shared/presence-dot"
import { Badge } from "@/components/ui/badge"
import { getRoleStyle } from "@/lib/constants"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function WhosOnline() {
  const onlineUsers = useQuery(api.presence.getOnlineUsers)
  const allUsers = useQuery(api.users.list, {})

  const isLoading = onlineUsers === undefined || allUsers === undefined

  // Build a set of online user IDs
  const onlineIds = new Set(
    (onlineUsers ?? []).map((u) => u.userId.toString())
  )

  // Create merged list with online status, sorted online first
  const users = (allUsers ?? [])
    .map((u) => ({
      ...u,
      isOnline: onlineIds.has(u._id.toString()),
      lastSeen: (onlineUsers ?? []).find(
        (ou) => ou.userId.toString() === u._id.toString()
      )?.lastSeen,
    }))
    .sort((a, b) => {
      if (a.isOnline && !b.isOnline) return -1
      if (!a.isOnline && b.isOnline) return 1
      return 0
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Who&apos;s Online</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="size-2.5 rounded-full" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            No users found
          </p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => {
              const roleStyle = getRoleStyle(user.role)
              return (
                <div
                  key={user._id}
                  className="flex items-center gap-2"
                >
                  <PresenceDot
                    isOnline={user.isOnline}
                    lastSeen={user.lastSeen}
                    size="sm"
                  />
                  <span
                    className={cn(
                      "text-xs truncate flex-1",
                      !user.isOnline && "text-muted-foreground"
                    )}
                  >
                    {user.name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-1.5 py-0",
                      roleStyle.bg,
                      roleStyle.text,
                      roleStyle.border
                    )}
                  >
                    {roleStyle.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
