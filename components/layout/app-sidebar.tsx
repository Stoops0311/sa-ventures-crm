"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  UserMultipleIcon,
  Building06Icon,
  UserGroupIcon,
  FileUploadIcon,
  Clock01Icon,
  TaskDone01Icon,
  Logout01Icon,
  UserCheck01Icon,
  UserAccountIcon,
  File01Icon,
  MoneyBag02Icon,
  Shield01Icon,
  HelpCircleIcon,
  BulbIcon,
  Car01Icon,
  Route01Icon,
  Location01Icon,
  Message01Icon,
  Settings01Icon,
  Edit01Icon,
  ContactBookIcon,
  Book02Icon,
} from "@hugeicons/core-free-icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { getRoleStyle } from "@/lib/constants"
import type { UserRole } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { IconSvgElement } from "@hugeicons/react"

interface NavItem {
  label: string
  href: string
  icon: IconSvgElement
  disabled?: boolean
  disabledTooltip?: string
  badge?: React.ReactNode
}

const NAV_ITEMS: Record<UserRole, { items: NavItem[]; separatorAfter?: number[] }> = {
  admin: {
    items: [
      { label: "Dashboard", href: "/admin", icon: Home01Icon },
      { label: "Leads", href: "/admin/leads", icon: UserMultipleIcon },
      { label: "Projects", href: "/admin/projects", icon: Building06Icon },
      { label: "Users", href: "/admin/users", icon: UserGroupIcon },
      { label: "Attendance", href: "/admin/attendance", icon: UserCheck01Icon },
      { label: "Import", href: "/admin/import", icon: FileUploadIcon },
      { label: "Messages", href: "/admin/messages", icon: Message01Icon },
      { label: "Articles", href: "/admin/articles", icon: Edit01Icon },
      { label: "Inquiries", href: "/admin/inquiries", icon: ContactBookIcon },
      { label: "Vehicles", href: "/admin/vehicles", icon: Car01Icon },
      { label: "My HR", href: "/admin/hr", icon: UserAccountIcon },
      { label: "Activity Log", href: "/admin/activity", icon: Clock01Icon },
      { label: "Settings", href: "/admin/settings", icon: Settings01Icon },
    ],
    separatorAfter: [8, 10], // separator after "Inquiries", after "Vehicles" + "My HR"
  },
  salesperson: {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Home01Icon },
      { label: "My Leads", href: "/dashboard/leads", icon: UserMultipleIcon },
      { label: "Messages", href: "/dashboard/messages", icon: Message01Icon },
      { label: "My Attendance", href: "/dashboard/attendance", icon: UserCheck01Icon },
      { label: "My HR", href: "/dashboard/hr", icon: UserAccountIcon },
      { label: "Activity Log", href: "/dashboard/activity", icon: Clock01Icon },
    ],
    separatorAfter: [3, 4], // separator after "My Attendance", after "My HR"
  },
  dsm: {
    items: [
      { label: "Dashboard", href: "/dsm", icon: Home01Icon },
      { label: "My Submissions", href: "/dsm/submissions", icon: TaskDone01Icon },
      { label: "Training", href: "/dsm/training", icon: Book02Icon },
    ],
  },
  hr: {
    items: [
      { label: "Dashboard", href: "/hr", icon: Home01Icon },
      { label: "Employees", href: "/hr/employees", icon: UserMultipleIcon },
      { label: "Onboarding", href: "/hr/onboarding", icon: TaskDone01Icon },
      { label: "Letters", href: "/hr/letters", icon: File01Icon },
      { label: "Payroll", href: "/hr/payroll", icon: MoneyBag02Icon },
      { label: "Insurance", href: "/hr/insurance", icon: Shield01Icon },
      { label: "Queries", href: "/hr/queries", icon: HelpCircleIcon },
      { label: "Suggestions", href: "/hr/suggestions", icon: BulbIcon },
      { label: "My Attendance", href: "/hr/attendance", icon: UserCheck01Icon },
    ],
    separatorAfter: [4, 7], // separator after "Payroll", after "Suggestions"
  },
  vehicle: {
    items: [
      { label: "Dashboard", href: "/vehicle", icon: Home01Icon },
      { label: "Fleet", href: "/vehicle/fleet", icon: Car01Icon },
      { label: "Trips", href: "/vehicle/trips", icon: Route01Icon },
      { label: "GPS Tracking", href: "/vehicle/gps", icon: Location01Icon },
      { label: "My Attendance", href: "/vehicle/attendance", icon: UserCheck01Icon },
    ],
    separatorAfter: [2, 3], // separator after "Trips", after "GPS Tracking"
  },
}

interface AppSidebarProps {
  role: UserRole
}

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { user } = useCurrentUser()

  const nav = NAV_ITEMS[role]
  const roleStyle = getRoleStyle(role)

  // Onboarding notification dot for salesperson/admin "My HR" items
  const myOnboarding = useQuery(
    api.onboarding.getMyOnboarding,
    role === "salesperson" || role === "admin" ? {} : "skip"
  )
  const hasIncompleteOnboarding =
    myOnboarding && myOnboarding.status !== "completed"

  // Pending onboarding count for HR sidebar badge
  const pendingOnboardingCount = useQuery(
    api.onboarding.getPendingCount,
    role === "hr" ? {} : "skip"
  )

  // New inquiry count for admin sidebar badge
  const newInquiryCount = useQuery(
    api.websiteInquiries.count,
    role === "admin" ? {} : "skip"
  )

  function isActive(href: string) {
    if (href === "/admin" || href === "/dashboard" || href === "/dsm" || href === "/hr" || href === "/vehicle") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-8 items-center gap-2 px-2">
          <span className="font-sans text-lg font-bold tracking-tight text-primary">
            SA
          </span>
          <span className="font-sans text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            Ventures
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {nav.items.map((item, index) => (
              <div key={item.href}>
                <SidebarMenuItem>
                  {item.disabled ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          className="opacity-50 pointer-events-none"
                          tooltip={item.disabledTooltip ?? item.label}
                        >
                          <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        {item.disabledTooltip}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <div className="relative">
                          <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                          {item.label === "My HR" && hasIncompleteOnboarding && (
                            <span className="absolute -top-0.5 -right-0.5 size-1.5 bg-destructive rounded-full" />
                          )}
                        </div>
                        <span>{item.label}</span>
                        {item.label === "Onboarding" && typeof pendingOnboardingCount === "number" && pendingOnboardingCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-auto h-5 min-w-5 px-1 text-[10px] font-mono bg-primary/10 text-primary border-0"
                          >
                            {pendingOnboardingCount}
                          </Badge>
                        )}
                        {item.label === "Inquiries" && typeof newInquiryCount === "number" && newInquiryCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="ml-auto h-5 min-w-5 px-1 text-[10px] font-mono bg-primary/10 text-primary border-0"
                          >
                            {newInquiryCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
                {nav.separatorAfter?.includes(index) && (
                  <SidebarSeparator className="my-1" />
                )}
              </div>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="cursor-pointer"
                  tooltip={user?.name ?? "Account"}
                >
                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center border text-xs font-medium",
                      "bg-muted text-muted-foreground"
                    )}
                  >
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={user.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span>{user?.name?.charAt(0).toUpperCase() ?? "?"}</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                    <span className="truncate text-xs font-medium">
                      {user?.name ?? "Loading..."}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "w-fit text-[10px] px-1.5 py-0 h-4",
                        roleStyle.bg,
                        roleStyle.text,
                        roleStyle.border,
                        "border"
                      )}
                    >
                      {roleStyle.label}
                    </Badge>
                  </div>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="start"
                className="w-56"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2"
                  onClick={() => signOut()}
                >
                  <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-4" />
                  Sign out
                </Button>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
