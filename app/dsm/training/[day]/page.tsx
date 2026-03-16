"use client"

import { use } from "react"
import { TrainingViewer } from "@/components/dsm/training-viewer"

export default function TrainingDayPage({
  params,
}: {
  params: Promise<{ day: string }>
}) {
  const { day } = use(params)
  return <TrainingViewer day={parseInt(day, 10)} />
}
