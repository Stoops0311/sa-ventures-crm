const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th"
  switch (day % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}

export function formatDateOrdinal(dateStr: string): string {
  if (!dateStr) return ""
  const date = new Date(dateStr + "T00:00:00")
  if (isNaN(date.getTime())) return dateStr
  const day = date.getDate()
  const month = MONTHS[date.getMonth()]
  const year = date.getFullYear()
  return `${day}${getOrdinalSuffix(day)} ${month} ${year}`
}

interface UserData {
  name: string
}

interface ProfileData {
  designation?: string | null
  department?: string | null
  dateOfJoining?: string | null
  panNumber?: string | null
}

export function resolveAutoPlaceholders(
  content: string,
  user: UserData,
  profile: ProfileData
): string {
  const today = new Date()
  const currentDate = formatDateOrdinal(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  )

  const replacements: Record<string, string> = {
    companyName: "SA Ventures",
    currentDate,
    employeeName: user.name,
    designation: profile.designation || "[designation not set]",
    department: profile.department || "[department not set]",
    dateOfJoining: profile.dateOfJoining
      ? formatDateOrdinal(profile.dateOfJoining)
      : "[date of joining not set]",
    panNumber: profile.panNumber || "[PAN not set]",
  }

  let result = content
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
  }

  return result
}

export function extractPlaceholders(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.slice(2, -2)))]
}

export function hasUnfilledPlaceholders(content: string): boolean {
  return /\{\{\w+\}\}/.test(content)
}
