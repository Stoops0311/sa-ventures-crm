"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Copy01Icon, Call02Icon } from "@hugeicons/core-free-icons"
import { getRoleStyle, getOnboardingStatusStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { toast } from "sonner"

type Props = {
  user: {
    name: string
    email?: string
    phone?: string
    role: string
    imageUrl?: string
  }
  profile: {
    department?: string
    designation?: string
    dateOfJoining?: string
    photoStorageId?: string
  }
  onboarding?: {
    status: string
    parsedItems: { completedAt: number | null }[]
  } | null
  photoUrl?: string | null
}

export function EmployeeDetailHeader({ user, profile, onboarding, photoUrl }: Props) {
  const roleStyle = getRoleStyle(user.role)

  const completedCount = onboarding?.parsedItems.filter(
    (i) => i.completedAt !== null
  ).length ?? 0
  const totalItems = onboarding?.parsedItems.length ?? 7

  return (
    <div className="flex flex-col sm:flex-row items-start gap-6 pb-6 border-b">
      {/* Avatar */}
      <div className="size-16 shrink-0 border-2 border-border bg-muted flex items-center justify-center text-lg font-medium overflow-hidden">
        {photoUrl ? (
          <img src={photoUrl} alt={user.name} className="size-full object-cover" />
        ) : user.imageUrl ? (
          <img src={user.imageUrl} alt={user.name} className="size-full object-cover" />
        ) : (
          <span>{user.name.charAt(0).toUpperCase()}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-sans text-2xl font-bold">{user.name}</h2>
          <Badge
            variant="secondary"
            className={cn(
              "text-[10px] px-1.5 py-0 h-4 border",
              roleStyle.bg,
              roleStyle.text,
              roleStyle.border
            )}
          >
            {roleStyle.label}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{profile.department ?? <em>No department</em>}</span>
          <span>{profile.designation ?? <em>No designation</em>}</span>
          {profile.dateOfJoining && (
            <span className="font-mono">
              Joined {format(new Date(profile.dateOfJoining), "dd MMM yyyy")}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {user.email && (
            <span className="flex items-center gap-1">
              {user.email}
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={() => {
                  navigator.clipboard.writeText(user.email!)
                  toast.success("Email copied")
                }}
              >
                <HugeiconsIcon icon={Copy01Icon} className="size-3" />
              </Button>
            </span>
          )}
          {user.phone && (
            <span className="flex items-center gap-1 font-mono">
              {user.phone}
              <Button
                variant="ghost"
                size="icon"
                className="size-5"
                onClick={() => {
                  navigator.clipboard.writeText(user.phone!)
                  toast.success("Phone number copied")
                }}
              >
                <HugeiconsIcon icon={Copy01Icon} className="size-3" />
              </Button>
              <a href={`tel:${user.phone}`}>
                <HugeiconsIcon icon={Call02Icon} className="size-3 text-muted-foreground hover:text-foreground" />
              </a>
            </span>
          )}
        </div>
      </div>

      {/* Onboarding status */}
      {onboarding && (
        <div className="shrink-0">
          {(() => {
            const style = getOnboardingStatusStyle(onboarding.status)
            return (
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs px-2 py-0.5 border",
                    style.bg,
                    style.text,
                    style.border
                  )}
                >
                  {onboarding.status === "pending" && "Onboarding Pending"}
                  {onboarding.status === "in_progress" && "Onboarding In Progress"}
                  {onboarding.status === "completed" && "Onboarding Complete"}
                </Badge>
                {onboarding.status !== "completed" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {completedCount}/{totalItems} items
                    </span>
                    <div className="w-12 h-1 bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                          width: `${(completedCount / totalItems) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
