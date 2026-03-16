"use client"

import { AttendanceTeamGrid } from "@/components/admin/attendance-team-grid"

export default function AttendancePage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">Team Attendance</h1>
      <AttendanceTeamGrid />
    </div>
  )
}
