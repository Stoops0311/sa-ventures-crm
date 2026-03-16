"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { HugeiconsIcon } from "@hugeicons/react"
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/hooks/use-current-user"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/articles", label: "Articles" },
  { href: "/contact", label: "Contact" },
]

const roleHomeRoutes: Record<string, string> = {
  admin: "/admin",
  salesperson: "/dashboard",
  dsm: "/dsm",
  hr: "/hr",
  vehicle: "/vehicle",
}

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { isSignedIn } = useAuth()
  const { user } = useCurrentUser()

  const dashboardHref = user
    ? roleHomeRoutes[user.role] ?? "/admin"
    : "/admin"

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1">
          <span className="text-xl font-bold tracking-tight text-primary">
            SA
          </span>
          <span className="text-xl font-bold tracking-tight">Ventures</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          {isSignedIn && (
            <Button variant="outline" asChild>
              <Link href={dashboardHref}>Dashboard</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <HugeiconsIcon
                icon={open ? Cancel01Icon : Menu01Icon}
                size={20}
              />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="mt-8 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "px-4 py-3 text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              {isSignedIn && (
                <div className="mt-4 px-4">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={dashboardHref} onClick={() => setOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                </div>
              )}
              <div className="mt-2 px-4">
                <Button asChild className="w-full">
                  <Link href="/contact" onClick={() => setOpen(false)}>
                    Get in Touch
                  </Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
