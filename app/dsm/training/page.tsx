"use client"

import { TrainingList } from "@/components/dsm/training-list"

export default function DSMTrainingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-lg font-semibold">Training Guide</h1>
        <p className="text-xs text-muted-foreground">
          Complete all 7 days of training to build your real estate sales skills.
        </p>
      </div>
      <TrainingList />
    </div>
  )
}
