"use client"

import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  FileUploadIcon,
  Building06Icon,
  UserGroupIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function QuickActions() {
  const router = useRouter()

  const actions = [
    {
      label: "Import Leads",
      icon: FileUploadIcon,
      variant: "default" as const,
      onClick: () => router.push("/admin/import"),
    },
    {
      label: "Create Project",
      icon: Building06Icon,
      variant: "outline" as const,
      onClick: () => router.push("/admin/projects?new=true"),
    },
    {
      label: "Manage Users",
      icon: UserGroupIcon,
      variant: "outline" as const,
      onClick: () => router.push("/admin/users"),
    },
    {
      label: "Add Lead",
      icon: UserAdd01Icon,
      variant: "outline" as const,
      onClick: () => router.push("/admin/leads?new=true"),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
