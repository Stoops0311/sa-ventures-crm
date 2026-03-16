"use client"

import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserMultipleIcon,
  TaskDone01Icon,
  File01Icon,
  MoneyBag02Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function HRQuickActions() {
  const router = useRouter()

  const actions = [
    {
      label: "View Employees",
      icon: UserMultipleIcon,
      variant: "default" as const,
      onClick: () => router.push("/hr/employees"),
    },
    {
      label: "Manage Onboarding",
      icon: TaskDone01Icon,
      variant: "outline" as const,
      onClick: () => router.push("/hr/onboarding"),
    },
    {
      label: "Generate Letter",
      icon: File01Icon,
      variant: "outline" as const,
      onClick: () => router.push("/hr/letters"),
    },
    {
      label: "Run Payroll",
      icon: MoneyBag02Icon,
      variant: "outline" as const,
      disabled: true,
      tooltip: "Coming in Phase C",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) =>
          action.disabled ? (
            <Tooltip key={action.label}>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant}
                  className="w-full justify-start gap-2 h-9 opacity-50"
                  disabled
                >
                  <HugeiconsIcon
                    icon={action.icon}
                    className="size-4 shrink-0"
                    strokeWidth={1.5}
                  />
                  <span className="truncate">{action.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.tooltip}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              key={action.label}
              variant={action.variant}
              className="w-full justify-start gap-2 h-9"
              onClick={action.onClick}
            >
              <HugeiconsIcon
                icon={action.icon}
                className="size-4 shrink-0"
                strokeWidth={1.5}
              />
              <span className="truncate">{action.label}</span>
            </Button>
          )
        )}
      </CardContent>
    </Card>
  )
}
