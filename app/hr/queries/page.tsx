"use client"

import { QueryQueue } from "@/components/hr/queries/query-queue"

export default function QueriesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">HR Queries</h1>
      <QueryQueue />
    </div>
  )
}
