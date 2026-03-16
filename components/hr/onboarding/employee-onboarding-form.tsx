"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Checkbox } from "@/components/ui/checkbox"
import { useCurrentUser } from "@/hooks/use-current-user"
import { OnboardingFormSkeleton } from "@/components/shared/loading-skeleton"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  GENDERS,
  MARITAL_STATUSES,
  BLOOD_GROUPS,
  EMERGENCY_CONTACT_RELATIONS,
  UPLOADABLE_CHECKLIST_ITEMS,
} from "@/convex/lib/constants"

const PERSONAL_FIELDS = [
  "dateOfBirth",
  "gender",
  "fatherName",
  "motherName",
  "maritalStatus",
  "bloodGroup",
  "panNumber",
  "aadharNumber",
  "address",
] as const

const BANKING_FIELDS = ["bankName", "accountNumber", "ifscCode"] as const

const EMERGENCY_FIELDS = [
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyContactRelation",
] as const

const ALL_FIELDS = [...PERSONAL_FIELDS, ...BANKING_FIELDS, ...EMERGENCY_FIELDS]

export function EmployeeOnboardingForm({ basePath }: { basePath: string }) {
  const { user, isLoading } = useCurrentUser()

  const myProfile = useQuery(
    api.employeeProfiles.getByUserId,
    user ? { userId: user._id } : "skip"
  )
  const myOnboarding = useQuery(
    api.onboarding.getMyOnboarding,
    user ? {} : "skip"
  )

  const upsert = useMutation(api.employeeProfiles.upsert)
  const toggleItem = useMutation(api.onboarding.toggleItem)
  const generateUploadUrl = useMutation(api.employeeProfiles.generateUploadUrl)
  const uploadDocument = useMutation(api.onboarding.uploadDocument)

  const docInputRef = useRef<HTMLInputElement>(null)
  const [uploadingItem, setUploadingItem] = useState<string | null>(null)
  const [activeItemKey, setActiveItemKey] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize from profile data
  useEffect(() => {
    if (myProfile) {
      const init: Record<string, string> = {}
      const profileData = myProfile as unknown as Record<string, unknown>
      for (const key of ALL_FIELDS) {
        const val = profileData[key]
        init[key] = typeof val === "string" ? val : ""
      }
      setFields(init)
    }
  }, [myProfile])

  // Unsaved changes guard
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [dirty])

  if (isLoading) return <OnboardingFormSkeleton />
  if (!user) return null

  function update(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  // Count filled fields
  const filledCount = ALL_FIELDS.filter((f) => fields[f]?.trim()).length
  const totalFieldCount = ALL_FIELDS.length

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (fields.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(fields.panNumber)) {
      errs.panNumber = "PAN must be in format ABCDE1234F"
    }
    if (fields.aadharNumber) {
      const digits = fields.aadharNumber.replace(/\s/g, "")
      if (!/^\d{12}$/.test(digits)) {
        errs.aadharNumber = "Aadhar must be 12 digits"
      }
    }
    if (fields.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(fields.ifscCode)) {
      errs.ifscCode = "IFSC must be in format ABCD0123456"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function triggerDocUpload(itemKey: string) {
    setActiveItemKey(itemKey)
    docInputRef.current?.click()
  }

  async function handleDocFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !activeItemKey || !myOnboarding) return

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG, or PDF files accepted")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB")
      return
    }

    const itemKey = activeItemKey
    setUploadingItem(itemKey)
    try {
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!result.ok) throw new Error("Upload failed")
      const { storageId } = await result.json()
      await uploadDocument({ checklistId: myOnboarding._id, itemKey, storageId })
      toast.success("Document uploaded")
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setUploadingItem(null)
      setActiveItemKey(null)
      if (docInputRef.current) docInputRef.current.value = ""
    }
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const data: Record<string, string | undefined> = {}
      for (const [key, value] of Object.entries(fields)) {
        data[key] = value || undefined
      }
      await upsert({ userId: user!._id, ...data } as Parameters<typeof upsert>[0])

      // Auto-toggle checklist items if sections are complete
      if (myOnboarding) {
        const personalComplete = PERSONAL_FIELDS.every((f) => fields[f]?.trim())
        const emergencyComplete = EMERGENCY_FIELDS.every((f) => fields[f]?.trim())

        const items = myOnboarding.parsedItems
        const personalItem = items.find((i) => i.key === "complete_personal_info")
        const emergencyItem = items.find((i) => i.key === "submit_emergency_contact")

        if (personalComplete && personalItem && !personalItem.completedAt) {
          await toggleItem({
            checklistId: myOnboarding._id,
            itemKey: "complete_personal_info",
          })
        }
        if (emergencyComplete && emergencyItem && !emergencyItem.completedAt) {
          await toggleItem({
            checklistId: myOnboarding._id,
            itemKey: "submit_emergency_contact",
          })
        }
      }

      toast.success("Profile saved")
      setDirty(false)
    } catch {
      toast.error("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  const parsedItems = myOnboarding?.parsedItems ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={basePath}>My HR</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Onboarding</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div>
        <h1 className="font-sans text-xl font-bold">Complete Your Onboarding</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in your personal details. Your information is securely stored and
          only accessible to HR.
        </p>
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {filledCount <= totalFieldCount * 0.3
                ? "Fill in your personal details to get started."
                : filledCount <= totalFieldCount * 0.6
                  ? "You are making good progress."
                  : filledCount < totalFieldCount
                    ? "Almost there — just a few fields left."
                    : "All done! Your information has been saved."}
            </span>
            <span>
              {filledCount} of {totalFieldCount} fields completed
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(filledCount / totalFieldCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section 1: Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Basic details about you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input value={user.name} disabled className="bg-muted/30" />
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Contact HR to change your name
              </p>
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={fields.dateOfBirth ?? ""}
                onChange={(e) => update("dateOfBirth", e.target.value)}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={fields.gender ?? ""} onValueChange={(v) => update("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Father's Name</Label>
              <Input
                value={fields.fatherName ?? ""}
                onChange={(e) => update("fatherName", e.target.value)}
              />
            </div>
            <div>
              <Label>Mother's Name</Label>
              <Input
                value={fields.motherName ?? ""}
                onChange={(e) => update("motherName", e.target.value)}
              />
            </div>
            <div>
              <Label>Marital Status</Label>
              <Select value={fields.maritalStatus ?? ""} onValueChange={(v) => update("maritalStatus", v)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {MARITAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Blood Group</Label>
              <Select value={fields.bloodGroup ?? ""} onValueChange={(v) => update("bloodGroup", v)}>
                <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>PAN Number</Label>
              <Input
                value={fields.panNumber ?? ""}
                onChange={(e) => update("panNumber", e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
              />
              {errors.panNumber && <p className="text-xs text-destructive mt-1">{errors.panNumber}</p>}
            </div>
            <div>
              <Label>Aadhar Number</Label>
              <Input
                value={fields.aadharNumber ?? ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, "").slice(0, 12)
                  const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ")
                  update("aadharNumber", formatted)
                }}
                placeholder="1234 5678 9012"
                inputMode="numeric"
              />
              {errors.aadharNumber && <p className="text-xs text-destructive mt-1">{errors.aadharNumber}</p>}
            </div>
          </div>
          <div className="mt-4">
            <Label>Address</Label>
            <Textarea
              value={fields.address ?? ""}
              onChange={(e) => update("address", e.target.value)}
              rows={3}
              placeholder="Full residential address"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Banking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Details</CardTitle>
          <CardDescription>For salary processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Bank Name</Label>
            <Input
              value={fields.bankName ?? ""}
              onChange={(e) => update("bankName", e.target.value)}
              placeholder="e.g. State Bank of India"
            />
          </div>
          <div>
            <Label>Account Number</Label>
            <Input
              value={fields.accountNumber ?? ""}
              onChange={(e) => update("accountNumber", e.target.value)}
              placeholder="Savings account number"
              inputMode="numeric"
            />
          </div>
          <div>
            <Label>IFSC Code</Label>
            <Input
              value={fields.ifscCode ?? ""}
              onChange={(e) => update("ifscCode", e.target.value.toUpperCase())}
              placeholder="e.g. SBIN0001234"
            />
            {errors.ifscCode && <p className="text-xs text-destructive mt-1">{errors.ifscCode}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact</CardTitle>
          <CardDescription>
            In case we need to reach someone on your behalf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Contact Name</Label>
              <Input
                value={fields.emergencyContactName ?? ""}
                onChange={(e) => update("emergencyContactName", e.target.value)}
                placeholder="Full name of emergency contact"
              />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input
                value={fields.emergencyContactPhone ?? ""}
                onChange={(e) => update("emergencyContactPhone", e.target.value)}
                placeholder="10-digit mobile number"
                type="tel"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label>Relationship</Label>
              <Select
                value={fields.emergencyContactRelation ?? ""}
                onValueChange={(v) => update("emergencyContactRelation", v)}
              >
                <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
                <SelectContent>
                  {EMERGENCY_CONTACT_RELATIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="sticky bottom-0 flex items-center justify-between border-t bg-background pt-4 pb-2 -mx-6 px-6 shadow-[0_-1px_3px_0_rgb(0_0_0_/_.05)]">
        <p className="text-xs text-muted-foreground hidden sm:block">
          Save your progress when ready.
        </p>
        <Button onClick={handleSave} disabled={saving || !dirty}>
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      {/* Hidden file input for document uploads */}
      <input
        ref={docInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleDocFileChange}
      />

      {/* Onboarding Checklist */}
      {myOnboarding && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Onboarding Checklist
              <span className="text-xs font-normal text-muted-foreground">
                {myOnboarding.completedCount}/{myOnboarding.totalItems} complete
              </span>
            </CardTitle>
            <CardDescription>
              Upload required documents below. HR will verify and mark items complete.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parsedItems.map((item) => {
                const isChecked = item.completedAt !== null
                const isUploadable = (UPLOADABLE_CHECKLIST_ITEMS as readonly string[]).includes(item.key)
                const hasDocument = !!item.documentUrl
                const isUploading = uploadingItem === item.key

                return (
                  <div key={item.key} className="flex items-center gap-2">
                    <Checkbox checked={isChecked} disabled />
                    <span
                      className={cn(
                        "text-sm flex-1",
                        isChecked && "line-through text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>

                    {isUploadable && (
                      <div className="flex items-center gap-1.5 ml-auto shrink-0">
                        {isUploading ? (
                          <Skeleton className="h-6 w-20" />
                        ) : hasDocument ? (
                          <>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200 border"
                            >
                              Uploaded
                            </Badge>
                            <a
                              href={item.documentUrl!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary hover:underline"
                            >
                              View
                            </a>
                            {!isChecked && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 text-[10px] px-1.5"
                                onClick={() => triggerDocUpload(item.key)}
                              >
                                Replace
                              </Button>
                            )}
                          </>
                        ) : !isChecked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => triggerDocUpload(item.key)}
                          >
                            Upload
                          </Button>
                        ) : null}

                        {!hasDocument && !isChecked && !isUploading && (
                          <span className="text-[10px] text-muted-foreground">
                            Pending HR verification
                          </span>
                        )}
                      </div>
                    )}

                    {!isUploadable && !isChecked && (
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        Auto-verified on save
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
