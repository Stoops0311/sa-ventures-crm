"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  Download04Icon,
  Delete02Icon,
  FileUploadIcon,
} from "@hugeicons/core-free-icons"
import { EnrollmentStatusBadge } from "./enrollment-status-badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getRelativeTime } from "@/lib/date-utils"
import { formatINR } from "@/lib/currency"

export function EnrollmentDetailSheet({
  enrollmentId,
  open,
  onOpenChange,
}: {
  enrollmentId: Id<"insuranceEnrollments"> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0">
        {enrollmentId ? (
          <EnrollmentDetailContent enrollmentId={enrollmentId} />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function EnrollmentDetailContent({
  enrollmentId,
}: {
  enrollmentId: Id<"insuranceEnrollments">
}) {
  const allEnrollments = useQuery(api.insurance.listAll, {})
  const enrollment = allEnrollments?.find((e) => e._id === enrollmentId)
  const documents = useQuery(api.insurance.listDocuments, { enrollmentId })

  const updateTracker = useMutation(api.insurance.updateTracker)
  const uploadDocument = useMutation(api.insurance.uploadDocument)
  const removeDocument = useMutation(api.insurance.removeDocument)
  const generateUploadUrl = useMutation(api.insurance.generateUploadUrl)

  const [policyNumber, setPolicyNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [renewalReminderDate, setRenewalReminderDate] = useState("")
  const [status, setStatus] = useState("")
  const [trackerDirty, setTrackerDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteDoc, setDeleteDoc] = useState<{ id: Id<"insuranceDocuments">; name: string } | null>(null)

  // Initialize tracker fields when enrollment loads
  const [initialized, setInitialized] = useState(false)
  if (enrollment && !initialized) {
    setPolicyNumber(enrollment.policyNumber ?? "")
    setExpiryDate(enrollment.expiryDate ?? "")
    setRenewalReminderDate(enrollment.renewalReminderDate ?? "")
    setStatus(enrollment.status)
    setInitialized(true)
  }

  if (!enrollment) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  function handleTrackerChange(field: string, value: string) {
    setTrackerDirty(true)
    if (field === "policyNumber") setPolicyNumber(value)
    if (field === "expiryDate") setExpiryDate(value)
    if (field === "renewalReminderDate") setRenewalReminderDate(value)
    if (field === "status") setStatus(value)
  }

  async function handleSaveTracker() {
    setSaving(true)
    try {
      await updateTracker({
        enrollmentId,
        policyNumber: policyNumber || undefined,
        expiryDate: expiryDate || undefined,
        renewalReminderDate: renewalReminderDate || undefined,
        status: status || undefined,
      })
      setTrackerDirty(false)
      toast.success("Insurance tracker updated")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update tracker")
    } finally {
      setSaving(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      const { storageId } = (await result.json()) as { storageId: Id<"_storage"> }
      await uploadDocument({
        enrollmentId,
        storageId,
        fileName: file.name,
        fileType: file.type,
      })
      toast.success("Document uploaded successfully")
    } catch (err) {
      toast.error("Failed to upload document")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function handleDeleteDoc() {
    if (!deleteDoc) return
    try {
      await removeDocument({ documentId: deleteDoc.id })
      toast.success("Document deleted")
    } catch {
      toast.error("Failed to delete document")
    }
    setDeleteDoc(null)
  }

  const dependents = enrollment.dependents ? JSON.parse(enrollment.dependents) as { name: string; relation: string; dob: string }[] : []

  return (
    <>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <SheetTitle className="font-sans text-xl font-bold">
              {enrollment.employeeName}
            </SheetTitle>
            <EnrollmentStatusBadge status={enrollment.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Submitted {getRelativeTime(enrollment.createdAt)}
          </p>
        </SheetHeader>
      </div>

      <ScrollArea className="h-[calc(100vh-5rem)]">
        <div className="p-6 space-y-6">
          {/* Tracker Fields */}
          <div className="bg-muted/30 p-4 border space-y-4">
            <h3 className="font-sans text-base font-semibold">Policy Tracker</h3>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Policy Number</Label>
                <Input
                  placeholder="Enter policy number"
                  value={policyNumber}
                  onChange={(e) => handleTrackerChange("policyNumber", e.target.value)}
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="text-xs">Expiry Date</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => handleTrackerChange("expiryDate", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Renewal Reminder Date</Label>
                <Input
                  type="date"
                  value={renewalReminderDate}
                  onChange={(e) => handleTrackerChange("renewalReminderDate", e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You will see an alert this many days before expiry
                </p>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={status} onValueChange={(v) => handleTrackerChange("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="renewed">Renewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              size="sm"
              disabled={!trackerDirty || saving}
              onClick={handleSaveTracker}
              className="transition-opacity duration-200"
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {/* Enrollment Details (read-only) */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 hover:bg-muted/50 transition-colors">
              <h3 className="font-sans text-base font-semibold">Enrollment Details</h3>
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Nominee Name" value={enrollment.nomineeName} />
                <DetailItem label="Nominee Relation" value={enrollment.nomineeRelation} />
                <DetailItem label="Nominee DOB" value={enrollment.nomineeDob} />
                <DetailItem
                  label="Existing Conditions"
                  value={enrollment.existingConditions ? "Yes" : "No"}
                />
                <DetailItem
                  label="Pre-existing Details"
                  value={enrollment.preExistingDetails ?? "--"}
                />
                <DetailItem
                  label="Preferred Hospital"
                  value={enrollment.preferredHospital ?? "--"}
                />
                <DetailItem
                  label="Sum Insured Preference"
                  value={enrollment.sumInsured ? formatINR(enrollment.sumInsured) : "--"}
                />
              </div>

              {dependents.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                    Dependents ({dependents.length})
                  </p>
                  <div className="space-y-1">
                    {dependents.map((dep, i) => (
                      <div key={i} className="flex justify-between text-sm py-1 border-b last:border-0">
                        <span className="font-mono">{dep.name}</span>
                        <span className="text-muted-foreground">{dep.relation}</span>
                        <span className="text-muted-foreground font-mono">{dep.dob}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {dependents.length === 0 && (
                <p className="text-sm text-muted-foreground mt-4">No dependents listed</p>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Documents */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-base font-semibold">
                Documents
                {documents && documents.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">({documents.length})</span>
                )}
              </h3>
              <label>
                <Button variant="outline" size="sm" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    <HugeiconsIcon icon={FileUploadIcon} className="size-3 mr-1" />
                    {uploading ? "Uploading..." : "Upload"}
                  </span>
                </Button>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {documents === undefined ? (
              <Skeleton className="h-16 w-full" />
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No documents uploaded
              </p>
            ) : (
              <div className="space-y-1">
                {documents.map((doc) => (
                  <div
                    key={doc._id}
                    className="flex items-center justify-between text-sm py-2 px-2 border-b last:border-0"
                  >
                    <span className="font-mono text-xs truncate flex-1">{doc.fileName}</span>
                    <span className="text-xs text-muted-foreground mx-2">
                      {getRelativeTime(doc.createdAt)}
                    </span>
                    <div className="flex items-center gap-1">
                      {doc.downloadUrl && (
                        <a
                          href={doc.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <HugeiconsIcon icon={Download04Icon} className="size-3" />
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() => setDeleteDoc({ id: doc._id, name: doc.fileName })}
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="size-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Delete document confirmation */}
      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDoc?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDoc}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="font-mono text-sm mt-0.5">{value}</p>
    </div>
  )
}
