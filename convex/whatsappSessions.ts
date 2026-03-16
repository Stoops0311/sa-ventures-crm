import { query, mutation, action, internalMutation, internalQuery, internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"
import {
  getUserWithAnyRole,
  requireUserWithAnyRole,
  requireUserWithRole,
} from "./lib/auth"

const WBA_BASE_URL = () => process.env.WBA_BASE_URL!
const WBA_API_KEY = () => process.env.WBA_API_KEY!

// ─── Queries ──────────────────────────────────────────────────────────────────

export const getMySession = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "salesperson"])
    if (!user) return null
    return await ctx.db
      .query("whatsappSessions")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("sessionType"), "whatsapp"))
      .first()
  },
})

export const getSessionByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whatsappSessions")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("sessionType"), "whatsapp"))
      .first()
  },
})

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["admin"])
    if (!user) return []
    const sessions = await ctx.db
      .query("whatsappSessions")
      .filter((q) => q.eq(q.field("sessionType"), "whatsapp"))
      .collect()
    // Enrich with user names
    const enriched = await Promise.all(
      sessions.map(async (s) => {
        const sessionUser = s.userId ? await ctx.db.get(s.userId) : null
        return { ...s, userName: sessionUser?.name ?? "Unknown" }
      })
    )
    return enriched
  },
})

export const getSmsDevice = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "salesperson"])
    if (!user) return null
    return await ctx.db.query("smsDevices").first()
  },
})

export const getSmsDeviceInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("smsDevices").first()
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

export const createSession = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    // Check if user already has a session
    const existing = await ctx.db
      .query("whatsappSessions")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("sessionType"), "whatsapp"))
      .first()
    if (existing) throw new Error("You already have a WhatsApp session")

    const now = Date.now()
    const sessionId = await ctx.db.insert("whatsappSessions", {
      userId: user._id,
      sessionType: "whatsapp",
      bridgeSessionId: "", // populated by action
      name: args.name,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })

    await ctx.scheduler.runAfter(0, internal.whatsappSessions.initBridgeSession, {
      sessionId,
    })

    return sessionId
  },
})

export const updateSessionStatus = internalMutation({
  args: {
    sessionId: v.id("whatsappSessions"),
    bridgeSessionId: v.optional(v.string()),
    status: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args
    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (updates.bridgeSessionId !== undefined) patch.bridgeSessionId = updates.bridgeSessionId
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.phone !== undefined) patch.phone = updates.phone
    await ctx.db.patch(sessionId, patch)
  },
})

export const deleteSession = mutation({
  args: { sessionId: v.id("whatsappSessions") },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])
    const session = await ctx.db.get(args.sessionId)
    if (!session) throw new Error("Session not found")

    // Salesperson can only delete their own session
    if (user.role === "salesperson" && session.userId !== user._id) {
      throw new Error("Unauthorized")
    }

    if (session.bridgeSessionId) {
      await ctx.scheduler.runAfter(0, internal.whatsappSessions.logoutBridgeSession, {
        bridgeSessionId: session.bridgeSessionId,
      })
    }

    await ctx.db.delete(args.sessionId)
  },
})

export const createSmsDevice = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserWithRole(ctx, "admin")

    // Check if device already exists
    const existing = await ctx.db.query("smsDevices").first()
    if (existing) throw new Error("SMS device already configured")

    const now = Date.now()
    const deviceId = await ctx.db.insert("smsDevices", {
      bridgeDeviceId: "",
      deviceKey: "",
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })

    await ctx.scheduler.runAfter(0, internal.whatsappSessions.initSmsDevice, {
      deviceId,
    })

    return deviceId
  },
})

export const updateSmsDevice = internalMutation({
  args: {
    deviceId: v.id("smsDevices"),
    bridgeDeviceId: v.optional(v.string()),
    deviceKey: v.optional(v.string()),
    status: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { deviceId, ...updates } = args
    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value
    }
    await ctx.db.patch(deviceId, patch)
  },
})

export const deleteSmsDevice = mutation({
  args: { deviceId: v.id("smsDevices") },
  handler: async (ctx, args) => {
    await requireUserWithRole(ctx, "admin")
    await ctx.db.delete(args.deviceId)
  },
})

// ─── Internal helpers ─────────────────────────────────────────────────────────

export const getSessionInternal = internalQuery({
  args: { sessionId: v.id("whatsappSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId)
  },
})

// ─── Actions (Bridge API calls) ──────────────────────────────────────────────

export const initBridgeSession = internalAction({
  args: { sessionId: v.id("whatsappSessions") },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.whatsappSessions.getSessionInternal, {
      sessionId: args.sessionId,
    })
    if (!session) throw new Error("Session not found")

    const res = await fetch(`${WBA_BASE_URL()}/auth/create-session`, {
      method: "POST",
      headers: {
        "x-api-key": WBA_API_KEY(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: session.name }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Bridge API create-session failed: ${res.status} ${text}`)
    }

    const data = await res.json()

    await ctx.runMutation(internal.whatsappSessions.updateSessionStatus, {
      sessionId: args.sessionId,
      bridgeSessionId: data.userId,
      status: data.status ?? "qr_ready",
    })
  },
})

export const fetchQrCode = action({
  args: { bridgeSessionId: v.string() },
  handler: async (_ctx, args) => {
    const res = await fetch(`${WBA_BASE_URL()}/auth/qr/${args.bridgeSessionId}`, {
      headers: { "x-api-key": WBA_API_KEY() },
    })

    if (!res.ok) {
      const text = await res.text()
      return { error: true, message: `QR fetch failed: ${res.status} ${text}` }
    }

    const data = await res.json()
    return { error: false, qr: data.qr, qrRaw: data.qrRaw }
  },
})

export const pollSessionStatus = action({
  args: { bridgeSessionId: v.string(), sessionId: v.id("whatsappSessions") },
  handler: async (ctx, args) => {
    const res = await fetch(`${WBA_BASE_URL()}/auth/status/${args.bridgeSessionId}`, {
      headers: { "x-api-key": WBA_API_KEY() },
    })

    if (!res.ok) {
      return { error: true, status: "unknown" }
    }

    const data = await res.json()

    // Update Convex session if status changed
    if (data.status === "connected" || data.status === "disconnected") {
      await ctx.runMutation(internal.whatsappSessions.updateSessionStatus, {
        sessionId: args.sessionId,
        status: data.status,
        phone: data.phone ?? undefined,
      })
    }

    return { error: false, status: data.status, phone: data.phone }
  },
})

export const logoutBridgeSession = internalAction({
  args: { bridgeSessionId: v.string() },
  handler: async (_ctx, args) => {
    const res = await fetch(`${WBA_BASE_URL()}/auth/logout/${args.bridgeSessionId}`, {
      method: "POST",
      headers: { "x-api-key": WBA_API_KEY() },
    })
    if (!res.ok) {
      const text = await res.text()
      console.error(`Bridge API logout failed: ${res.status} ${text}`)
    }
  },
})

export const initSmsDevice = internalAction({
  args: { deviceId: v.id("smsDevices") },
  handler: async (ctx, args) => {
    const res = await fetch(`${WBA_BASE_URL()}/sms/devices`, {
      method: "POST",
      headers: {
        "x-api-key": WBA_API_KEY(),
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Bridge API SMS device creation failed: ${res.status} ${text}`)
    }

    const data = await res.json()

    await ctx.runMutation(internal.whatsappSessions.updateSmsDevice, {
      deviceId: args.deviceId,
      bridgeDeviceId: data.id,
      deviceKey: data.device_key,
      status: data.status ?? "pending",
    })
  },
})

export const fetchSmsQr = action({
  args: {},
  handler: async (_ctx) => {
    const res = await fetch(`${WBA_BASE_URL()}/sms/setup-qr`, {
      headers: { "x-api-key": WBA_API_KEY() },
    })

    if (!res.ok) {
      const text = await res.text()
      return { error: true, message: `SMS QR fetch failed: ${res.status} ${text}` }
    }

    const data = await res.json()
    return { error: false, qr: data.qr, url: data.url }
  },
})

export const checkSmsHealth = action({
  args: {},
  handler: async (ctx) => {
    const res = await fetch(`${WBA_BASE_URL()}/sms/health`, {
      headers: { "x-api-key": WBA_API_KEY() },
    })

    if (!res.ok) {
      return { enabled: false, device: "offline" }
    }

    const data = await res.json()
    const bridgeStatus = data.device === "online" ? "online" : "offline"

    // Sync Bridge API status back to the database
    const smsDevice = await ctx.runQuery(internal.whatsappSessions.getSmsDeviceInternal)
    if (smsDevice && smsDevice.bridgeDeviceId && smsDevice.status !== bridgeStatus) {
      await ctx.runMutation(internal.whatsappSessions.updateSmsDevice, {
        deviceId: smsDevice._id,
        status: bridgeStatus,
      })
    }

    return { enabled: data.enabled, device: data.device }
  },
})
