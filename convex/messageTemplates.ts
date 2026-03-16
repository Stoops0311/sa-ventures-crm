import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { requireUserWithRole } from "./lib/auth"

export const list = query({
  args: {
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.isActive !== undefined) {
      return await ctx.db
        .query("messageTemplates")
        .withIndex("byIsActive", (q) => q.eq("isActive", args.isActive!))
        .collect()
    }
    return await ctx.db.query("messageTemplates").collect()
  },
})

export const getByTriggerStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messageTemplates")
      .withIndex("byTriggerStatus", (q) => q.eq("triggerStatus", args.status))
      .collect()
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    bodyEn: v.string(),
    bodyHi: v.string(),
    triggerStatus: v.optional(v.string()),
    triggerBehavior: v.optional(v.string()),
    autoDelayMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireUserWithRole(ctx, "admin")
    const now = Date.now()
    return await ctx.db.insert("messageTemplates", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const update = mutation({
  args: {
    templateId: v.id("messageTemplates"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    bodyEn: v.optional(v.string()),
    bodyHi: v.optional(v.string()),
    triggerStatus: v.optional(v.string()),
    triggerBehavior: v.optional(v.string()),
    autoDelayMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireUserWithRole(ctx, "admin")
    const { templateId, ...updates } = args
    const filtered: Record<string, unknown> = { updatedAt: Date.now() }
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filtered[key] = value
    }
    await ctx.db.patch(templateId, filtered)
  },
})

export const toggleActive = mutation({
  args: { templateId: v.id("messageTemplates") },
  handler: async (ctx, args) => {
    await requireUserWithRole(ctx, "admin")
    const template = await ctx.db.get(args.templateId)
    if (!template) throw new Error("Template not found")
    await ctx.db.patch(args.templateId, {
      isActive: !template.isActive,
      updatedAt: Date.now(),
    })
  },
})

// Seed default templates — admin-only, safe to call multiple times
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserWithRole(ctx, "admin")

    // Check if already seeded
    const existing = await ctx.db.query("messageTemplates").first()
    if (existing) throw new Error("Templates already seeded. Delete existing templates first or use the admin UI to manage them.")

    const now = Date.now()
    const templates = [
      {
        name: "Site Visit Thank You",
        slug: "thank_you_visit",
        bodyEn: "Hi {{leadName}}, thank you for visiting the project today.\nHope you liked the property. Please let me know if you need any more details about pricing or availability.",
        bodyHi: "नमस्ते {{leadName}}, आज साइट विजिट करने के लिए धन्यवाद।\nउम्मीद है आपको प्रॉपर्टी पसंद आई होगी। प्राइस या अवेलेबिलिटी की जानकारी चाहिए तो जरूर बताएं।",
        triggerStatus: "Visit Done",
        triggerBehavior: "auto_schedule",
        autoDelayMs: 3600000,
      },
      {
        name: "Booking Assistance",
        slug: "booking_confirmation",
        bodyEn: "Hi {{leadName}}, if you are planning to proceed with the booking, I can guide you with the complete process.",
        bodyHi: "नमस्ते {{leadName}}, अगर आप बुकिंग के लिए आगे बढ़ना चाहते हैं तो मैं आपको पूरा प्रोसेस समझाने में मदद कर सकता हूँ।",
        triggerStatus: "Booking Done",
        triggerBehavior: "auto_schedule",
        autoDelayMs: 0,
      },
      {
        name: "Follow-Up Message",
        slug: "follow_up_reminder",
        bodyEn: "Hi {{leadName}}, just checking in after your site visit.\nPlease let me know if you have any questions or if you would like to discuss the booking process.",
        bodyHi: "नमस्ते {{leadName}}, आपकी साइट विजिट के बाद फॉलो-अप कर रहा हूँ।\nअगर कोई सवाल हो या बुकिंग के बारे में बात करनी हो तो कृपया बताएं।",
        triggerStatus: "Follow Up",
        triggerBehavior: "auto_suggest",
      },
      {
        name: "Visit Scheduled Reminder",
        slug: "visit_scheduled_reminder",
        bodyEn: "Hi {{leadName}}, if you would like to visit the site again with your family, I would be happy to arrange a revisit at your convenient time.",
        bodyHi: "नमस्ते {{leadName}}, अगर आप परिवार के साथ दोबारा साइट विजिट करना चाहें तो मैं आपके लिए री-विजिट अरेंज कर सकता हूँ। कृपया अपना सुविधाजनक समय बताएं।",
        triggerStatus: "Visit Scheduled",
        triggerBehavior: "auto_suggest",
      },
      {
        name: "No Response Follow-Up",
        slug: "no_response_followup",
        bodyEn: "Hi {{leadName}}, just checking in after your site visit. Please let me know if you need any more details about the property.",
        bodyHi: "नमस्ते {{leadName}}, आपकी साइट विजिट के बाद फॉलो-अप कर रहा हूँ। अगर आपको प्रॉपर्टी के बारे में और जानकारी चाहिए तो जरूर बताएं।",
        triggerStatus: "No Response",
        triggerBehavior: "auto_suggest",
      },
      {
        name: "Asking for Feedback",
        slug: "feedback_request",
        bodyEn: "Hi {{leadName}}, hope you are doing well. Just wanted to know your thoughts about the property you visited.",
        bodyHi: "नमस्ते {{leadName}}, आशा है आप अच्छे होंगे। आप जिस प्रॉपर्टी को देखने आए थे उसके बारे में आपका क्या विचार है?",
      },
      {
        name: "Availability Reminder",
        slug: "availability_reminder",
        bodyEn: "Hi {{leadName}}, just a quick update — a few units in the project are getting booked. Let me know if you would like the latest availability.",
        bodyHi: "नमस्ते {{leadName}}, एक अपडेट देना था — प्रोजेक्ट में कुछ यूनिट्स बुक हो रही हैं। अगर आपको लेटेस्ट अवेलेबिलिटी चाहिए तो बताएं।",
      },
      {
        name: "Price & Offer Reminder",
        slug: "price_offer_update",
        bodyEn: "Hi {{leadName}}, currently there are some good offers available in the project. Let me know if you would like me to share the details.",
        bodyHi: "नमस्ते {{leadName}}, अभी प्रोजेक्ट में कुछ अच्छे ऑफर्स चल रहे हैं। अगर आप डिटेल्स जानना चाहते हैं तो बताएं।",
      },
      {
        name: "Revisit Message",
        slug: "revisit_message",
        bodyEn: "Hi {{leadName}}, if you would like to visit the property again with your family, I can arrange a revisit anytime.",
        bodyHi: "नमस्ते {{leadName}}, अगर आप परिवार के साथ दोबारा प्रॉपर्टी देखना चाहें तो मैं री-विजिट अरेंज कर सकता हूँ।",
      },
      {
        name: "Booking Assistance",
        slug: "booking_assistance",
        bodyEn: "Hi {{leadName}}, if you are planning to proceed with the booking, I can guide you with the complete process.",
        bodyHi: "नमस्ते {{leadName}}, अगर आप बुकिंग के लिए आगे बढ़ना चाहते हैं तो मैं आपको पूरा प्रोसेस समझाने में मदद कर सकता हूँ।",
      },
      {
        name: "Payment Plan Info",
        slug: "payment_plan_info",
        bodyEn: "Hi {{leadName}}, we also have flexible payment plans available. Let me know if you would like more details.",
        bodyHi: "नमस्ते {{leadName}}, प्रोजेक्ट में फ्लेक्सिबल पेमेंट प्लान भी उपलब्ध हैं। अगर डिटेल्स चाहिए तो बताएं।",
      },
      {
        name: "Gentle Reminder",
        slug: "gentle_reminder",
        bodyEn: "Hi {{leadName}}, just a quick reminder regarding the property you visited. Let me know if you would like to discuss further.",
        bodyHi: "नमस्ते {{leadName}}, आपने जो प्रॉपर्टी देखी थी उसके बारे में एक छोटा सा रिमाइंडर। अगर आगे बात करनी हो तो बताएं।",
      },
      {
        name: "Assistance Message",
        slug: "assistance_message",
        bodyEn: "Hi {{leadName}}, please feel free to contact me if you need any assistance regarding the property or booking process.",
        bodyHi: "नमस्ते {{leadName}}, प्रॉपर्टी या बुकिंग प्रोसेस से जुड़ी किसी भी मदद के लिए आप मुझसे संपर्क कर सकते हैं।",
      },
      {
        name: "Closing Follow-Up",
        slug: "closing_followup",
        bodyEn: "Hi {{leadName}}, just checking if you have made any decision regarding the property. I would be happy to assist you further.",
        bodyHi: "नमस्ते {{leadName}}, बस यह जानना था कि क्या आपने प्रॉपर्टी के बारे में कोई निर्णय लिया है? आगे की प्रक्रिया में मैं आपकी मदद कर सकता हूँ।",
      },
    ]

    for (const t of templates) {
      await ctx.db.insert("messageTemplates", {
        name: t.name,
        slug: t.slug,
        bodyEn: t.bodyEn,
        bodyHi: t.bodyHi,
        triggerStatus: t.triggerStatus,
        triggerBehavior: t.triggerBehavior,
        autoDelayMs: t.autoDelayMs,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })
    }
  },
})
