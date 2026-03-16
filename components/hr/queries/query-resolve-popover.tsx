"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function QueryResolvePopover({
  mode,
  onConfirm,
}: {
  mode: "resolve" | "reject"
  onConfirm: (note: string) => Promise<void>
}) {
  const [note, setNote] = useState("")
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isResolve = mode === "resolve"

  async function handleConfirm() {
    setSubmitting(true)
    try {
      await onConfirm(note)
      setNote("")
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isResolve ? "default" : "destructive"}
          size="sm"
        >
          {isResolve ? "Resolve" : "Reject"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <Label className="text-xs">
            {isResolve ? "Resolution Note" : "Rejection Reason"}
          </Label>
          <Textarea
            placeholder={
              isResolve
                ? "Describe the resolution..."
                : "Explain why this was rejected..."
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
          <Button
            variant={isResolve ? "default" : "destructive"}
            size="sm"
            className="w-full"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? "Processing..." : "Confirm"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
