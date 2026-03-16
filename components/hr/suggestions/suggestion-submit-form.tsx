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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  LockIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export function SuggestionSubmitForm({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const submitSuggestion = useMutation(api.suggestions.submit)

  const [isAnonymous, setIsAnonymous] = useState(false)
  const [category, setCategory] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  function reset() {
    setIsAnonymous(false)
    setCategory("")
    setContent("")
    setError("")
    setSuccess(false)
  }

  async function handleSubmit() {
    if (!content.trim()) {
      setError("Content is required")
      return
    }
    setSubmitting(true)
    try {
      await submitSuggestion({
        content: content.trim(),
        isAnonymous,
        category: category || undefined,
      })
      setSuccess(true)
      toast.success(
        isAnonymous
          ? "Suggestion submitted anonymously"
          : "Suggestion submitted"
      )
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit suggestion")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
        <DialogContent className="max-w-lg">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <HugeiconsIcon
              icon={isAnonymous ? LockIcon : CheckmarkCircle01Icon}
              className="size-12 text-green-600 mb-4"
            />
            <h3 className="font-sans text-lg font-semibold">
              {isAnonymous ? "Suggestion submitted anonymously" : "Suggestion submitted"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isAnonymous
                ? "Your identity is not visible to HR. Thank you for your feedback."
                : "HR will review your suggestion. Thank you."}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => { reset(); onOpenChange(false) }}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-sans">Submit a Suggestion</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Anonymous Toggle - FIRST field */}
          <div className="flex items-center justify-between py-3 border-b mb-4">
            <div>
              <p className="font-medium text-sm flex items-center gap-1.5">
                Submit anonymously
                {isAnonymous && (
                  <HugeiconsIcon
                    icon={LockIcon}
                    className="size-3.5 text-green-600 animate-in fade-in duration-200"
                  />
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAnonymous
                  ? "Your identity will be hidden from HR"
                  : "Your name will be visible to HR"}
              </p>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          {/* Form area with conditional bg */}
          <div className={cn(
            "space-y-4 transition-colors duration-300",
            isAnonymous && "bg-muted/20 -mx-2 px-2 py-2"
          )}>
            {/* Category */}
            <div>
              <Label className="text-xs">Category (optional)</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workplace">Workplace</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="process">Process</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div>
              <Label className="text-xs">
                Your Suggestion <span className="text-destructive">*</span>
              </Label>
              <Textarea
                placeholder="Share your idea, feedback, or suggestion..."
                value={content}
                onChange={(e) => { setContent(e.target.value); setError("") }}
                rows={4}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  Be as specific as you can — what is the problem and what would make it better?
                </p>
                <span className="text-xs text-muted-foreground">
                  {content.length} / 2000
                </span>
              </div>
              {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Suggestion"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
