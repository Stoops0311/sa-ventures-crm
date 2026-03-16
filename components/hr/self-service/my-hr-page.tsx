"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  HeartCheckIcon,
  Download04Icon,
} from "@hugeicons/core-free-icons"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCurrentUser } from "@/hooks/use-current-user"
import { OnboardingBanner } from "@/components/hr/onboarding/onboarding-banner"
import { SelfServiceProfile } from "@/components/hr/self-service/self-service-profile"
import { EmployeeLettersList } from "@/components/hr/letters/employee-letters-list"
import { SelfServiceSkeleton } from "@/components/shared/loading-skeleton"
import { PayslipHistory } from "@/components/hr/payroll/payslip-history"
import { EnrollmentForm } from "@/components/hr/insurance/enrollment-form"
import { EnrollmentStatusBadge } from "@/components/hr/insurance/enrollment-status-badge"
import { QuerySubmitForm } from "@/components/hr/queries/query-submit-form"
import { QueryHistory } from "@/components/hr/queries/query-history"
import { SuggestionSubmitForm } from "@/components/hr/suggestions/suggestion-submit-form"
import { MySuggestions } from "@/components/hr/suggestions/my-suggestions"

export function MyHRPage({ basePath }: { basePath: string }) {
  const { user, isLoading } = useCurrentUser()
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const [queryFormOpen, setQueryFormOpen] = useState(false)
  const [suggestionFormOpen, setSuggestionFormOpen] = useState(false)

  const myOnboarding = useQuery(
    api.onboarding.getMyOnboarding,
    user ? {} : "skip"
  )
  const myProfile = useQuery(
    api.employeeProfiles.getByUserId,
    user ? { userId: user._id } : "skip"
  )
  const myInsurance = useQuery(
    api.insurance.getByUserId,
    user ? { userId: user._id } : "skip"
  )
  const insuranceDocs = useQuery(
    api.insurance.listDocuments,
    myInsurance ? { enrollmentId: myInsurance._id } : "skip"
  )

  if (isLoading) return <SelfServiceSkeleton />

  if (!user) return null

  const isOnboardingIncomplete =
    myOnboarding && myOnboarding.status !== "completed"

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Onboarding Banner */}
      {isOnboardingIncomplete && (
        <OnboardingBanner
          completedCount={myOnboarding.completedCount}
          totalItems={myOnboarding.totalItems}
          remainingItems={myOnboarding.remainingItems}
          onboardingHref={`${basePath}/onboarding`}
        />
      )}

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {myProfile ? (
            <SelfServiceProfile
              data={{
                dateOfBirth: myProfile.dateOfBirth,
                gender: myProfile.gender,
                bloodGroup: myProfile.bloodGroup,
                department: myProfile.department,
                designation: myProfile.designation,
                dateOfJoining: myProfile.dateOfJoining,
                panNumber: myProfile.panNumber,
                aadharNumber: myProfile.aadharNumber,
                bankName: myProfile.bankName,
                accountNumber: myProfile.accountNumber,
                ifscCode: myProfile.ifscCode,
                emergencyContactName: myProfile.emergencyContactName,
                emergencyContactPhone: myProfile.emergencyContactPhone,
                emergencyContactRelation: myProfile.emergencyContactRelation,
                user: {
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                },
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              {myOnboarding
                ? "Complete your onboarding to set up your profile."
                : "No profile found. Contact your administrator."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* My Letters */}
      <Card>
        <CardHeader>
          <CardTitle>My Letters</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeeLettersList
            userId={user._id}
            isHROrAdmin={false}
          />
        </CardContent>
      </Card>

      {/* My Payslips */}
      <PayslipHistory limit={12} />

      {/* Phase D Tabs: Insurance, Queries, Suggestions */}
      <Tabs defaultValue="insurance">
        <TabsList>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="queries">Queries</TabsTrigger>
          <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
        </TabsList>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="animate-in fade-in duration-150">
          {showEnrollmentForm ? (
            <EnrollmentForm
              onCancel={() => setShowEnrollmentForm(false)}
              onSuccess={() => setShowEnrollmentForm(false)}
              initialData={
                myInsurance && myInsurance.status === "pending"
                  ? {
                      nomineeName: myInsurance.nomineeName,
                      nomineeRelation: myInsurance.nomineeRelation,
                      nomineeDob: myInsurance.nomineeDob,
                      existingConditions: myInsurance.existingConditions,
                      dependents: myInsurance.dependents ?? undefined,
                      preExistingDetails: myInsurance.preExistingDetails ?? undefined,
                      preferredHospital: myInsurance.preferredHospital ?? undefined,
                      sumInsured: myInsurance.sumInsured ?? undefined,
                    }
                  : undefined
              }
            />
          ) : !myInsurance ? (
            // Not enrolled state
            <Card>
              <CardContent className="flex flex-col items-center text-center py-8">
                <HugeiconsIcon
                  icon={HeartCheckIcon}
                  className="size-8 text-muted-foreground mb-3"
                  strokeWidth={1.5}
                />
                <h3 className="font-sans font-semibold">Insurance Enrollment</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Enroll in the company insurance plan by providing your nominee details
                </p>
                <Button className="mt-4" onClick={() => setShowEnrollmentForm(true)}>
                  Enroll Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Enrolled state — read-only view
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Insurance</CardTitle>
                <EnrollmentStatusBadge status={myInsurance.status} />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Nominee</p>
                    <p className="text-sm font-mono">
                      {myInsurance.nomineeName} ({myInsurance.nomineeRelation})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nominee DOB</p>
                    <p className="text-sm font-mono">{myInsurance.nomineeDob}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Policy Number</p>
                    <p className="text-sm font-mono">{myInsurance.policyNumber ?? "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expiry Date</p>
                    <p className="text-sm font-mono">{myInsurance.expiryDate ?? "Pending"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Existing Conditions</p>
                    <p className="text-sm font-mono">{myInsurance.existingConditions ? "Yes" : "No"}</p>
                  </div>
                </div>

                {/* Documents */}
                {insuranceDocs && insuranceDocs.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Documents</p>
                    {insuranceDocs.map((doc) => (
                      <div key={doc._id} className="flex items-center justify-between py-1">
                        <span className="text-sm font-mono">{doc.fileName}</span>
                        {doc.downloadUrl && (
                          <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <HugeiconsIcon icon={Download04Icon} className="size-3" />
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {myInsurance.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEnrollmentForm(true)}
                  >
                    Update Enrollment
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Queries Tab */}
        <TabsContent value="queries" className="animate-in fade-in duration-150">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">HR Queries</CardTitle>
              <Button size="sm" onClick={() => setQueryFormOpen(true)}>
                Submit Query
              </Button>
            </CardHeader>
            <CardContent>
              <QueryHistory onSubmitFirst={() => setQueryFormOpen(true)} />
            </CardContent>
          </Card>
          <QuerySubmitForm
            open={queryFormOpen}
            onOpenChange={setQueryFormOpen}
          />
        </TabsContent>

        {/* Suggestions Tab */}
        <TabsContent value="suggestions" className="animate-in fade-in duration-150">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Suggestions</CardTitle>
              <Button size="sm" onClick={() => setSuggestionFormOpen(true)}>
                Submit Suggestion
              </Button>
            </CardHeader>
            <CardContent>
              <MySuggestions />
            </CardContent>
          </Card>
          <SuggestionSubmitForm
            open={suggestionFormOpen}
            onOpenChange={setSuggestionFormOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
