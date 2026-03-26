"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DateTimePicker } from "@/components/shared/date-time-picker"
import { Label } from "@/components/ui/label"
import { LEAD_STATUSES, VISIT_LOCATION_STYLES } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export function StatusChangePopover({
  leadId,
  currentStatus,
  trigger,
}: {
  leadId: Id<"leads">
  currentStatus: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [remark, setRemark] = useState("")
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined)
  const [visitLocation, setVisitLocation] = useState<string>("")
  const [visitDate, setVisitDate] = useState<Date | undefined>(undefined)
  const [visitAddress, setVisitAddress] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const updateStatus = useMutation(api.leads.updateStatus)

  const needsExpanded = status === "Follow Up" || status === "Visit Scheduled"

  const handleSave = async () => {
    if (isSaving) return

    if (status === "Follow Up" && !followUpDate) {
      toast.error("Please select a follow-up date")
      return
    }

    if (status === "Visit Scheduled") {
      if (!visitLocation) {
        toast.error("Please select a visit location")
        return
      }
      if (!visitDate) {
        toast.error("Please select a visit date & time")
        return
      }
    }

    setIsSaving(true)
    try {
      await updateStatus({
        leadId,
        status,
        remark: remark.trim() || undefined,
        followUpDate:
          status === "Follow Up" && followUpDate
            ? followUpDate.getTime()
            : undefined,
        visitLocation:
          status === "Visit Scheduled" ? visitLocation : undefined,
        visitDate:
          status === "Visit Scheduled" && visitDate
            ? visitDate.getTime()
            : undefined,
        visitAddress:
          status === "Visit Scheduled" && visitAddress.trim()
            ? visitAddress.trim()
            : undefined,
      })
      toast("Status updated")
      setOpen(false)
      resetForm()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update status"
      )
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setRemark("")
    setFollowUpDate(undefined)
    setVisitLocation("")
    setVisitDate(undefined)
    setVisitAddress("")
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      setStatus(currentStatus)
      resetForm()
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className={needsExpanded ? "w-[340px]" : "w-80"} align="start">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Remark{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add a remark..."
              rows={2}
              className="min-h-[3rem] max-h-[6rem] resize-none"
            />
          </div>

          {status === "Follow Up" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Follow-up Date & Time</Label>
              <DateTimePicker
                value={followUpDate}
                onChange={setFollowUpDate}
              />
            </div>
          )}

          {status === "Visit Scheduled" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Visit Location</Label>
                <Select value={visitLocation} onValueChange={setVisitLocation}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIT_LOCATION_STYLES.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Visit Date & Time</Label>
                <DateTimePicker
                  value={visitDate}
                  onChange={setVisitDate}
                />
              </div>

              {visitLocation === "other" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Address{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    value={visitAddress}
                    onChange={(e) => setVisitAddress(e.target.value)}
                    placeholder="Enter address..."
                  />
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || status === currentStatus}
              className="flex-1"
            >
              {isSaving && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="animate-spin"
                />
              )}
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
