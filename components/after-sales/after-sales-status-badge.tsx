"use client"

import { getAfterSalesStatusStyle, getAfterSalesStepStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function AfterSalesStatusBadge({ status }: { status: string }) {
  const style = getAfterSalesStatusStyle(status)
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-medium",
        style.bg,
        style.text,
        "border",
        style.border
      )}
    >
      {style.label}
    </span>
  )
}

export function AfterSalesStepBadge({ step }: { step: string }) {
  const style = getAfterSalesStepStyle(step)
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-medium",
        style.bg,
        style.text,
        "border",
        style.border
      )}
    >
      {style.shortLabel}
    </span>
  )
}
