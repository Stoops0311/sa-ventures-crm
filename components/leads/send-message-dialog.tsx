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
import { DateTimePicker } from "@/components/shared/date-time-picker"
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
  Attachment01Icon,
  Cancel01Icon,
  Pdf01Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons"
import { format } from "date-fns"
import { toast } from "sonner"

interface SendMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
  leadName: string
  leadPhone: string
  projectName?: string
  assignedTo: string
  initialAttachmentLeadPhotoId?: string
  initialAttachmentCreativeId?: string
}

export function SendMessageDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  leadPhone,
  projectName,
  assignedTo,
  initialAttachmentLeadPhotoId,
  initialAttachmentCreativeId,
}: SendMessageDialogProps) {
  const typedLeadId = leadId as Id<"leads">
  const typedAssignedTo = assignedTo as Id<"users">
  const templates = useQuery(api.messageTemplates.list, { isActive: true })
  const waSession = useQuery(api.whatsappSessions.getSessionByUserId, { userId: typedAssignedTo })
  const assignedUser = useQuery(api.users.getById, { userId: typedAssignedTo })
  const smsDevice = useQuery(api.whatsappSessions.getSmsDevice)
  const createMessage = useMutation(api.messaging.create)

  // Fetch lead to get projectId
  const lead = useQuery(api.leads.getById, { leadId: typedLeadId })

  // Attachment data
  const projectCreatives = useQuery(
    api.projectCreatives.listByProject,
    lead?.projectId ? { projectId: lead.projectId } : "skip"
  )
  const leadPhotos = useQuery(api.leadPhotos.listByLead, { leadId: typedLeadId })

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [language, setLanguage] = useState<"en" | "hi">("en")
  const [message, setMessage] = useState("")
  const [mode, setMode] = useState<"now" | "schedule">("now")
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>()
  const [scheduleCalendarOpen, setScheduleCalendarOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [showAttachments, setShowAttachments] = useState(!!initialAttachmentLeadPhotoId || !!initialAttachmentCreativeId)

  // Attachment selection: { type: "creative" | "photo", id: string }
  const [attachment, setAttachment] = useState<{ type: "creative" | "photo"; id: string; name: string } | null>(
    initialAttachmentLeadPhotoId
      ? { type: "photo", id: initialAttachmentLeadPhotoId, name: "" }
      : initialAttachmentCreativeId
      ? { type: "creative", id: initialAttachmentCreativeId, name: "" }
      : null
  )

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
        attachedCreativeId:
          attachment?.type === "creative"
            ? (attachment.id as Id<"projectCreatives">)
            : undefined,
        attachedLeadPhotoId:
          attachment?.type === "photo"
            ? (attachment.id as Id<"leadPhotos">)
            : undefined,
      })

      toast(mode === "schedule" ? "Message scheduled" : "Message sent")
      onOpenChange(false)
      // Reset
      setSelectedTemplateId("")
      setMessage("")
      setMode("now")
      setScheduleDate(undefined)
      setAttachment(null)
      setShowAttachments(false)
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

          {/* Attach File */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAttachments(!showAttachments)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={Attachment01Icon} strokeWidth={2} className="size-3.5" />
              {attachment ? "Change attachment" : "Attach project file or photo"}
            </button>

            {attachment && (
              <div className="flex items-center gap-2 p-2 border bg-muted/30 text-xs">
                <HugeiconsIcon
                  icon={attachment.name.toLowerCase().endsWith(".pdf") ? Pdf01Icon : Image01Icon}
                  strokeWidth={1.5}
                  className="size-4 text-muted-foreground shrink-0"
                />
                <span className="truncate flex-1">{attachment.name || "Selected file"}</span>
                <Badge variant="secondary" className="text-[9px] shrink-0">WhatsApp only</Badge>
                <button
                  onClick={() => setAttachment(null)}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3" />
                </button>
              </div>
            )}

            {showAttachments && (
              <div className="border p-2 space-y-2 max-h-40 overflow-y-auto">
                {/* Project Files */}
                {projectCreatives && projectCreatives.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                      Project Files
                    </p>
                    <div className="space-y-0.5">
                      {(projectCreatives as Array<{ _id: string; fileName: string; fileType: string; url: string | null }>).map((c) => (
                        <button
                          key={c._id}
                          onClick={() => {
                            setAttachment({ type: "creative", id: c._id, name: c.fileName })
                            setShowAttachments(false)
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1 text-xs text-left hover:bg-muted transition-colors ${
                            attachment?.id === c._id ? "bg-muted font-medium" : ""
                          }`}
                        >
                          <HugeiconsIcon
                            icon={c.fileType.startsWith("image/") ? Image01Icon : Pdf01Icon}
                            strokeWidth={1.5}
                            className="size-3.5 text-muted-foreground shrink-0"
                          />
                          <span className="truncate">{c.fileName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visit Photos */}
                {leadPhotos && (leadPhotos as Array<{ _id: string; fileName: string; fileType: string; url: string | null }>).length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                      Visit Photos
                    </p>
                    <div className="space-y-0.5">
                      {(leadPhotos as Array<{ _id: string; fileName: string; fileType: string; url: string | null }>).map((p) => (
                        <button
                          key={p._id}
                          onClick={() => {
                            setAttachment({ type: "photo", id: p._id, name: p.fileName })
                            setShowAttachments(false)
                          }}
                          className={`w-full flex items-center gap-2 px-2 py-1 text-xs text-left hover:bg-muted transition-colors ${
                            attachment?.id === p._id ? "bg-muted font-medium" : ""
                          }`}
                        >
                          <HugeiconsIcon
                            icon={p.fileType.startsWith("image/") ? Image01Icon : Pdf01Icon}
                            strokeWidth={1.5}
                            className="size-3.5 text-muted-foreground shrink-0"
                          />
                          <span className="truncate">{p.fileName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(!projectCreatives || projectCreatives.length === 0) &&
                 (!leadPhotos || (leadPhotos as Array<unknown>).length === 0) && (
                  <p className="text-[10px] text-muted-foreground">No files available</p>
                )}
              </div>
            )}
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
                      ? format(scheduleDate, "MMM d, h:mm a")
                      : "Pick date & time"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <DateTimePicker
                    value={scheduleDate}
                    onChange={(date) => setScheduleDate(date)}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {attachment ? "WhatsApp only (SMS skipped — media)" : "WhatsApp + SMS"}
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
