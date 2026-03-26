"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface TimeValue {
  hour: number // 1-12
  minute: number // 0, 15, 30, 45
  period: "AM" | "PM"
}

interface TimePickerProps {
  value: TimeValue | null
  onChange: (time: TimeValue) => void
  /** If set to a Date, times before that date/time on the same day are disabled */
  disableBefore?: Date | null
  className?: string
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = [0, 15, 30, 45]

function to24Hour(hour: number, period: "AM" | "PM"): number {
  if (period === "AM") return hour === 12 ? 0 : hour
  return hour === 12 ? 12 : hour + 12
}

function isTimePast(
  hour: number,
  minute: number,
  period: "AM" | "PM",
  now: Date
): boolean {
  const h24 = to24Hour(hour, period)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const targetMinutes = h24 * 60 + minute
  return targetMinutes < nowMinutes
}

export function TimePicker({
  value,
  onChange,
  disableBefore,
  className,
}: TimePickerProps) {
  const now = disableBefore ?? null

  const handleChange = (
    field: "hour" | "minute" | "period",
    raw: string
  ) => {
    const current = value ?? { hour: 10, minute: 0, period: "AM" as const }
    const next = { ...current }

    if (field === "hour") next.hour = parseInt(raw)
    else if (field === "minute") next.minute = parseInt(raw)
    else next.period = raw as "AM" | "PM"

    onChange(next)
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-xs text-muted-foreground shrink-0">Time:</span>

      {/* Hour */}
      <Select
        value={value?.hour?.toString() ?? ""}
        onValueChange={(v) => handleChange("hour", v)}
      >
        <SelectTrigger size="sm" className="w-[52px] tabular-nums">
          <SelectValue placeholder="Hr" />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {HOURS.map((h) => {
            const disabled =
              now !== null &&
              value?.period != null &&
              value?.minute != null &&
              isTimePast(h, value.minute, value.period, now)
            return (
              <SelectItem
                key={h}
                value={h.toString()}
                disabled={disabled}
              >
                {h}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      <span className="text-xs text-muted-foreground">:</span>

      {/* Minute */}
      <Select
        value={value?.minute?.toString() ?? ""}
        onValueChange={(v) => handleChange("minute", v)}
      >
        <SelectTrigger size="sm" className="w-[52px] tabular-nums">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {MINUTES.map((m) => {
            const disabled =
              now !== null &&
              value?.hour != null &&
              value?.period != null &&
              isTimePast(value.hour, m, value.period, now)
            return (
              <SelectItem
                key={m}
                value={m.toString()}
                disabled={disabled}
              >
                {m.toString().padStart(2, "0")}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>

      {/* AM/PM */}
      <Select
        value={value?.period ?? ""}
        onValueChange={(v) => handleChange("period", v)}
      >
        <SelectTrigger size="sm" className="w-[56px]">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

/** Get the next quarter-hour from now */
export function getNextQuarterHour(): TimeValue {
  const now = new Date()
  let h = now.getHours()
  let m = now.getMinutes()

  // Round up to next 15-minute mark
  const remainder = m % 15
  if (remainder > 0) {
    m = m + (15 - remainder)
  } else {
    m = m + 15
  }

  if (m >= 60) {
    m = 0
    h = h + 1
  }
  if (h >= 24) {
    h = 0
  }

  const period: "AM" | "PM" = h < 12 ? "AM" : "PM"
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h

  return { hour: hour12, minute: m, period }
}

/** Default time for a future date */
export function getDefaultFutureTime(): TimeValue {
  return { hour: 10, minute: 0, period: "AM" }
}
