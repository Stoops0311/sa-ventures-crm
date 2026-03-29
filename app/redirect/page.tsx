import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

const roleHomeRoutes: Record<string, string> = {
  admin: "/admin",
  salesperson: "/dashboard",
  dsm: "/dsm",
  hr: "/hr",
  vehicle: "/vehicle",
  receptionist: "/receptionist",
}

export default async function RedirectPage() {
  const session = await auth()
  const role = (session.sessionClaims?.metadata?.role as string) ?? "dsm"
  redirect(roleHomeRoutes[role] ?? "/dsm")
}
