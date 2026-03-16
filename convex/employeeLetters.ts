import { query, mutation, action } from "./_generated/server"
import { v } from "convex/values"
import { requireUserWithAnyRole, getUserOrNull } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Check auth: HR/admin can query any user, others can only query own
    const user = await getUserOrNull(ctx)
    if (!user) return []

    const isHROrAdmin = user.role === "hr" || user.role === "admin"
    if (!isHROrAdmin && user._id !== args.userId) return []

    const letters = await ctx.db
      .query("employeeLetters")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .collect()

    // Sort newest first
    letters.sort((a, b) => b.createdAt - a.createdAt)

    // Enrich with download URLs
    const enriched = await Promise.all(
      letters.map(async (letter) => {
        const url = await ctx.storage.getUrl(letter.storageId)
        return { ...letter, url }
      })
    )

    return enriched
  },
})

export const getDownloadUrl = query({
  args: { letterId: v.id("employeeLetters") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null

    const letter = await ctx.db.get(args.letterId)
    if (!letter) return null

    const isHROrAdmin = user.role === "hr" || user.role === "admin"
    if (!isHROrAdmin && user._id !== letter.userId) return null

    return await ctx.storage.getUrl(letter.storageId)
  },
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserWithAnyRole(ctx, ["hr", "admin"])
    return await ctx.storage.generateUploadUrl()
  },
})

export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    storageId: v.id("_storage"),
    fileName: v.string(),
    templateType: v.optional(v.string()),
    isGenerated: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    // Verify target user exists
    const targetUser = await ctx.db.get(args.userId)
    if (!targetUser) throw new Error("Employee not found")

    const letterId = await ctx.db.insert("employeeLetters", {
      userId: args.userId,
      templateType: args.templateType,
      title: args.title,
      storageId: args.storageId,
      fileName: args.fileName,
      isGenerated: args.isGenerated,
      generatedBy: user._id,
      createdAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "letter",
      entityId: letterId,
      action: args.isGenerated ? "letter_generated" : "document_uploaded",
      details: {
        title: args.title,
        employeeName: targetUser.name,
        templateType: args.templateType,
      },
      performedBy: user._id,
    })

    // Also log on the employee entity
    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("byUserId", (q) => q.eq("userId", args.userId))
      .unique()

    if (profile) {
      await logActivity(ctx, {
        entityType: "employee",
        entityId: profile._id,
        action: args.isGenerated ? "letter_generated" : "document_uploaded",
        details: { title: args.title, templateType: args.templateType },
        performedBy: user._id,
      })
    }

    return letterId
  },
})

export const remove = mutation({
  args: { letterId: v.id("employeeLetters") },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    const letter = await ctx.db.get(args.letterId)
    if (!letter) throw new Error("Letter not found")

    // Delete from storage
    await ctx.storage.delete(letter.storageId)

    // Delete record
    await ctx.db.delete(args.letterId)

    // Get employee name for logging
    const targetUser = await ctx.db.get(letter.userId)

    await logActivity(ctx, {
      entityType: "letter",
      entityId: args.letterId,
      action: "letter_deleted",
      details: {
        title: letter.title,
        employeeName: targetUser?.name,
      },
      performedBy: user._id,
    })

    // Also log on employee
    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("byUserId", (q) => q.eq("userId", letter.userId))
      .unique()

    if (profile) {
      await logActivity(ctx, {
        entityType: "employee",
        entityId: profile._id,
        action: "letter_deleted",
        details: { title: letter.title },
        performedBy: user._id,
      })
    }
  },
})

export const generatePdf = action({
  args: { content: v.string(), title: v.string() },
  handler: async (ctx, { content, title }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Unauthenticated")

    // Dynamic import pdf-lib
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")

    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

    const pageWidth = 595.28 // A4
    const pageHeight = 841.89
    const margin = 50
    const maxWidth = pageWidth - margin * 2
    const lineHeight = 18
    const bodyFontSize = 11
    const headerFontSize = 18
    const titleFontSize = 14

    // Helper to wrap text
    function wrapText(text: string, fontSize: number, usedFont: typeof font): string[] {
      const words = text.split(" ")
      const lines: string[] = []
      let currentLine = ""

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word
        const width = usedFont.widthOfTextAtSize(testLine, fontSize)
        if (width > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) lines.push(currentLine)
      return lines
    }

    let page = doc.addPage([pageWidth, pageHeight])
    let y = pageHeight - margin
    let pageNum = 1

    function addNewPage() {
      // Footer on current page
      page.drawText(`Page ${pageNum}`, {
        x: pageWidth / 2 - 20,
        y: 30,
        size: 9,
        font,
        color: rgb(0.5, 0.5, 0.5),
      })
      pageNum++
      page = doc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }

    // Company header
    const headerText = "SA VENTURES"
    const headerWidth = boldFont.widthOfTextAtSize(headerText, headerFontSize)
    page.drawText(headerText, {
      x: (pageWidth - headerWidth) / 2,
      y,
      size: headerFontSize,
      font: boldFont,
    })
    y -= 40

    // Title
    page.drawText(title.toUpperCase(), {
      x: margin,
      y,
      size: titleFontSize,
      font: boldFont,
    })
    y -= 30

    // Body text — process line by line
    const contentLines = content.split("\n")

    for (const rawLine of contentLines) {
      if (rawLine.trim() === "") {
        y -= lineHeight * 0.6
        if (y < margin + 40) addNewPage()
        continue
      }

      const wrapped = wrapText(rawLine, bodyFontSize, font)
      for (const line of wrapped) {
        if (y < margin + 40) addNewPage()
        page.drawText(line, {
          x: margin,
          y,
          size: bodyFontSize,
          font,
        })
        y -= lineHeight
      }
    }

    // Footer on last page
    page.drawText(`Page ${pageNum}`, {
      x: pageWidth / 2 - 20,
      y: 30,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })

    const pdfBytes = await doc.save()
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
    const storageId = await ctx.storage.store(blob)
    const fileName = `${title.replace(/\s+/g, "_")}.pdf`

    return { storageId, fileName }
  },
})
