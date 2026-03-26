"use client"

import { useState, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useCurrentUser } from "@/hooks/use-current-user"
import { StatusBadge } from "@/components/shared/status-badge"
import { TimeDisplay } from "@/components/shared/time-display"
import { LeadDetailSkeleton } from "@/components/shared/loading-skeleton"
import { RemarkInput } from "@/components/leads/remark-input"
import { RemarkTimeline } from "@/components/leads/remark-timeline"
import { StatusChangePopover } from "@/components/leads/status-change-popover"
import { SendMessageDialog } from "@/components/leads/send-message-dialog"
import { AutoSuggestBanner } from "@/components/leads/auto-suggest-banner"
import { MessageHistory } from "@/components/leads/message-history"
import { PhoneValidationBanner } from "@/components/leads/phone-validation-banner"
import { AfterSalesBanner } from "@/components/after-sales/after-sales-banner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DateTimePicker } from "@/components/shared/date-time-picker"
import { LEAD_SOURCES } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Copy01Icon,
  Calendar03Icon,
  ArrowDown01Icon,
  Comment01Icon,
  WhatsappIcon,
  Call02Icon,
  Mail01Icon,
  CameraAdd01Icon,
  Delete01Icon,
  Pdf01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export function LeadDetailContent({ leadId }: { leadId: string }) {
  const typedLeadId = leadId as Id<"leads">
  const { user } = useCurrentUser()
  const lead = useQuery(api.leads.getById, { leadId: typedLeadId })
  const project = useQuery(
    api.projects.getById,
    lead?.projectId ? { projectId: lead.projectId } : "skip"
  )

  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false)
  const [followUpCalendarOpen, setFollowUpCalendarOpen] = useState(false)
  const [photoSendDialogOpen, setPhotoSendDialogOpen] = useState(false)
  const [sendPhotoId, setSendPhotoId] = useState<string | null>(null)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  const remarkSectionRef = useRef<HTMLDivElement>(null)
  const addFollowUp = useMutation(api.leads.addFollowUp)

  // Visit photos
  const photos = useQuery(api.leadPhotos.listByLead, { leadId: typedLeadId })
  const generateUploadUrl = useMutation(api.leadPhotos.generateUploadUrl)
  const savePhoto = useMutation(api.leadPhotos.save)
  const removePhoto = useMutation(api.leadPhotos.remove)

  if (lead === undefined) {
    return <LeadDetailSkeleton />
  }

  if (lead === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Lead not found</p>
      </div>
    )
  }

  const sourceLabel =
    LEAD_SOURCES.find((s) => s.value === lead.source)?.label ?? lead.source

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.mobileNumber).then(() => {
      toast("Phone number copied")
    })
  }

  const scrollToRemarks = () => {
    remarkSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleScheduleFollowUp = async (date: Date | undefined) => {
    if (!date) return
    try {
      await addFollowUp({
        leadId: typedLeadId,
        followUpDate: date.getTime(),
      })
      toast("Follow-up scheduled")
      setFollowUpCalendarOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to schedule follow-up"
      )
    }
  }

  const canEdit =
    user?.role === "admin" ||
    (user?.role === "salesperson" &&
      lead.assignedTo?.toString() === user?._id?.toString())

  const handleUploadPhotos = async (files: FileList) => {
    if (!files.length) return
    setIsUploadingPhoto(true)
    try {
      for (const file of Array.from(files)) {
        const uploadUrl = await generateUploadUrl()
        const result = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        })
        if (!result.ok) throw new Error("Upload failed")
        const { storageId } = await result.json() as { storageId: string }
        await savePhoto({
          leadId: typedLeadId,
          storageId: storageId as Id<"_storage">,
          fileName: file.name,
          fileType: file.type,
        })
      }
      toast(`${files.length === 1 ? "Photo" : `${files.length} photos`} uploaded`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      await removePhoto({ photoId: photoId as Id<"leadPhotos"> })
      toast("Photo deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete photo")
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Lead Header - sticky */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-sans font-semibold leading-tight truncate">
            {lead.name}
          </h2>
          {canEdit ? (
            <StatusChangePopover
              leadId={typedLeadId}
              currentStatus={lead.status}
              trigger={
                <button className="cursor-pointer shrink-0 group flex items-center gap-1 hover:opacity-80 transition-opacity">
                  <StatusBadge status={lead.status} />
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    strokeWidth={2}
                    className="size-3 text-muted-foreground group-hover:text-foreground transition-colors"
                  />
                </button>
              }
            />
          ) : (
            <StatusBadge status={lead.status} />
          )}
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon
              icon={Call02Icon}
              strokeWidth={2}
              className="size-3.5 text-muted-foreground"
            />
            <a
              href={`tel:${lead.mobileNumber}`}
              className="text-foreground hover:underline underline-offset-2"
            >
              {lead.mobileNumber}
            </a>
            <button
              onClick={handleCopyPhone}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Copy phone number"
            >
              <HugeiconsIcon
                icon={Copy01Icon}
                strokeWidth={2}
                className="size-3"
              />
            </button>
          </div>
          {lead.email && (
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon
                icon={Mail01Icon}
                strokeWidth={2}
                className="size-3.5 text-muted-foreground"
              />
              <a
                href={`mailto:${lead.email}`}
                className="text-foreground hover:underline underline-offset-2"
              >
                {lead.email}
              </a>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {project && (
            <Badge variant="secondary" className="text-[10px]">
              {project.name}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {sourceLabel}
          </Badge>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* Quick Actions Bar */}
        {canEdit && (
          <div className="flex items-center gap-2 px-4 py-3 border-b">
            <Button variant="outline" size="sm" onClick={scrollToRemarks}>
              <HugeiconsIcon icon={Comment01Icon} strokeWidth={2} />
              Add Remark
            </Button>

            <Popover
              open={followUpCalendarOpen}
              onOpenChange={setFollowUpCalendarOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} />
                  Schedule Follow-up
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DateTimePicker
                  value={
                    lead.followUpDate
                      ? new Date(lead.followUpDate)
                      : undefined
                  }
                  onChange={handleScheduleFollowUp}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setWhatsappDialogOpen(true)}
            >
              <HugeiconsIcon icon={WhatsappIcon} strokeWidth={2} />
              WhatsApp
            </Button>
          </div>
        )}

        {/* Phone validation banner — shown to admin and salesperson */}
        <PhoneValidationBanner
          leadId={leadId}
          mobileNumber={lead.mobileNumber}
        />

        {/* Auto-suggest banners */}
        {canEdit && <AutoSuggestBanner leadId={leadId} />}

        {/* After-sales progress banner */}
        <AfterSalesBanner
          leadId={leadId}
          leadStatus={lead.status}
          canEdit={canEdit}
        />

        {/* Lead Details */}
        <div className="px-4 py-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-xs">
            {lead.budget && (
              <>
                <dt className="text-muted-foreground">Budget</dt>
                <dd className="font-medium">{lead.budget}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Source</dt>
            <dd>{sourceLabel}</dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd>
              <TimeDisplay timestamp={lead.createdAt} mode="relative" />
            </dd>
            <dt className="text-muted-foreground">Updated</dt>
            <dd>
              <TimeDisplay timestamp={lead.updatedAt} mode="relative" />
            </dd>
            {lead.followUpDate && (
              <>
                <dt className="text-muted-foreground">Follow-up</dt>
                <dd>
                  <TimeDisplay
                    timestamp={lead.followUpDate}
                    mode="follow-up"
                  />
                </dd>
              </>
            )}
            {lead.notes && (
              <>
                <dt className="text-muted-foreground">Notes</dt>
                <dd className="whitespace-pre-wrap break-words">
                  {lead.notes}
                </dd>
              </>
            )}
          </dl>
        </div>

        {/* Visit Photos */}
        {(photos && photos.length > 0 || canEdit) && (
          <div className="px-4 py-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-sans font-medium">Visit Photos</h3>
              {canEdit && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleUploadPhotos(e.target.files)}
                    disabled={isUploadingPhoto}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="pointer-events-none"
                    disabled={isUploadingPhoto}
                  >
                    <span className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={CameraAdd01Icon} strokeWidth={2} className="size-3.5" />
                      {isUploadingPhoto ? "Uploading..." : "Add Photo"}
                    </span>
                  </Button>
                </label>
              )}
            </div>
            {photos && photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {(photos as Array<{ _id: string; fileName: string; fileType: string; url: string | null; uploadedBy: string }>).map((photo) => (
                  <div key={photo._id} className="relative group">
                    {photo.fileType.startsWith("image/") ? (
                      <a href={photo.url ?? "#"} target="_blank" rel="noopener noreferrer">
                        <img
                          src={photo.url ?? ""}
                          alt={photo.fileName}
                          className="w-full aspect-square object-cover border bg-muted"
                        />
                      </a>
                    ) : (
                      <a
                        href={photo.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center aspect-square border bg-muted gap-1 hover:bg-muted/70 transition-colors p-2"
                      >
                        <HugeiconsIcon icon={Pdf01Icon} strokeWidth={1.5} className="size-6 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground text-center truncate w-full">
                          {photo.fileName}
                        </span>
                      </a>
                    )}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSendPhotoId(photo._id)
                          setPhotoSendDialogOpen(true)
                        }}
                        className="bg-background/90 border p-0.5 hover:bg-muted transition-colors"
                        title="Send via WhatsApp"
                      >
                        <HugeiconsIcon icon={WhatsappIcon} strokeWidth={2} className="size-3 text-green-600" />
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleDeletePhoto(photo._id)}
                          className="bg-background/90 border p-0.5 hover:bg-muted transition-colors"
                          title="Delete photo"
                        >
                          <HugeiconsIcon icon={Delete01Icon} strokeWidth={2} className="size-3 text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No photos yet</p>
            )}
          </div>
        )}

        {/* Send dialog opened from a visit photo */}
        {photoSendDialogOpen && (
          <SendMessageDialog
            leadId={leadId}
            leadName={lead.name}
            leadPhone={lead.mobileNumber}
            projectName={project?.name}
            assignedTo={lead.assignedTo?.toString() ?? ""}
            open={photoSendDialogOpen}
            onOpenChange={(open) => {
              setPhotoSendDialogOpen(open)
              if (!open) setSendPhotoId(null)
            }}
            initialAttachmentLeadPhotoId={sendPhotoId ?? undefined}
          />
        )}

        {/* Message History */}
        <MessageHistory leadId={leadId} />

        {/* Activity / Remarks — below lead details */}
        <div ref={remarkSectionRef} className="px-4 py-4 border-t space-y-4">
          <h3 className="text-sm font-sans font-medium">Activity</h3>

          {canEdit && (
            <RemarkInput leadId={typedLeadId} />
          )}

          <RemarkTimeline leadId={typedLeadId} />
        </div>
      </div>

      {/* Send Message Dialog */}
      <SendMessageDialog
        open={whatsappDialogOpen}
        onOpenChange={setWhatsappDialogOpen}
        leadId={leadId}
        leadName={lead.name}
        leadPhone={lead.mobileNumber}
        projectName={project?.name}
        assignedTo={lead.assignedTo}
      />
    </div>
  )
}
