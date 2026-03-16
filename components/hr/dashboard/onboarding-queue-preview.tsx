"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getOnboardingStatusStyle } from "@/lib/constants"
import { getRelativeTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

export function OnboardingQueuePreview() {
  const allOnboardings = useQuery(api.onboarding.listAll, {})

  const pending = allOnboardings?.filter(
    (o) => o.status === "pending" || o.status === "in_progress"
  ) ?? []
  const preview = pending.slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Pending Onboardings</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Employees who need attention
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {preview.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              className="size-9 text-green-600 mb-2"
              strokeWidth={1.5}
            />
            <p className="text-sm font-medium">All employees onboarded</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No pending onboarding checklists
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {preview.map((item) => {
                const statusStyle = getOnboardingStatusStyle(item.status)
                return (
                  <Link
                    key={item._id}
                    href={`/hr/employees/${item.employeeProfileId}`}
                    className="flex items-center gap-3 py-1.5 hover:bg-muted/50 -mx-2 px-2 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.user?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 border",
                            statusStyle.bg,
                            statusStyle.text,
                            statusStyle.border
                          )}
                        >
                          {statusStyle.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {item.completedCount}/{item.totalItems} items
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="w-12 h-1 bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${(item.completedCount / item.totalItems) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {getRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
            <Button
              variant="link"
              size="sm"
              className="mt-3 p-0 h-auto text-xs"
              asChild
            >
              <Link href="/hr/onboarding">View All Onboardings</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
