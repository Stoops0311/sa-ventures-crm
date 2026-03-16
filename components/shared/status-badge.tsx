"use client"

import { Badge } from "@/components/ui/badge"
import { getStatusStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function StatusBadge({
  status,
  size = "default",
}: {
  status: string
  size?: "sm" | "default"
}) {
  const style = getStatusStyle(status)
  return (
    <Badge
      variant="outline"
      className={cn(
        style.bg,
        style.text,
        style.border,
        size === "sm" && "text-[10px] px-1.5 py-0"
      )}
    >
      {style.label}
    </Badge>
  )
}
