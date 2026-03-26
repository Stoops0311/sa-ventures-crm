import { query, mutation, internalMutation, internalQuery, internalAction } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"
import { getUserWithAnyRole, requireUserWithAnyRole } from "./lib/auth"

const WBA_BASE_URL = () => process.env.WBA_BASE_URL!
const WBA_API_KEY = () => process.env.WBA_API_KEY!

// ─── Queries ──────────────────────────────────────────────────────────────────

export const listByLead = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "salesperson"])
    if (!user) return []

    if (user.role === "salesperson") {
      const lead = await ctx.db.get(args.leadId)
      if (!lead || lead.assignedTo !== user._id) return []
    }

    const messages = await ctx.db
      .query("scheduledMessages")
      .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
      .collect()

    // Sort newest first
    return messages.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const listAll = query({
  args: {
    whatsappStatus: v.optional(v.string()),
    smsStatus: v.optional(v.string()),
    triggerType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "salesperson"])
    if (!user) return []

    let messages = await ctx.db.query("scheduledMessages").collect()

    // Salesperson: filter to their leads only
    if (user.role === "salesperson") {
      const myLeadIds = new Set<string>()
      const myLeads = await ctx.db
        .query("leads")
        .withIndex("byAssignedTo", (q) => q.eq("assignedTo", user._id))
        .collect()
      for (const lead of myLeads) {
        myLeadIds.add(lead._id)
      }
      messages = messages.filter((m) => myLeadIds.has(m.leadId))
    }

    // Apply filters
    if (args.whatsappStatus) {
      messages = messages.filter((m) => m.whatsappStatus === args.whatsappStatus)
    }
    if (args.smsStatus) {
      messages = messages.filter((m) => m.smsStatus === args.smsStatus)
    }
    if (args.triggerType) {
      messages = messages.filter((m) => m.triggerType === args.triggerType)
    }

    // Enrich with lead names
    const enriched = await Promise.all(
      messages.map(async (m) => {
        const lead = await ctx.db.get(m.leadId)
        return {
          ...m,
          leadName: lead?.name ?? "Unknown",
          leadPhone: lead?.mobileNumber ?? "",
        }
      })
    )

    return enriched.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "salesperson"])
    if (!user) return { pending: 0, sent: 0, failed: 0, total: 0 }

    let messages = await ctx.db.query("scheduledMessages").collect()

    if (user.role === "salesperson") {
      const myLeadIds = new Set<string>()
      const myLeads = await ctx.db
        .query("leads")
        .withIndex("byAssignedTo", (q) => q.eq("assignedTo", user._id))
        .collect()
      for (const lead of myLeads) {
        myLeadIds.add(lead._id)
      }
      messages = messages.filter((m) => myLeadIds.has(m.leadId))
    }

    let pending = 0
    let sent = 0
    let failed = 0
    for (const m of messages) {
      if (m.whatsappStatus === "sent" || m.smsStatus === "sent") sent++
      else if (m.whatsappStatus === "failed" || m.smsStatus === "failed") failed++
      else if (m.whatsappStatus === "pending" || m.smsStatus === "pending") pending++
    }

    return { pending, sent, failed, total: messages.length }
  },
})

export const getPendingSuggestions = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["admin", "salesperson"])
    if (!user) return []

    const messages = await ctx.db
      .query("scheduledMessages")
      .withIndex("byLeadId", (q) => q.eq("leadId", args.leadId))
      .collect()

    return messages.filter(
      (m) =>
        m.triggerType === "auto_suggest" &&
        m.scheduledAt === 0 &&
        m.whatsappStatus === "pending" &&
        m.smsStatus === "pending"
    )
  },
})

// ─── Mutations ────────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    leadId: v.id("leads"),
    templateId: v.optional(v.id("messageTemplates")),
    message: v.string(),
    language: v.string(),
    scheduledAt: v.number(),
    channels: v.string(),
    triggerType: v.string(),
    attachedCreativeId: v.optional(v.id("projectCreatives")),
    attachedLeadPhotoId: v.optional(v.id("leadPhotos")),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["admin", "salesperson"])

    // Salesperson can only message their own leads
    if (user.role === "salesperson") {
      const lead = await ctx.db.get(args.leadId)
      if (!lead) throw new Error("Lead not found")
      if (lead.assignedTo !== user._id) {
        throw new Error("Unauthorized: not assigned to this lead")
      }
    }

    const hasAttachment = !!(args.attachedCreativeId || args.attachedLeadPhotoId)
    const now = Date.now()
    const messageId = await ctx.db.insert("scheduledMessages", {
      leadId: args.leadId,
      templateId: args.templateId,
      message: args.message,
      language: args.language,
      scheduledAt: args.scheduledAt,
      channels: args.channels,
      whatsappStatus: "pending",
      smsStatus: hasAttachment ? "skipped" : "pending",
      triggerType: args.triggerType,
      attachedCreativeId: args.attachedCreativeId,
      attachedLeadPhotoId: args.attachedLeadPhotoId,
      ...(hasAttachment ? { smsError: "Media attachments not supported on SMS" } : {}),
      createdBy: user._id,
      createdAt: now,
    })

    // If send now (scheduledAt <= now and not a sentinel)
    if (args.scheduledAt > 0 && args.scheduledAt <= now) {
      await ctx.db.patch(messageId, {
        whatsappStatus: "sending",
        ...(hasAttachment ? {} : { smsStatus: "sending" }),
      })
      await ctx.scheduler.runAfter(0, internal.messaging.sendMessage, {
        messageId,
      })
    }

    return messageId
  },
})

export const cancel = mutation({
  args: { messageId: v.id("scheduledMessages") },
  handler: async (ctx, args) => {
    await requireUserWithAnyRole(ctx, ["admin", "salesperson"])
    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error("Message not found")

    await ctx.db.patch(args.messageId, {
      whatsappStatus: "cancelled",
      smsStatus: "cancelled",
      cancelledAt: Date.now(),
    })
  },
})

export const confirmSuggested = mutation({
  args: { messageId: v.id("scheduledMessages") },
  handler: async (ctx, args) => {
    await requireUserWithAnyRole(ctx, ["admin", "salesperson"])
    const message = await ctx.db.get(args.messageId)
    if (!message) throw new Error("Message not found")
    if (message.triggerType !== "auto_suggest" || message.scheduledAt !== 0) {
      throw new Error("Not a pending suggestion")
    }

    const now = Date.now()
    await ctx.db.patch(args.messageId, {
      scheduledAt: now,
      whatsappStatus: "sending",
      smsStatus: "sending",
    })

    await ctx.scheduler.runAfter(0, internal.messaging.sendMessage, {
      messageId: args.messageId,
    })
  },
})

export const updateSendResult = internalMutation({
  args: {
    messageId: v.id("scheduledMessages"),
    whatsappStatus: v.string(),
    smsStatus: v.string(),
    whatsappMessageId: v.optional(v.string()),
    smsMessageId: v.optional(v.string()),
    whatsappError: v.optional(v.string()),
    smsError: v.optional(v.string()),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { messageId, ...updates } = args
    await ctx.db.patch(messageId, updates)
  },
})

export const processScheduledMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    // Find pending messages whose time has come (scheduledAt > 0 to skip suggestions)
    const pending = await ctx.db
      .query("scheduledMessages")
      .withIndex("byWhatsappStatus", (q) => q.eq("whatsappStatus", "pending"))
      .collect()

    const ready = pending.filter(
      (m) =>
        m.scheduledAt > 0 &&
        m.scheduledAt <= now &&
        m.smsStatus === "pending"
    )

    // Batch limit: 20 per run
    const batch = ready.slice(0, 20)

    for (const message of batch) {
      // Atomically mark as sending to prevent double-sends
      await ctx.db.patch(message._id, {
        whatsappStatus: "sending",
        smsStatus: "sending",
      })
      await ctx.scheduler.runAfter(0, internal.messaging.sendMessage, {
        messageId: message._id,
      })
    }
  },
})

// ─── Actions ──────────────────────────────────────────────────────────────────

export const getMessageInternal = internalQuery({
  args: { messageId: v.id("scheduledMessages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId)
  },
})

export const getLeadInternal = internalQuery({
  args: { leadId: v.id("leads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.leadId)
  },
})

export const getWhatsappSessionByUserId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whatsappSessions")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("sessionType"), "whatsapp"))
      .first()
  },
})

export const getSmsDeviceInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("smsDevices").first()
  },
})

// Internal query to fetch attachment file info (storageId, fileName, fileType)
export const getAttachmentInternal = internalQuery({
  args: {
    attachedCreativeId: v.optional(v.id("projectCreatives")),
    attachedLeadPhotoId: v.optional(v.id("leadPhotos")),
  },
  handler: async (ctx, args) => {
    if (args.attachedCreativeId) {
      const creative = await ctx.db.get(args.attachedCreativeId)
      if (!creative) return null
      const url = await ctx.storage.getUrl(creative.storageId)
      return { storageId: creative.storageId, fileName: creative.fileName, fileType: creative.fileType, url }
    }
    if (args.attachedLeadPhotoId) {
      const photo = await ctx.db.get(args.attachedLeadPhotoId)
      if (!photo) return null
      const url = await ctx.storage.getUrl(photo.storageId)
      return { storageId: photo.storageId, fileName: photo.fileName, fileType: photo.fileType, url }
    }
    return null
  },
})

export const sendMessage = internalAction({
  args: { messageId: v.id("scheduledMessages") },
  handler: async (ctx, args) => {
    const message = await ctx.runQuery(internal.messaging.getMessageInternal, {
      messageId: args.messageId,
    })
    if (!message) return

    // Already sent or cancelled
    if (message.whatsappStatus !== "sending" && message.smsStatus !== "sending") {
      return
    }

    const lead = await ctx.runQuery(internal.messaging.getLeadInternal, {
      leadId: message.leadId,
    })
    if (!lead) {
      await ctx.runMutation(internal.messaging.updateSendResult, {
        messageId: args.messageId,
        whatsappStatus: "failed",
        smsStatus: "failed",
        whatsappError: "Lead not found",
        smsError: "Lead not found",
        sentAt: Date.now(),
      })
      return
    }

    // Check if this message has an attachment
    const hasAttachment = !!(message.attachedCreativeId || message.attachedLeadPhotoId)
    let attachmentInfo: { fileName: string; fileType: string; url: string | null } | null = null

    if (hasAttachment) {
      attachmentInfo = await ctx.runQuery(internal.messaging.getAttachmentInternal, {
        attachedCreativeId: message.attachedCreativeId,
        attachedLeadPhotoId: message.attachedLeadPhotoId,
      })
    }

    // Get WhatsApp session for the lead's assigned salesperson
    const waSession = await ctx.runQuery(internal.messaging.getWhatsappSessionByUserId, {
      userId: lead.assignedTo,
    })

    // Get SMS device
    const smsDevice = await ctx.runQuery(internal.messaging.getSmsDeviceInternal, {})

    let whatsappStatus = "skipped"
    let smsStatus = hasAttachment ? "skipped" : "skipped"
    let whatsappMessageId: string | undefined
    let smsMessageId: string | undefined
    let whatsappError: string | undefined
    let smsError: string | undefined
    if (hasAttachment) {
      smsError = "Media attachments not supported on SMS"
    }

    // Send WhatsApp (if session connected and channel includes whatsapp)
    if (message.channels === "both" || message.channels === "whatsapp") {
      if (waSession && waSession.status === "connected" && waSession.bridgeSessionId) {
        try {
          let res: Response

          if (attachmentInfo?.url) {
            // Fetch the file from Convex storage and send as media
            const fileRes = await fetch(attachmentInfo.url)
            if (!fileRes.ok) throw new Error("Failed to download attachment from storage")
            const arrayBuffer = await fileRes.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString("base64")

            const isImage = attachmentInfo.fileType.startsWith("image/")
            const mediaBody: Record<string, string> = {
              userId: waSession.bridgeSessionId,
              to: lead.mobileNumber,
              type: isImage ? "image" : "document",
              media: base64,
            }

            // Add caption (the message text)
            if (message.message) {
              mediaBody.caption = message.message
            }

            // For documents, add mimetype and filename
            if (!isImage) {
              mediaBody.mimetype = attachmentInfo.fileType
              mediaBody.filename = attachmentInfo.fileName
            }

            res = await fetch(`${WBA_BASE_URL()}/messages/send-media`, {
              method: "POST",
              headers: {
                "x-api-key": WBA_API_KEY(),
                "Content-Type": "application/json",
              },
              body: JSON.stringify(mediaBody),
            })
          } else {
            // No attachment or URL missing — send plain text
            res = await fetch(`${WBA_BASE_URL()}/messages/send`, {
              method: "POST",
              headers: {
                "x-api-key": WBA_API_KEY(),
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: waSession.bridgeSessionId,
                to: lead.mobileNumber,
                message: message.message,
              }),
            })
          }

          if (res.ok) {
            const data = await res.json()
            whatsappStatus = "sent"
            whatsappMessageId = data.messageId
          } else {
            const text = await res.text()
            whatsappStatus = "failed"
            whatsappError = `API error: ${res.status} ${text}`
          }
        } catch (err) {
          whatsappStatus = "failed"
          whatsappError = err instanceof Error ? err.message : "Unknown error"
        }
      } else {
        whatsappStatus = "failed"
        whatsappError = waSession ? "Session not connected" : "No WhatsApp session"
      }
    }

    // Send SMS (if device online and channel includes sms) — skip for media messages
    if (!hasAttachment && (message.channels === "both" || message.channels === "sms")) {
      if (smsDevice && smsDevice.status !== "pending") {
        try {
          const res = await fetch(`${WBA_BASE_URL()}/sms/send`, {
            method: "POST",
            headers: {
              "x-api-key": WBA_API_KEY(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              to: lead.mobileNumber,
              message: message.message,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            smsStatus = "sent"
            smsMessageId = data.id
          } else {
            const text = await res.text()
            smsStatus = "failed"
            smsError = `API error: ${res.status} ${text}`
          }
        } catch (err) {
          smsStatus = "failed"
          smsError = err instanceof Error ? err.message : "Unknown error"
        }
      } else {
        smsStatus = "failed"
        smsError = "No SMS device configured"
      }
    }

    await ctx.runMutation(internal.messaging.updateSendResult, {
      messageId: args.messageId,
      whatsappStatus,
      smsStatus,
      whatsappMessageId,
      smsMessageId,
      whatsappError,
      smsError,
      sentAt: Date.now(),
    })
  },
})
