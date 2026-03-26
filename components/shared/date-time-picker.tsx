"use client"

import { useCallback, useMemo } from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  TimePicker,
  getNextQuarterHour,
  getDefaultFutureTime,
  type TimeValue,
} from "@/components/shared/time-picker"
import { isToday as fnsIsToday, addDays, startOfDay } from "date-fns"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  disablePast?: boolean
  showPresets?: boolean
  className?: string
}

function applyTime(date: Date, time: TimeValue): Date {
  const result = new Date(date)
  let h = time.period === "AM"
    ? time.hour === 12 ? 0 : time.hour
    : time.hour === 12 ? 12 : time.hour + 12
  result.setHours(h, time.minute, 0, 0)
  return result
}

function extractTime(date: Date): TimeValue {
  const h = date.getHours()
  const m = date.getMinutes()
  const period: "AM" | "PM" = h < 12 ? "AM" : "PM"
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  // Snap to nearest quarter
  const snapped = Math.round(m / 15) * 15
  const minute = snapped >= 60 ? 45 : snapped
  return { hour: hour12, minute, period }
}

export function DateTimePicker({
  value,
  onChange,
  disablePast = true,
  showPresets = true,
  className,
}: DateTimePickerProps) {
  const now = useMemo(() => new Date(), [])

  // Current time value derived from the selected date
  const timeValue: TimeValue | null = value ? extractTime(value) : null

  // Presets
  const presets = useMemo(() => {
    const items: { label: string; date: Date }[] = []
    const currentHour = now.getHours()

    // "Today X PM" — only if before 8 PM
    if (currentHour < 20) {
      const nextQ = getNextQuarterHour()
      const todayPreset = applyTime(now, nextQ)
      const h = nextQ.hour
      const mStr = nextQ.minute === 0 ? "" : `:${nextQ.minute.toString().padStart(2, "0")}`
      items.push({
        label: `Today ${h}${mStr} ${nextQ.period}`,
        date: todayPreset,
      })
    }

    // "Tomorrow 10 AM"
    const tomorrow = applyTime(addDays(now, 1), { hour: 10, minute: 0, period: "AM" })
    items.push({ label: "Tomorrow 10 AM", date: tomorrow })

    // "+2 days 10 AM"
    const in2Days = applyTime(addDays(now, 2), { hour: 10, minute: 0, period: "AM" })
    items.push({ label: "+2 days", date: in2Days })

    return items
  }, [now])

  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        onChange(undefined)
        return
      }

      // Determine what time to apply
      let time: TimeValue
      if (value) {
        // Preserve existing time when changing date
        time = extractTime(value)
      } else if (fnsIsToday(date)) {
        time = getNextQuarterHour()
      } else {
        time = getDefaultFutureTime()
      }

      onChange(applyTime(date, time))
    },
    [onChange, value]
  )

  const handleTimeChange = useCallback(
    (time: TimeValue) => {
      const base = value ?? new Date()
      onChange(applyTime(base, time))
    },
    [onChange, value]
  )

  const handlePreset = useCallback(
    (date: Date) => {
      onChange(date)
    },
    [onChange]
  )

  const disableDate = useCallback(
    (date: Date) => {
      if (!disablePast) return false
      return date < startOfDay(now)
    },
    [disablePast, now]
  )

  // Is today selected? If so, disable past times
  const disableBefore = value && fnsIsToday(value) ? now : null

  return (
    <div className={cn("space-y-2", className)}>
      {/* Quick presets */}
      {showPresets && (
        <div className="flex flex-wrap gap-1 px-2 pt-1">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handlePreset(p.date)}
              className="px-2 py-0.5 text-[11px] border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Calendar */}
      <Calendar
        mode="single"
        selected={value}
        onSelect={handleDateSelect}
        disabled={disableDate}
      />

      {/* Time picker */}
      <div className="border-t px-2 py-2">
        <TimePicker
          value={timeValue}
          onChange={handleTimeChange}
          disableBefore={disableBefore}
        />
      </div>
    </div>
  )
}
