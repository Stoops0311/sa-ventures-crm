"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function SuggestionReviewForm({
  suggestionId,
  currentStatus,
  onCancel,
  onSaved,
}: {
  suggestionId: string
  currentStatus: string
  onCancel: () => void
  onSaved: () => void
}) {
  const review = useMutation(api.suggestions.review)

  const [status, setStatus] = useState(currentStatus === "new" ? "reviewed" : currentStatus)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await review({
        suggestionId: suggestionId as Id<"suggestions">,
        status,
        reviewNote: note.trim() || undefined,
      })
      toast.success("Suggestion reviewed")
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to review suggestion")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 border-t pt-3">
      <div>
        <Label className="text-xs">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Note</Label>
        <Textarea
          placeholder="Add a review note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
