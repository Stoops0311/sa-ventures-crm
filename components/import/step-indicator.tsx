"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Tick02Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

const STEPS = ["Upload", "Map Columns", "Allocate", "Confirm"]

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between w-full max-w-2xl mx-auto">
      {STEPS.map((label, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isLast = index === STEPS.length - 1

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-8 items-center justify-center border text-xs font-medium transition-colors",
                  isCompleted && "border-green-500 bg-green-50 text-green-700",
                  isCurrent && "border-primary bg-primary text-primary-foreground",
                  !isCompleted && !isCurrent && "border-muted-foreground/30 bg-muted/50 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] whitespace-nowrap",
                  isCurrent && "font-medium text-foreground",
                  !isCurrent && "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-px flex-1 mx-3 mt-[-18px]",
                  isCompleted ? "bg-green-500" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
