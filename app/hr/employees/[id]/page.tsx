"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  File01Icon,
  FileUploadIcon,
} from "@hugeicons/core-free-icons"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmployeeDetailHeader } from "@/components/hr/employees/employee-detail-header"
import { EmployeeProfileView } from "@/components/hr/employees/employee-profile-view"
import { EmployeeProfileForm } from "@/components/hr/employees/employee-profile-form"
import { PhotoUpload } from "@/components/hr/employees/photo-upload"
import { OnboardingChecklist } from "@/components/hr/onboarding/onboarding-checklist"
import { EmployeeLettersList } from "@/components/hr/letters/employee-letters-list"
import { LetterUploadDialog } from "@/components/hr/letters/letter-upload-dialog"
import { EmployeeDetailSkeleton } from "@/components/shared/loading-skeleton"
import { getOnboardingStatusStyle } from "@/lib/constants"
import { formatINR } from "@/lib/currency"
import { SalaryConfigForm } from "@/components/hr/payroll/salary-config-form"
import { Skeleton } from "@/components/ui/skeleton"
import { getRelativeTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

function Section({
  title,
  badge,
  defaultOpen,
  children,
}: {
  title: string
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b">
      <div className="flex w-full items-center justify-between py-3 px-2">
        <CollapsibleTrigger className="flex flex-1 items-center justify-between hover:bg-muted/50 transition-colors -my-3 -ml-2 py-3 pl-2 pr-2">
          <span className="font-sans font-semibold text-sm">{title}</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className={cn(
              "size-4 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        {badge && (
          <div className="shrink-0 ml-2">
            {badge}
          </div>
        )}
      </div>
      <CollapsibleContent className="py-4 px-2 animate-in fade-in slide-in-from-top-1 duration-200">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}


function ActivityTimeline({ entityId }: { entityId: string }) {
  const logs = useQuery(api.activityLogs.listByEntity, { entityId })

  if (logs === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="size-6 bg-muted shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-muted w-3/4" />
              <div className="h-2.5 bg-muted w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No activity recorded yet.
      </p>
    )
  }

  return (
    <ScrollArea className="max-h-[320px]">
      <div className="space-y-3">
        {logs.map((log) => (
          <div key={log._id} className="flex gap-3 text-sm">
            <div className="size-6 shrink-0 border bg-muted flex items-center justify-center text-[10px] font-medium overflow-hidden">
              {log.performedByImageUrl ? (
                <img src={log.performedByImageUrl} alt="" className="size-full object-cover" />
              ) : (
                <span>{log.performedByName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p>
                <span className="font-medium">{log.performedByName}</span>{" "}
                <span className="text-muted-foreground">
                  {log.action.replace(/_/g, " ")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {getRelativeTime(log.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

function LettersSection({ userId, userName }: { userId: Id<"users">; userName: string }) {
  const router = useRouter()
  const letters = useQuery(api.employeeLetters.listByUser, { userId })
  const [uploadOpen, setUploadOpen] = useState(false)

  const letterCount = letters?.length ?? 0

  return (
    <Section
      title="Letters"
      badge={
        letterCount > 0 ? (
          <div className="flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 h-4 font-mono"
            >
              {letterCount}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => router.push(`/hr/letters?employee=${userId}`)}
            >
              <HugeiconsIcon icon={File01Icon} className="size-3 mr-1" />
              Generate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setUploadOpen(true)}
            >
              <HugeiconsIcon icon={FileUploadIcon} className="size-3 mr-1" />
              Upload
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => router.push(`/hr/letters?employee=${userId}`)}
            >
              Generate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setUploadOpen(true)}
            >
              Upload
            </Button>
          </div>
        )
      }
    >
      <EmployeeLettersList
        userId={userId}
        isHROrAdmin={true}
        onGenerateLetter={() => router.push(`/hr/letters?employee=${userId}`)}
      />
      <LetterUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultUserId={userId}
        defaultUserName={userName}
      />
    </Section>
  )
}

function InsuranceSection({ userId }: { userId: Id<"users"> }) {
  const enrollment = useQuery(api.insurance.getByUserId, { userId })

  return (
    <Section title="Insurance" badge={
      enrollment ? (
        <Badge
          variant="secondary"
          className={cn(
            "text-[10px] px-1.5 py-0 h-4 border",
            enrollment.status === "enrolled" ? "bg-green-50 text-green-700 border-green-200" :
            enrollment.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
            enrollment.status === "expired" ? "bg-red-50 text-red-700 border-red-200" :
            "bg-blue-50 text-blue-700 border-blue-200"
          )}
        >
          {enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1)}
        </Badge>
      ) : undefined
    }>
      {enrollment === undefined ? (
        <Skeleton className="h-20 w-full" />
      ) : enrollment === null ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          Not enrolled in insurance.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Nominee</p>
            <p className="font-mono text-sm">{enrollment.nomineeName} ({enrollment.nomineeRelation})</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Nominee DOB</p>
            <p className="font-mono text-sm">{enrollment.nomineeDob}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Policy Number</p>
            <p className="font-mono text-sm">{enrollment.policyNumber ?? "Pending"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Expiry Date</p>
            <p className="font-mono text-sm">{enrollment.expiryDate ?? "Pending"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Conditions</p>
            <p className="font-mono text-sm">{enrollment.existingConditions ? "Yes" : "No"}</p>
          </div>
        </div>
      )}
    </Section>
  )
}

function SalarySection({ userId, userName }: { userId: Id<"users">; userName: string }) {
  const components = useQuery(api.salaryComponents.listByUser, { userId })
  const [configOpen, setConfigOpen] = useState(false)
  const hasComps = (components?.length ?? 0) > 0
  const earnings = components?.filter((c) => c.type === "earning") ?? []
  const deductions = components?.filter((c) => c.type === "deduction") ?? []

  return (
    <Section
      title="Salary"
      badge={
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setConfigOpen(true)}
        >
          {hasComps ? "Edit" : "Configure"}
        </Button>
      }
      defaultOpen={false}
    >
      {components === undefined ? (
        <Skeleton className="h-20 w-full" />
      ) : !hasComps ? (
        <div className="text-sm text-muted-foreground py-4 text-center">
          No salary configured.{" "}
          <button
            className="text-primary underline"
            onClick={() => setConfigOpen(true)}
          >
            Configure salary
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-mono mb-2">
              Earnings
            </p>
            {earnings.map((c) => (
              <div
                key={c._id}
                className="flex justify-between text-sm py-1 border-b last:border-0"
              >
                <span className="font-mono">{c.name}</span>
                <span className="font-mono tabular-nums">
                  {formatINR(c.amount)}
                </span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-mono mb-2">
              Deductions
            </p>
            {deductions.map((c) => (
              <div
                key={c._id}
                className="flex justify-between text-sm py-1 border-b last:border-0"
              >
                <span className="font-mono">{c.name}</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatINR(c.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <SalaryConfigForm
        userId={userId}
        userName={userName}
        open={configOpen}
        onOpenChange={setConfigOpen}
        existingComponents={components ?? undefined}
      />
    </Section>
  )
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const profileId = params.id as Id<"employeeProfiles">

  const profileData = useQuery(api.employeeProfiles.getById, {
    profileId,
  })

  const [editSection, setEditSection] = useState<"personal" | "banking" | "emergency" | "employment" | null>(null)

  if (profileData === undefined) return <EmployeeDetailSkeleton />
  if (profileData === null) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-muted-foreground">Employee not found</p>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href="/hr/employees">Back to Employees</Link>
        </Button>
      </div>
    )
  }

  const { user, onboarding, photoUrl, enrichedOnboardingItems, ...profile } = profileData
  if (!user) return null

  const parsedItems = enrichedOnboardingItems ?? (onboarding
    ? (JSON.parse(onboarding.items) as { key: string; label: string; completedAt: number | null; completedBy: string | null; storageId?: string | null; uploadedAt?: number | null; documentUrl?: string | null }[])
    : [])

  const completedCount = parsedItems.filter((i) => i.completedAt !== null).length
  const isOnboardingIncomplete = onboarding && onboarding.status !== "completed"
  const statusStyle = onboarding ? getOnboardingStatusStyle(onboarding.status) : null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr">HR Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/hr/employees">Employees</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{user.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <EmployeeDetailHeader
        user={user}
        profile={profile}
        onboarding={onboarding ? { status: onboarding.status, parsedItems } : null}
        photoUrl={photoUrl}
      />

      {/* Sections */}
      <div>
        {/* Onboarding */}
        {onboarding && (
          <Section
            title="Onboarding"
            badge={
              <div className="flex items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-1.5 py-0 h-4 border",
                    statusStyle?.bg,
                    statusStyle?.text,
                    statusStyle?.border
                  )}
                >
                  {statusStyle?.label}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {completedCount}/{parsedItems.length} complete
                </span>
              </div>
            }
            defaultOpen={isOnboardingIncomplete ?? false}
          >
            <OnboardingChecklist
              checklistId={onboarding._id}
              items={parsedItems}
              status={onboarding.status}
              completedAt={onboarding.completedAt}
              employeeName={user.name}
              isHROrAdmin={true}
            />
          </Section>
        )}

        {/* Employment Details */}
        <Section
          title="Employment Details"
          badge={
            editSection !== "employment" ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setEditSection("employment")
                }}
              >
                Edit
              </Button>
            ) : null
          }
          defaultOpen
        >
          {editSection === "employment" ? (
            <EmployeeProfileForm
              profile={{ ...profile, userId: profile.userId }}
              section="employment"
              isHROrAdmin={true}
              onCancel={() => setEditSection(null)}
              onSaved={() => setEditSection(null)}
            />
          ) : (
            <EmployeeProfileView profile={profile} section="employment" />
          )}
        </Section>

        {/* Personal Information */}
        <Section
          title="Personal Information"
          badge={
            editSection !== "personal" ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setEditSection("personal")
                }}
              >
                Edit
              </Button>
            ) : null
          }
          defaultOpen={!isOnboardingIncomplete}
        >
          <div className="mb-4">
            <PhotoUpload
              userId={profile.userId}
              currentPhotoUrl={photoUrl}
              clerkImageUrl={user.imageUrl}
              name={user.name}
            />
          </div>
          {editSection === "personal" ? (
            <EmployeeProfileForm
              profile={{ ...profile, userId: profile.userId }}
              section="personal"
              isHROrAdmin={true}
              onCancel={() => setEditSection(null)}
              onSaved={() => setEditSection(null)}
            />
          ) : (
            <EmployeeProfileView profile={profile} section="personal" />
          )}
        </Section>

        {/* Banking Details */}
        <Section
          title="Banking Details"
          badge={
            editSection !== "banking" ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setEditSection("banking")
                }}
              >
                Edit
              </Button>
            ) : null
          }
          defaultOpen
        >
          {editSection === "banking" ? (
            <EmployeeProfileForm
              profile={{ ...profile, userId: profile.userId }}
              section="banking"
              isHROrAdmin={true}
              onCancel={() => setEditSection(null)}
              onSaved={() => setEditSection(null)}
            />
          ) : (
            <EmployeeProfileView profile={profile} section="banking" />
          )}
        </Section>

        {/* Emergency Contact */}
        <Section
          title="Emergency Contact"
          badge={
            editSection !== "emergency" ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setEditSection("emergency")
                }}
              >
                Edit
              </Button>
            ) : null
          }
          defaultOpen
        >
          {editSection === "emergency" ? (
            <EmployeeProfileForm
              profile={{ ...profile, userId: profile.userId }}
              section="emergency"
              isHROrAdmin={true}
              onCancel={() => setEditSection(null)}
              onSaved={() => setEditSection(null)}
            />
          ) : (
            <EmployeeProfileView profile={profile} section="emergency" />
          )}
        </Section>

        {/* Activity History */}
        <Section title="Activity History">
          <ActivityTimeline entityId={profileId} />
        </Section>

        {/* Letters */}
        <LettersSection userId={profile.userId} userName={user.name} />
        <SalarySection userId={profile.userId} userName={user.name} />
        <InsuranceSection userId={profile.userId} />
      </div>
    </div>
  )
}
