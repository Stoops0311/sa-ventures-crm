"use client"

import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { LEAD_STATUSES } from "@/lib/constants"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

export function LeadContextMenu({
  children,
  leadId,
  phone,
  onStatusChange,
  onReassign,
}: {
  children: React.ReactNode
  leadId: Id<"leads">
  phone: string
  onStatusChange?: () => void
  onReassign?: () => void
}) {
  const updateStatus = useMutation(api.leads.updateStatus)
  const reassign = useMutation(api.leads.reassign)
  const salespeople = useQuery(api.users.list, { role: "salesperson" })

  async function handleStatusChange(status: string) {
    try {
      await updateStatus({ leadId, status })
      toast.success(`Status changed to ${status}`)
      onStatusChange?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change status"
      )
    }
  }

  async function handleReassign(userId: Id<"users">) {
    try {
      await reassign({ leadId, newAssignedTo: userId })
      toast.success("Lead reassigned")
      onReassign?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reassign lead"
      )
    }
  }

  async function handleCopyPhone() {
    try {
      await navigator.clipboard.writeText(phone)
      toast.success("Phone copied to clipboard")
    } catch {
      toast.error("Failed to copy phone")
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Quick Status Change</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {LEAD_STATUSES.map((status) => (
              <ContextMenuItem
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
              >
                {status.label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>Reassign</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {(salespeople ?? []).map((sp) => (
              <ContextMenuItem
                key={sp._id}
                onClick={() => handleReassign(sp._id)}
              >
                {sp.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleCopyPhone}>
          Copy Phone
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
