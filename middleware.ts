import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/",
  "/about",
  "/contact",
  "/projects",
  "/projects/(.*)",
  "/articles",
  "/articles/(.*)",
  "/terms",
  "/privacy",
  "/partner",
])

const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"])

const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isDSMRoute = createRouteMatcher(["/dsm(.*)"])
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"])
const isHRRoute = createRouteMatcher(["/hr(.*)"])
const isVehicleRoute = createRouteMatcher(["/vehicle(.*)"])
const isReceptionistRoute = createRouteMatcher(["/receptionist(.*)"])

const roleHomeRoutes: Record<string, string> = {
  admin: "/admin",
  salesperson: "/dashboard",
  dsm: "/dsm",
  hr: "/hr",
  vehicle: "/vehicle",
  receptionist: "/receptionist",
}

export default clerkMiddleware(async (auth, req) => {
  const session = await auth()

  // Redirect authenticated users away from sign-in/sign-up to their dashboard
  if (isAuthRoute(req) && session.userId) {
    const role = (session.sessionClaims?.metadata?.role as string) ?? "dsm"
    const homeRoute = roleHomeRoutes[role] ?? "/dsm"
    return NextResponse.redirect(new URL(homeRoute, req.url))
  }

  // Public routes are accessible to everyone (logged in or not)
  if (isPublicRoute(req)) return

  if (!session.userId) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.url)
    return NextResponse.redirect(signInUrl)
  }

  const role = (session.sessionClaims?.metadata?.role as string) ?? "dsm"
  const homeRoute = roleHomeRoutes[role] ?? "/dsm"

  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL(homeRoute, req.url))
  }

  if (isDSMRoute(req) && role !== "dsm" && role !== "admin") {
    return NextResponse.redirect(new URL(homeRoute, req.url))
  }

  if (
    isDashboardRoute(req) &&
    role !== "salesperson" &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL(homeRoute, req.url))
  }

  if (isHRRoute(req) && role !== "hr" && role !== "admin") {
    return NextResponse.redirect(new URL(homeRoute, req.url))
  }

  if (isVehicleRoute(req) && role !== "vehicle" && role !== "admin") {
    return NextResponse.redirect(new URL(homeRoute, req.url))
  }

  if (isReceptionistRoute(req) && role !== "receptionist" && role !== "admin") {
    return NextResponse.redirect(new URL(homeRoute, req.url))
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
