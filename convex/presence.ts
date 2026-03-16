import { query, mutation } from "./_generated/server"
import { getUserWithAnyRole } from "./lib/auth"
import { SESSION_GAP_MS } from "./lib/constants"

export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "salesperson"])
    if (!user) return []

    const allPresence = await ctx.db.query("presence").collect()

    const threshold = Date.now() - 60000 // 60 seconds ago
    const onlinePresence = allPresence.filter(
      (p) => p.lastSeen > threshold
    )

    // Join with user data
    const onlineUsers = await Promise.all(
      onlinePresence.map(async (p) => {
        const user = await ctx.db.get(p.userId)
        return {
          ...p,
          userName: user?.name ?? "Unknown",
          userRole: user?.role,
          userImageUrl: user?.imageUrl,
        }
      })
    )

    return onlineUsers
  },
})

function getDateString(timestamp: number): string {
  const d = new Date(timestamp)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    // Gracefully handle unauthenticated state (fires before Clerk is ready)
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) =>
        q.eq("externalId", identity.subject)
      )
      .unique()
    if (!user) return

    // Skip presence tracking for DSM users
    if (user.role === "dsm") return

    const now = Date.now()
    const todayStr = getDateString(now)

    // Update presence record (real-time online status)
    const existing = await ctx.db
      .query("presence")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, {
        lastSeen: now,
        isOnline: true,
      })
    } else {
      await ctx.db.insert("presence", {
        userId: user._id,
        lastSeen: now,
        isOnline: true,
      })
    }

    // Manage attendance sessions
    const activeSession = await ctx.db
      .query("attendanceSessions")
      .withIndex("byUserIdAndIsActive", (q) =>
        q.eq("userId", user._id).eq("isActive", true)
      )
      .first()

    if (activeSession) {
      const gap = now - activeSession.endTime
      const crossesMidnight = activeSession.date !== todayStr

      if (crossesMidnight || gap > SESSION_GAP_MS) {
        // Close the old session and start a new one
        await ctx.db.patch(activeSession._id, { isActive: false })
        await ctx.db.insert("attendanceSessions", {
          userId: user._id,
          date: todayStr,
          startTime: now,
          endTime: now,
          isActive: true,
        })
      } else {
        // Extend current session
        await ctx.db.patch(activeSession._id, { endTime: now })
      }
    } else {
      // No active session — create one
      await ctx.db.insert("attendanceSessions", {
        userId: user._id,
        date: todayStr,
        startTime: now,
        endTime: now,
        isActive: true,
      })
    }
  },
})
