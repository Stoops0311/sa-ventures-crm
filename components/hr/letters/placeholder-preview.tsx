"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface PlaceholderPreviewProps {
  autoFilled: { key: string; value: string }[]
  manualPlaceholders: string[]
  content: string
}

export function PlaceholderPreview({
  autoFilled,
  manualPlaceholders,
  content,
}: PlaceholderPreviewProps) {
  // Check which manual placeholders are still in the content
  const unfilledManual = manualPlaceholders.filter((p) =>
    content.includes(`{{${p}}}`)
  )
  const filledManual = manualPlaceholders.filter(
    (p) => !content.includes(`{{${p}}}`)
  )

  // Only show if there are manual placeholders
  if (manualPlaceholders.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {filledManual.map((p) => (
        <Badge
          key={p}
          variant="secondary"
          className={cn(
            "text-[10px] font-mono border gap-1",
            "bg-green-50 text-green-700 border-green-200"
          )}
        >
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            className="size-3"
            strokeWidth={2}
          />
          {p} filled
        </Badge>
      ))}
      {unfilledManual.map((p) => (
        <Badge
          key={p}
          variant="secondary"
          className={cn(
            "text-[10px] font-mono border gap-1",
            "bg-orange-50 text-orange-700 border-orange-200"
          )}
        >
          <HugeiconsIcon
            icon={PencilEdit01Icon}
            className="size-3"
            strokeWidth={2}
          />
          {`{{${p}}}`} needs input
        </Badge>
      ))}
      {autoFilled.map((p) => (
        <Badge
          key={p.key}
          variant="secondary"
          className="text-[10px] font-mono border bg-green-50 text-green-700 border-green-200 gap-1"
        >
          <HugeiconsIcon
            icon={CheckmarkCircle02Icon}
            className="size-3"
            strokeWidth={2}
          />
          {p.key}: {p.value}
        </Badge>
      ))}
    </div>
  )
}
