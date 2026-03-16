"use client"

import { AttendancePersonalCalendar } from "@/components/dashboard/attendance-personal-calendar"

export default function HRAttendancePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">My Attendance</h1>
      <AttendancePersonalCalendar />
    </div>
  )
}
