"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import type { IconSvgElement } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: IconSvgElement
  title: string
  description: string
  action?: { label: string; onClick: () => void }
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <HugeiconsIcon
        icon={icon}
        className="size-12 text-muted-foreground/50 mb-4"
        strokeWidth={1.5}
      />
      <h3 className="font-sans text-sm font-medium">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">
        {description}
      </p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}
