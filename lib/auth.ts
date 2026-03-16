import { type Roles } from "@/types/globals"
import { auth } from "@clerk/nextjs/server"

export async function checkRole(role: Roles) {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata?.role === role
}

export async function getUserRole(): Promise<Roles | undefined> {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata?.role
}

export async function getConvexToken() {
  return (
    (await (await auth()).getToken({ template: "convex" })) ??
    undefined
  )
}
