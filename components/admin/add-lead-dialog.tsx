"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { validatePhone } from "@/lib/phone-utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LEAD_SOURCES } from "@/lib/constants"

interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormErrors = {
  name?: string
  mobileNumber?: string
  projectId?: string
  assignedTo?: string
}

export function AddLeadDialog({ open, onOpenChange }: AddLeadDialogProps) {
  const [name, setName] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [email, setEmail] = useState("")
  const [budget, setBudget] = useState("")
  const [projectId, setProjectId] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [source, setSource] = useState("manual")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const projects = useQuery(api.projects.list, { status: "active" })
  const salespeople = useQuery(api.users.getAvailableSalespeople, {})
  const createLead = useMutation(api.leads.create)

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
      errs.projectId = "Select a project"
    }
    if (!assignedTo) {
      errs.assignedTo = "Select a salesperson"
    }
    return errs
  }

  function resetForm() {
    setName("")
    setMobileNumber("")
    setEmail("")
    setBudget("")
    setProjectId("")
    setAssignedTo("")
    setSource("manual")
    setNotes("")
    setErrors({})
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
        email: email.trim() || undefined,
        budget: budget.trim() || undefined,
        projectId: projectId as Id<"projects">,
        assignedTo: assignedTo as Id<"users">,
        source,
        notes: notes.trim() || undefined,
      })
      toast.success("Lead created successfully")
      resetForm()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create lead")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-sans">Add Lead Manually</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                autoFocus
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
              <Label htmlFor="add-mobile">Mobile Number *</Label>
              <Input
                id="add-mobile"
                type="tel"
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
              <Label htmlFor="add-email">
                Email{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="add-email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-budget">
                Budget{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="add-budget"
                placeholder="e.g. 40-50 Lakhs"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Project *</Label>
              <Select
                value={projectId}
                onValueChange={(v) => {
                  setProjectId(v)
                  if (errors.projectId)
                    setErrors((p) => ({ ...p, projectId: undefined }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select project" />
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
              <Label>Assign To *</Label>
              <Select
                value={assignedTo}
                onValueChange={(v) => {
                  setAssignedTo(v)
                  if (errors.assignedTo)
                    setErrors((p) => ({ ...p, assignedTo: undefined }))
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  {salespeople?.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignedTo && (
                <p className="text-[10px] text-destructive">
                  {errors.assignedTo}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="add-notes"
              rows={2}
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm()
                onOpenChange(false)
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
