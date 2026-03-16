"use client"

import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

const PAGE_TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/leads": "Leads",
  "/admin/projects": "Projects",
  "/admin/users": "Users",
  "/admin/import": "Import",
  "/admin/activity": "Activity Log",
  "/admin/attendance": "Attendance",
  "/admin/articles": "Articles",
  "/admin/articles/new": "New Article",
  "/admin/inquiries": "Website Inquiries",
  "/admin/hr": "My HR",
  "/dashboard": "Dashboard",
  "/dashboard/leads": "My Leads",
  "/dashboard/activity": "Activity Log",
  "/dashboard/attendance": "My Attendance",
  "/dashboard/hr": "My HR",
  "/dashboard/hr/onboarding": "Onboarding",
  "/dsm": "Dashboard",
  "/dsm/submissions": "My Submissions",
  "/hr": "Dashboard",
  "/hr/employees": "Employees",
  "/hr/onboarding": "Onboarding",
  "/hr/letters": "Letters",
  "/hr/payroll": "Payroll",
  "/hr/insurance": "Insurance",
  "/hr/queries": "Queries",
  "/hr/suggestions": "Suggestions",
}

function getPageTitle(pathname: string): string {
  // Try exact match first
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]

  // Try prefix match (e.g. /admin/leads/123 -> "Leads")
  const segments = pathname.split("/")
  while (segments.length > 1) {
    segments.pop()
    const prefix = segments.join("/")
    if (PAGE_TITLES[prefix]) return PAGE_TITLES[prefix]
  }

  return "Dashboard"
}

export function TopBar() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  function handleSearchClick() {
    // Dispatch Cmd+K event to open global search
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
  }

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-6" />
      <h1 className="font-sans text-sm font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleSearchClick}
          className="text-muted-foreground"
        >
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </header>
  )
}
