import {
  formatDistanceToNow,
  isToday as fnsIsToday,
  isTomorrow as fnsIsTomorrow,
  isPast,
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDay,
  isSaturday,
  isSunday,
} from "date-fns"

export function getRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export function isOverdue(timestamp: number | undefined): boolean {
  if (!timestamp) return false
  return isPast(startOfDay(new Date(timestamp))) && !fnsIsToday(new Date(timestamp))
}

export function isToday(timestamp: number | undefined): boolean {
  if (!timestamp) return false
  return fnsIsToday(new Date(timestamp))
}

export function formatFollowUpDate(timestamp: number | undefined): string {
  if (!timestamp) return "--"
  const date = new Date(timestamp)
  if (fnsIsToday(date)) {
    return `Today at ${format(date, "h:mm a")}`
  }
  if (fnsIsTomorrow(date)) {
    return `Tomorrow at ${format(date, "h:mm a")}`
  }
  return format(date, "MMM d 'at' h:mm a")
}

export function formatFullDate(timestamp: number): string {
  return format(new Date(timestamp), "MMM d, yyyy 'at' h:mm a")
}

export function getTodayRange(): { start: number; end: number } {
  const now = new Date()
  return {
    start: startOfDay(now).getTime(),
    end: endOfDay(now).getTime(),
  }
}

export function getThisWeekRange(): { start: number; end: number } {
  const now = new Date()
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }).getTime(),
    end: endOfWeek(now, { weekStartsOn: 1 }).getTime(),
  }
}

export function getThisMonthRange(): { start: number; end: number } {
  const now = new Date()
  return {
    start: startOfMonth(now).getTime(),
    end: endOfMonth(now).getTime(),
  }
}

// Attendance helpers

export function getDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function getMonthDates(year: number, month: number): string[] {
  const daysInMonth = getDaysInMonth(new Date(year, month - 1))
  const dates: string[] = []
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    )
  }
  return dates
}

export function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr + "T00:00:00")
  return isSaturday(date) || isSunday(date)
}

export function getDayOfWeek(dateStr: string): number {
  return getDay(new Date(dateStr + "T00:00:00"))
}

export function formatDuration(ms: number): string {
  const totalMinutes = Math.round(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

export function formatTimeOfDay(timestamp: number): string {
  return format(new Date(timestamp), "h:mm a")
}

export function formatDateLabel(dateStr: string): string {
  return format(new Date(dateStr + "T00:00:00"), "EEEE, MMMM d, yyyy")
}
