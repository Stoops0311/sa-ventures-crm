"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { getLetterTypeStyle } from "@/lib/constants"
import { getRelativeTime } from "@/lib/date-utils"
import { extractPlaceholders } from "@/lib/placeholder-utils"
import { TemplateEditor } from "./template-editor"
import { cn } from "@/lib/utils"

function HighlightedContent({ content }: { content: string }) {
  // Split content on {{...}} and render placeholders with accent color
  const parts = content.split(/(\{\{\w+\}\})/g)
  return (
    <div className="whitespace-pre-wrap font-mono text-sm">
      {parts.map((part, i) =>
        /^\{\{\w+\}\}$/.test(part) ? (
          <span key={i} className="text-primary font-medium">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  )
}

function TemplateRow({ template }: { template: Doc<"letterTemplates"> }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const toggleActive = useMutation(api.letterTemplates.toggleActive)

  const style = getLetterTypeStyle(template.type)
  const placeholders = extractPlaceholders(template.content)

  async function handleToggle() {
    try {
      await toggleActive({ templateId: template._id })
      toast.success(
        `${template.name} template ${template.isActive ? "deactivated" : "activated"}`
      )
    } catch {
      toast.error("Couldn't update template status.")
    }
  }

  return (
    <>
      <TableRow
        className={cn(
          "transition-opacity duration-300",
          !template.isActive && "opacity-60"
        )}
      >
        <TableCell>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] font-mono border",
              style.bg,
              style.text,
              style.border
            )}
          >
            {style.label}
          </Badge>
        </TableCell>
        <TableCell className="font-medium">{template.name}</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-1.5 rounded-full",
                template.isActive ? "bg-green-500" : "bg-gray-400"
              )}
            />
            <span
              className={cn(
                "text-xs",
                template.isActive
                  ? "text-green-700"
                  : "text-muted-foreground"
              )}
            >
              {template.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
          {getRelativeTime(template.updatedAt)}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Switch
              checked={template.isActive}
              onCheckedChange={handleToggle}
              className="scale-75"
            />
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setOpen(!open)}>
              <HugeiconsIcon
                icon={open ? ArrowUp01Icon : ArrowDown01Icon}
                className="size-4"
              />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={5}>
            <div className="bg-muted/30 p-4 animate-in fade-in slide-in-from-top-1 duration-150">
              {editing ? (
                <TemplateEditor
                  templateId={template._id}
                  initialName={template.name}
                  initialContent={template.content}
                  onCancel={() => setEditing(false)}
                  onSaved={() => setEditing(false)}
                />
              ) : (
                <div className="space-y-3">
                  <HighlightedContent content={template.content} />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Placeholders used:
                      </span>
                      {placeholders.map((p) => (
                        <Badge
                          key={p}
                          variant="secondary"
                          className="font-mono text-[10px]"
                        >
                          {`{{${p}}}`}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      Edit Template
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export function TemplateList() {
  const templates = useQuery(api.letterTemplates.list)

  if (templates === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (templates.length === 0) return null

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[140px]">Type</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          <TableHead className="w-[120px] hidden md:table-cell">
            Last Updated
          </TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {templates.map((template) => (
          <TemplateRow key={template._id} template={template} />
        ))}
      </TableBody>
    </Table>
  )
}
