"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { LEAD_STATUSES, VISIT_LOCATION_STYLES } from "@/lib/constants"
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
import { Label } from "@/components/ui/label"
import { DateTimePicker } from "@/components/shared/date-time-picker"

export function QuickUpdatePopover({
  leadId,
  currentStatus,
  children,
}: {
  leadId: Id<"leads">
  currentStatus: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [remark, setRemark] = useState("")
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined)
  const [visitLocation, setVisitLocation] = useState<string>("")
  const [visitDate, setVisitDate] = useState<Date | undefined>(undefined)
  const [visitAddress, setVisitAddress] = useState("")
  const [saving, setSaving] = useState(false)

  const updateStatus = useMutation(api.leads.updateStatus)

  const needsExpanded = status === "Follow Up" || status === "Visit Scheduled"

  async function handleSave() {
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

    setSaving(true)
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
      toast.success("Lead updated")
      setOpen(false)
      setRemark("")
      setFollowUpDate(undefined)
      setVisitLocation("")
      setVisitDate(undefined)
      setVisitAddress("")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update lead"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className={`${needsExpanded ? "w-[340px]" : "w-80"} space-y-3`}>
        <div className="space-y-1.5">
          <Label>Status</Label>
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
          <Label>Remark</Label>
          <Textarea
            rows={2}
            placeholder="Add a quick note..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </div>

        {status === "Follow Up" && (
          <div className="space-y-1.5">
            <Label>Next Follow-up</Label>
            <DateTimePicker
              value={followUpDate}
              onChange={setFollowUpDate}
            />
          </div>
        )}

        {status === "Visit Scheduled" && (
          <>
            <div className="space-y-1.5">
              <Label>Visit Location</Label>
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
              <Label>Visit Date & Time</Label>
              <DateTimePicker
                value={visitDate}
                onChange={setVisitDate}
              />
            </div>

            {visitLocation === "other" && (
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input
                  value={visitAddress}
                  onChange={(e) => setVisitAddress(e.target.value)}
                  placeholder="Enter address..."
                />
              </div>
            )}
          </>
        )}

        <Button
          className="w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
