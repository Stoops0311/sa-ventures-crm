"use client"

import { useState } from "react"
import type { Id } from "@/convex/_generated/dataModel"
import { RenewalAlerts } from "@/components/hr/insurance/renewal-alerts"
import { EnrollmentList } from "@/components/hr/insurance/enrollment-list"
import { EnrollmentDetailSheet } from "@/components/hr/insurance/enrollment-detail-sheet"

export default function InsurancePage() {
  const [selectedEnrollment, setSelectedEnrollment] = useState<Id<"insuranceEnrollments"> | null>(null)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">Insurance</h1>

      <RenewalAlerts
        onRowClick={(id) => setSelectedEnrollment(id as Id<"insuranceEnrollments">)}
      />

      <EnrollmentList
        onRowClick={(enrollment) => setSelectedEnrollment(enrollment._id as Id<"insuranceEnrollments">)}
      />

      <EnrollmentDetailSheet
        enrollmentId={selectedEnrollment}
        open={!!selectedEnrollment}
        onOpenChange={(open) => {
          if (!open) setSelectedEnrollment(null)
        }}
      />
    </div>
  )
}
