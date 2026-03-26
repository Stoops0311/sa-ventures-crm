"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Coffee01Icon,
  ForkIcon,
  Book02Icon,
  UserGroupIcon,
  Location01Icon,
  Megaphone01Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useBreakTime } from "@/hooks/use-break-time"
import { BREAK_TYPES, type BreakTypeValue } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { IconSvgElement } from "@hugeicons/react"

const BREAK_TYPE_ICONS: Record<string, IconSvgElement> = {
  lunch:             ForkIcon,
  other_break:       Coffee01Icon,
  training:          Book02Icon,
  huddle:            UserGroupIcon,
  onsite_visit:      Location01Icon,
  offline_marketing: Megaphone01Icon,
  other:             HelpCircleIcon,
}

export function BreakToggle() {
  const { startBreak } = useBreakTime()
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<BreakTypeValue | null>(null)
  const [remarks, setRemarks] = useState("")
  const [isStarting, setIsStarting] = useState(false)

  const canStart = selectedType !== null && (selectedType !== "other" || remarks.trim().length > 0)

  const handleStart = async () => {
    if (!selectedType) return
    setIsStarting(true)
    try {
      await startBreak({ breakType: selectedType, remarks: remarks.trim() || undefined })
      setOpen(false)
      setSelectedType(null)
      setRemarks("")
    } finally {
      setIsStarting(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setSelectedType(null)
      setRemarks("")
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              tooltip="Start Break"
              className="cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={Coffee01Icon} strokeWidth={2} />
              <span>Start Break</span>
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-64 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">What kind of break?</p>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {BREAK_TYPES.map((bt) => {
                const icon = BREAK_TYPE_ICONS[bt.value]
                const isSelected = selectedType === bt.value
                return (
                  <button
                    key={bt.value}
                    onClick={() => setSelectedType(bt.value as BreakTypeValue)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 text-xs border transition-colors text-left",
                      isSelected
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                  >
                    {icon && (
                      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-3.5 shrink-0" />
                    )}
                    <span className="truncate">{bt.label}</span>
                  </button>
                )
              })}
            </div>

            {selectedType === "other" && (
              <Textarea
                placeholder="What are you doing?"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="mb-2 text-xs resize-none"
                rows={2}
              />
            )}

            <Button
              onClick={handleStart}
              disabled={!canStart || isStarting}
              size="sm"
              className="w-full"
            >
              {isStarting ? "Starting..." : "Start Break"}
            </Button>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
