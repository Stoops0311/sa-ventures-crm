"use client"

import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TimeDisplay } from "@/components/shared/time-display"
import { HugeiconsIcon } from "@hugeicons/react"
import { WhatsappIcon, Delete02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export function WhatsAppSessionsOverview() {
  const sessions = useQuery(api.whatsappSessions.listAll)
  const deleteSession = useMutation(api.whatsappSessions.deleteSession)

  const handleDisconnect = async (sessionId: string) => {
    try {
      await deleteSession({ sessionId: sessionId as any })
      toast("Session disconnected")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect"
      )
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">WhatsApp Sessions</h3>
        <p className="text-xs text-muted-foreground">
          All salesperson WhatsApp connections across the CRM
        </p>
      </div>

      {sessions?.length === 0 && (
        <p className="text-sm text-muted-foreground py-4">
          No WhatsApp sessions connected yet. Salespeople can connect from their
          dashboard.
        </p>
      )}

      <div className="space-y-2">
        {sessions?.map((session) => (
          <div
            key={session._id}
            className="border p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`size-8 flex items-center justify-center ${
                  session.status === "connected"
                    ? "bg-green-50"
                    : "bg-gray-100"
                }`}
              >
                <HugeiconsIcon
                  icon={WhatsappIcon}
                  strokeWidth={2}
                  className={`size-4 ${
                    session.status === "connected"
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium">{session.userName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      session.status === "connected"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {session.status}
                  </Badge>
                  {session.phone && (
                    <span className="font-mono">{session.phone}</span>
                  )}
                  <TimeDisplay timestamp={session.updatedAt} mode="relative" />
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDisconnect(session._id)}
              className="text-destructive text-xs"
            >
              <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              Disconnect
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
