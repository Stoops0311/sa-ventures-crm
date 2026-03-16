"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LEAD_STATUSES } from "@/lib/constants"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

export function BulkActionBar({
  selectedIds,
  onClearSelection,
}: {
  selectedIds: Set<string>
  onClearSelection: () => void
}) {
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const salespeople = useQuery(api.users.list, { role: "salesperson" })
  const bulkReassign = useMutation(api.leads.bulkReassign)
  const bulkUpdateStatus = useMutation(api.leads.bulkUpdateStatus)

  if (selectedIds.size === 0) return null

  const leadIds = Array.from(selectedIds) as Id<"leads">[]

  async function handleReassign() {
    if (!selectedSalesperson) return
    setIsSubmitting(true)
    try {
      await bulkReassign({
        leadIds,
        newAssignedTo: selectedSalesperson as Id<"users">,
      })
      toast.success(`${leadIds.length} leads reassigned`)
      onClearSelection()
      setReassignDialogOpen(false)
      setSelectedSalesperson("")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reassign leads"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleStatusChange() {
    if (!selectedStatus) return
    setIsSubmitting(true)
    try {
      await bulkUpdateStatus({
        leadIds,
        status: selectedStatus,
      })
      toast.success(`${leadIds.length} leads updated to ${selectedStatus}`)
      onClearSelection()
      setStatusDialogOpen(false)
      setSelectedStatus("")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update lead statuses"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
        <div className="flex items-center justify-between px-6 py-3 max-w-6xl mx-auto">
          <span className="text-xs font-medium">
            {selectedIds.size} lead{selectedIds.size > 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReassignDialogOpen(true)}
            >
              Reassign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusDialogOpen(true)}
            >
              Change Status
            </Button>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Cancel
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign {selectedIds.size} Leads</DialogTitle>
            <DialogDescription>
              Select a salesperson to reassign the selected leads to.
            </DialogDescription>
          </DialogHeader>
          <Select
            value={selectedSalesperson}
            onValueChange={setSelectedSalesperson}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select salesperson" />
            </SelectTrigger>
            <SelectContent>
              {(salespeople ?? []).map((sp) => (
                <SelectItem key={sp._id} value={sp._id}>
                  {sp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReassignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassign}
              disabled={!selectedSalesperson || isSubmitting}
            >
              {isSubmitting ? "Reassigning..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Change Status for {selectedIds.size} Leads
            </DialogTitle>
            <DialogDescription>
              Select the new status to apply to all selected leads.
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={!selectedStatus || isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
