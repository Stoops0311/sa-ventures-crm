"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { LEAD_STATUSES } from "@/lib/constants"
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
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

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
  const [saving, setSaving] = useState(false)

  const updateStatus = useMutation(api.leads.updateStatus)

  async function handleSave() {
    if (status === "Follow Up" && !followUpDate) {
      toast.error("Please select a follow-up date")
      return
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
      })
      toast.success("Lead updated")
      setOpen(false)
      setRemark("")
      setFollowUpDate(undefined)
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
      <PopoverContent align="end" className="w-80 space-y-3">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left",
                    !followUpDate && "text-muted-foreground"
                  )}
                >
                  {followUpDate
                    ? followUpDate.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={followUpDate}
                  onSelect={setFollowUpDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>
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
