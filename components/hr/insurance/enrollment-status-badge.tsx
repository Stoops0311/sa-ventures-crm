"use client"

import { Badge } from "@/components/ui/badge"
import { getInsuranceStatusStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function EnrollmentStatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const style = getInsuranceStatusStyle(status)
  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-[10px] px-1.5 py-0 h-4 border",
        style.bg,
        style.text,
        style.border,
        className
      )}
    >
      {style.label}
    </Badge>
  )
}
