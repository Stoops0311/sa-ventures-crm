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
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { LEAD_STATUSES } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon, Calendar03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

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
  const [showCalendar, setShowCalendar] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const updateStatus = useMutation(api.leads.updateStatus)

  const handleSave = async () => {
    if (isSaving) return

    if (status === "Follow Up" && !followUpDate) {
      toast.error("Please select a follow-up date")
      return
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
    setShowCalendar(false)
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
      <PopoverContent className="w-80" align="start">
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
              <Label className="text-xs font-medium">Follow-up Date</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !followUpDate && "text-muted-foreground"
                    )}
                  >
                    <HugeiconsIcon
                      icon={Calendar03Icon}
                      strokeWidth={2}
                      className="size-4"
                    />
                    {followUpDate
                      ? format(followUpDate, "MMM d, yyyy")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={followUpDate}
                    onSelect={(date) => {
                      setFollowUpDate(date)
                      setShowCalendar(false)
                    }}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
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
