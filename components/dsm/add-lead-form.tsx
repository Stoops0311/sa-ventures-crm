"use client"

import { useState, useRef, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { validatePhone } from "@/lib/phone-utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"

type FormErrors = {
  name?: string
  mobileNumber?: string
  projectId?: string
}

export function AddLeadForm() {
  const [name, setName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [projectId, setProjectId] = useState("")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const successTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const projects = useQuery(api.projects.list, { status: "active" })
  const createLead = useMutation(api.leads.create)

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!name.trim() || name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters"
    }
    const phoneResult = validatePhone(mobileNumber.trim())
    if (!phoneResult.isValid) {
      errs.mobileNumber = phoneResult.issues[0] ?? "Enter a valid phone number with country code (e.g. 919876543210)"
    }
    if (!projectId) {
      errs.projectId = "Please select a project"
    }
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const normalizedPhone = validatePhone(mobileNumber.trim()).normalized
      await createLead({
        name: name.trim(),
        mobileNumber: normalizedPhone,
        projectId: projectId as Id<"projects">,
        source: "dsm",
        notes: notes.trim() || undefined,
      })

      // Reset form
      setName("")
      setMobileNumber("")
      setProjectId("")
      setNotes("")
      setErrors({})

      // Show success alert
      setShowSuccess(true)
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
      successTimerRef.current = setTimeout(() => {
        setShowSuccess(false)
      }, 5000)

      // Return focus to name input
      nameRef.current?.focus()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit lead"
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      {showSuccess && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            className="size-4 text-green-600"
            strokeWidth={2}
          />
          <AlertTitle>Lead submitted successfully!</AlertTitle>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Submit a New Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dsm-name">Name</Label>
              <Input
                ref={nameRef}
                id="dsm-name"
                autoFocus
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                }}
              />
              {errors.name && (
                <p className="text-[10px] text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dsm-mobile">Mobile Number</Label>
              <Input
                id="dsm-mobile"
                type="tel"
                required
                placeholder="919876543210 or +91 98765 43210"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value)
                  if (errors.mobileNumber)
                    setErrors((p) => ({ ...p, mobileNumber: undefined }))
                }}
              />
              {errors.mobileNumber && (
                <p className="text-[10px] text-destructive">
                  {errors.mobileNumber}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Project Interest</Label>
              <Select
                value={projectId}
                onValueChange={(v) => {
                  setProjectId(v)
                  if (errors.projectId)
                    setErrors((p) => ({ ...p, projectId: undefined }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-[10px] text-destructive">
                  {errors.projectId}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dsm-notes">
                Notes{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="dsm-notes"
                rows={2}
                placeholder="Any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting ? "Submitting..." : "Submit Lead"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
