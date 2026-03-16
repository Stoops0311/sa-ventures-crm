"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { isPhoneValid } from "@/lib/phone-utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SentIcon,
  Calendar03Icon,
  WhatsappIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface SendMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadName: string
  leadPhone: string
  projectName?: string
  assignedTo: string
}

export function SendMessageDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadPhone,
  projectName,
  assignedTo,
}: SendMessageDialogProps) {
  const typedLeadId = leadId as Id<"leads">
  const typedAssignedTo = assignedTo as Id<"users">
  const templates = useQuery(api.messageTemplates.list, { isActive: true })
  const waSession = useQuery(api.whatsappSessions.getSessionByUserId, { userId: typedAssignedTo })
  const assignedUser = useQuery(api.users.getById, { userId: typedAssignedTo })
  const smsDevice = useQuery(api.whatsappSessions.getSmsDevice)
  const createMessage = useMutation(api.messaging.create)

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const [message, setMessage] = useState("")
  const [mode, setMode] = useState<"now" | "schedule">("now")
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>()
  const [scheduleCalendarOpen, setScheduleCalendarOpen] = useState(false)
  const [sending, setSending] = useState(false)

  // Resolve template when selection or language changes
  useEffect(() => {
    if (!selectedTemplateId || selectedTemplateId === "freeform") {
      return
    }
    const template = templates?.find((t) => t._id === selectedTemplateId)
    if (template) {
      const body = language === "hi" ? template.bodyHi : template.bodyEn
      const resolved = body
        .replace(/\{\{leadName\}\}/g, leadName)
        .replace(/\{\{projectName\}\}/g, projectName ?? "")
        .replace(/\{\{companyName\}\}/g, "SA Ventures")
      setMessage(resolved)
    }
  }, [selectedTemplateId, language, templates, leadName, projectName])

  const handleTemplateChange = (value: string) => {
    setSelectedTemplateId(value)
    if (value === "freeform") {
      setMessage("")
    }
  }

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Message cannot be empty")
      return
    }

    setSending(true)
    try {
      const scheduledAt =
        mode === "schedule" && scheduleDate
          ? scheduleDate.getTime()
          : Date.now()

      await createMessage({
        leadId: typedLeadId,
        templateId:
          selectedTemplateId && selectedTemplateId !== "freeform"
            ? (selectedTemplateId as Id<"messageTemplates">)
            : undefined,
        message: message.trim(),
        language,
        scheduledAt,
        channels: "both",
        triggerType: "manual",
      })

      toast(mode === "schedule" ? "Message scheduled" : "Message sent")
      onOpenChange(false)
      // Reset
      setSelectedTemplateId("")
      setMessage("")
      setMode("now")
      setScheduleDate(undefined)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      )
    } finally {
      setSending(false)
    }
  }

  const waConnected = waSession?.status === "connected"
  const smsOnline = smsDevice?.status === "online"
  const phoneValid = isPhoneValid(leadPhone)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send to {leadName} ({leadPhone})
          </DialogDescription>
        </DialogHeader>

        {!phoneValid && (
          <div className="border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800">
            This lead's phone number is invalid for messaging. Please fix it
            from the lead detail view before sending.
          </div>
        )}

        <div className="space-y-4">
          {/* Channel status */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={WhatsappIcon} strokeWidth={2} className="size-3.5" />
              <span className={waConnected ? "text-green-600" : "text-red-500"}>
                {waConnected
                  ? `via ${assignedUser?.name ?? "Salesperson"}'s WhatsApp`
                  : `${assignedUser?.name ?? "Salesperson"}'s WhatsApp Not Connected`}
              </span>
              <span className={`size-1.5 rounded-full ${waConnected ? "bg-green-500" : "bg-red-400"}`} />
            </div>
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} className="size-3.5" />
              <span className={smsOnline ? "text-green-600" : "text-muted-foreground"}>
                SMS {smsOnline ? "Online" : "Offline"}
              </span>
              <span className={`size-1.5 rounded-full ${smsOnline ? "bg-green-500" : "bg-gray-300"}`} />
            </div>
          </div>

          {/* Template picker */}
          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template or write freeform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="freeform">Write custom message</SelectItem>
                {templates?.map((t) => (
                  <SelectItem key={t._id} value={t._id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Language toggle */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Language:</Label>
            <div className="flex gap-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 text-xs border transition-colors ${
                  language === "en"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("hi")}
                className={`px-2 py-0.5 text-xs border transition-colors ${
                  language === "hi"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                Hindi
              </button>
            </div>
          </div>

          {/* Message textarea */}
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={5}
              readOnly={
                !!selectedTemplateId && selectedTemplateId !== "freeform"
              }
              className={
                selectedTemplateId && selectedTemplateId !== "freeform"
                  ? "bg-muted"
                  : ""
              }
            />
          </div>

          {/* Send mode */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <button
                onClick={() => setMode("now")}
                className={`px-2.5 py-1 text-xs border transition-colors ${
                  mode === "now"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                Send Now
              </button>
              <button
                onClick={() => setMode("schedule")}
                className={`px-2.5 py-1 text-xs border transition-colors ${
                  mode === "schedule"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                Schedule
              </button>
            </div>

            {mode === "schedule" && (
              <Popover
                open={scheduleCalendarOpen}
                onOpenChange={setScheduleCalendarOpen}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
                    {scheduleDate
                      ? scheduleDate.toLocaleDateString()
                      : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={(date) => {
                      setScheduleDate(date)
                      setScheduleCalendarOpen(false)
                    }}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              WhatsApp + SMS
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              sending ||
              !message.trim() ||
              (mode === "schedule" && !scheduleDate) ||
              !isPhoneValid(leadPhone)
            }
          >
            <HugeiconsIcon
              icon={mode === "schedule" ? Calendar03Icon : SentIcon}
              strokeWidth={2}
            />
            {sending
              ? "Sending..."
              : mode === "schedule"
                ? "Schedule"
                : "Send Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
