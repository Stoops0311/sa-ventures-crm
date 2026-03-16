"use client"

import { useState, useRef, useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { extractPlaceholders } from "@/lib/placeholder-utils"

interface TemplateEditorProps {
  templateId: Id<"letterTemplates">
  initialName: string
  initialContent: string
  onCancel: () => void
  onSaved: () => void
}

export function TemplateEditor({
  templateId,
  initialName,
  initialContent,
  onCancel,
  onSaved,
}: TemplateEditorProps) {
  const [name, setName] = useState(initialName)
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const upsert = useMutation(api.letterTemplates.upsert)

  const isDirty = name !== initialName || content !== initialContent

  // All known placeholders for this template type
  const allPlaceholders = extractPlaceholders(initialContent)

  const insertPlaceholder = useCallback(
    (placeholder: string) => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const token = `{{${placeholder}}}`
      const newContent =
        content.slice(0, start) + token + content.slice(end)

      setContent(newContent)

      // Re-focus and set cursor after inserted text
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(start + token.length, start + token.length)
      })
    },
    [content]
  )

  async function handleSave() {
    setSaving(true)
    try {
      await upsert({ templateId, name, content })
      toast.success("Template updated.")
      onSaved()
    } catch {
      toast.error("Couldn't save template. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    if (isDirty) {
      setShowUnsavedWarning(true)
      return
    }
    onCancel()
  }

  return (
    <div className="space-y-4">
      {/* Template Name */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Template Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Content Textarea */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Template Content
        </Label>
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="font-mono text-sm border-l-4 border-l-primary min-h-[384px] max-h-[640px]"
          rows={16}
        />
      </div>

      {/* Placeholder Reference Bar */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">
          Available placeholders (click to insert):
        </p>
        <div className="flex flex-wrap gap-1.5">
          {allPlaceholders.map((p) => (
            <Badge
              key={p}
              variant="outline"
              className="font-mono text-[10px] cursor-pointer hover:bg-primary/10 transition-colors"
              onClick={() => insertPlaceholder(p)}
            >
              {`{{${p}}}`}
            </Badge>
          ))}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {showUnsavedWarning && (
        <p className="text-xs text-destructive">
          You have unsaved changes. Are you sure?{" "}
          <button
            className="underline font-medium"
            onClick={onCancel}
          >
            Discard
          </button>{" "}
          <button
            className="underline font-medium"
            onClick={() => setShowUnsavedWarning(false)}
          >
            Keep Editing
          </button>
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="relative"
        >
          {saving ? "Saving..." : "Save Changes"}
          {isDirty && !saving && (
            <span className="absolute -top-0.5 -right-0.5 size-2 bg-primary rounded-full" />
          )}
        </Button>
      </div>
    </div>
  )
}
