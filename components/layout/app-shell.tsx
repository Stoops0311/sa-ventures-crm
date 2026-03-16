"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { GlobalSearch } from "@/components/layout/global-search"
import { usePresence } from "@/hooks/use-presence"
import type { UserRole } from "@/lib/constants"

interface AppShellProps {
  children: React.ReactNode
  role: UserRole
}

export function AppShell({ children, role }: AppShellProps) {
  usePresence()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar role={role} />
        <SidebarInset>
          <TopBar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
      <Toaster />
      <GlobalSearch />
    </TooltipProvider>
  )
}
