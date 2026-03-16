"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const TYPE_PLACEHOLDERS: Record<string, string> = {
  salary_certificate: "e.g., For visa application",
  experience_letter: "e.g., For new employer",
  leave_encashment: "e.g., 5 days from March",
  salary_advance: "e.g., Personal emergency",
  address_change: "e.g., Moved to new address",
  bank_detail_change: "e.g., Changed bank account",
  other: "Brief summary of your request",
}

export function QuerySubmitForm({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const submitQuery = useMutation(api.hrQueries.submit)

  const [type, setType] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function reset() {
    setType("")
    setSubject("")
    setDescription("")
    setErrors({})
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!type) errs.type = "Required"
    if (!subject.trim()) errs.subject = "Required"
    if (!description.trim()) errs.description = "Required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      await submitQuery({
        type,
        subject: subject.trim(),
        description: description.trim(),
      })
      toast.success("Query submitted. HR will review your request.")
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit query")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-sans">Submit a Query</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">
              What do you need? <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={(v) => { setType(v); setErrors((p) => ({ ...p, type: "" })) }}>
              <SelectTrigger>
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary_certificate">Salary Certificate</SelectItem>
                <SelectItem value="experience_letter">Experience Letter</SelectItem>
                <SelectItem value="leave_encashment">Leave Encashment</SelectItem>
                <SelectItem value="salary_advance">Salary Advance</SelectItem>
                <SelectItem value="address_change">Address Change</SelectItem>
                <SelectItem value="bank_detail_change">Bank Detail Change</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-destructive mt-1">{errors.type}</p>
            )}
          </div>

          <div>
            <Label className="text-xs">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder={TYPE_PLACEHOLDERS[type] ?? "Brief summary of your request"}
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setErrors((p) => ({ ...p, subject: "" })) }}
            />
            {errors.subject && (
              <p className="text-xs text-destructive mt-1">{errors.subject}</p>
            )}
          </div>

          <div>
            <Label className="text-xs">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Provide details about your request..."
              value={description}
              onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: "" })) }}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Include any relevant details — dates, amounts, document references
            </p>
            {errors.description && (
              <p className="text-xs text-destructive mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Query"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
