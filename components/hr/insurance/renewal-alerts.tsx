"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertDiamondIcon,
  Alert02Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function RenewalAlerts({
  onRowClick,
}: {
  onRowClick?: (enrollmentId: string) => void
}) {
  const expiring = useQuery(api.insurance.getExpiringSoon, { days: 30 })

  if (expiring === undefined) {
    return <Skeleton className="h-16 w-full" />
  }

  const urgent = expiring.filter((e) => e.daysRemaining <= 7)

  if (expiring.length === 0) {
    return (
      <Card className="border-l-4 border-l-green-500 bg-green-50">
        <CardContent className="flex items-center gap-3 p-4">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-5 text-green-600 shrink-0" />
          <div>
            <p className="font-sans font-semibold text-green-800 text-sm">All policies current</p>
            <p className="text-xs text-green-700">No policies expiring in the next 30 days</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isUrgent = urgent.length > 0
  const [open, setOpen] = useState(isUrgent)

  return (
    <Card
      className={cn(
        "border-l-4",
        isUrgent
          ? "border-l-red-500 bg-red-50"
          : "border-l-yellow-500 bg-yellow-50"
      )}
    >
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="flex items-center gap-3 p-4 cursor-pointer hover:opacity-80 transition-opacity">
            <HugeiconsIcon
              icon={isUrgent ? AlertDiamondIcon : Alert02Icon}
              className={cn(
                "size-5 shrink-0",
                isUrgent ? "text-red-600" : "text-yellow-600"
              )}
            />
            <div className="flex-1">
              <p
                className={cn(
                  "font-sans font-semibold text-sm",
                  isUrgent ? "text-red-800" : "text-yellow-800"
                )}
              >
                {isUrgent
                  ? `${urgent.length} ${urgent.length === 1 ? "policy" : "policies"} expiring within 7 days`
                  : `${expiring.length} ${expiring.length === 1 ? "policy" : "policies"} expiring within 30 days`}
              </p>
            </div>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-1">
            {expiring.map((enrollment) => (
              <button
                key={enrollment._id}
                className={cn(
                  "w-full flex items-center justify-between text-sm py-2 px-3 hover:bg-white/50 transition-colors text-left",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(enrollment._id)}
              >
                <span className="font-medium">{enrollment.employeeName}</span>
                <span className="font-mono text-muted-foreground text-xs">
                  {enrollment.policyNumber ?? "--"}
                </span>
                <span className="text-xs">{enrollment.expiryDate}</span>
                <span
                  className={cn(
                    "text-xs font-mono",
                    enrollment.daysRemaining <= 7
                      ? "text-red-600 font-bold"
                      : enrollment.daysRemaining <= 14
                        ? "text-red-600"
                        : "text-yellow-600"
                  )}
                >
                  {enrollment.daysRemaining} {enrollment.daysRemaining === 1 ? "day" : "days"}
                </span>
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
