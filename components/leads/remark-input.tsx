"use client"

import { useState, useRef, useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { SentIcon, Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function RemarkInput({
  leadId,
  onSubmitted,
}: {
  leadId: Id<"leads">
  onSubmitted?: () => void
}) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const createRemark = useMutation(api.remarks.create)

  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim()
    if (!trimmed || isSubmitting) return

    setIsSubmitting(true)
    try {
      await createRemark({ leadId, content: trimmed })
      setContent("")
      toast("Remark added")
      onSubmitted?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add remark"
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [content, isSubmitting, createRemark, leadId, onSubmitted])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a remark... (Ctrl+Enter to submit)"
        rows={2}
        className={cn(
          "min-h-[4rem] max-h-[8rem] resize-none",
          isSubmitting && "opacity-50"
        )}
        disabled={isSubmitting}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {content.length > 0 && `${content.length} chars`}
        </span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <HugeiconsIcon
              icon={Loading03Icon}
              strokeWidth={2}
              className="animate-spin"
            />
          ) : (
            <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
          )}
          {isSubmitting ? "Sending..." : "Add Remark"}
        </Button>
      </div>
    </div>
  )
}
