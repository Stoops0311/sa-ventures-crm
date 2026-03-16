import {
  query,
  mutation,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"
import { getUserOrNull, getUserWithAnyRole, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { MONTH_NAMES } from "./lib/constants"

// ── Types ───────────────────────────────────────────────────────

type BreakdownComponent = {
  name: string
  type: string
  amount: number
  order: number
  isCustom: boolean
}

type Breakdown = {
  components: BreakdownComponent[]
  grossEarnings: number
  totalDeductions: number
  netPay: number
}

// ── Helpers ─────────────────────────────────────────────────────

function validateMonth(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be 1-12.`)
  }
}

function validateYear(year: number) {
  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    throw new Error(`Invalid year: ${year}. Must be 2020-2100.`)
  }
}

function safeParseBreakdown(json: string): Breakdown {
  try {
    const parsed = JSON.parse(json) as Breakdown
    if (!Array.isArray(parsed.components)) {
      throw new Error("Invalid breakdown: missing components array")
    }
    return parsed
  } catch (e) {
    throw new Error(`Corrupt payslip breakdown: ${e instanceof Error ? e.message : "parse error"}`)
  }
}

function computeTotals(components: BreakdownComponent[]) {
  const grossEarnings = components
    .filter((c) => c.type === "earning")
    .reduce((s, c) => s + c.amount, 0)
  const totalDeductions = components
    .filter((c) => c.type === "deduction")
    .reduce((s, c) => s + c.amount, 0)
  return { grossEarnings, totalDeductions, netPay: grossEarnings - totalDeductions }
}

// ── Public Queries ──────────────────────────────────────────────

export const listRuns = query({
  args: { year: v.optional(v.number()), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return []

    let runs
    if (args.year) {
      // Use index when filtering by year — collect all months for that year
      const allForYear = await ctx.db
        .query("payrollRuns")
        .withIndex("byYearMonth", (q) => q.eq("year", args.year!))
        .collect()
      runs = args.status ? allForYear.filter((r) => r.status === args.status) : allForYear
    } else if (args.status) {
      runs = await ctx.db
        .query("payrollRuns")
        .withIndex("byStatus", (q) => q.eq("status", args.status!))
        .collect()
    } else {
      runs = await ctx.db.query("payrollRuns").collect()
    }

    runs.sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month))

    return await Promise.all(
      runs.map(async (run) => {
        const payslips = await ctx.db
          .query("payslips")
          .withIndex("byPayrollRunId", (q) => q.eq("payrollRunId", run._id))
          .collect()
        const processedByUser = await ctx.db.get(run.processedBy)
        return {
          ...run,
          employeeCount: payslips.length,
          totalNetPay: payslips.reduce((s, p) => s + p.netPay, 0),
          processedByName: processedByUser?.name ?? "Unknown",
        }
      })
    )
  },
})

export const getRunDetail = query({
  args: { runId: v.id("payrollRuns") },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return null
    const run = await ctx.db.get(args.runId)
    if (!run) return null

    const payslips = await ctx.db
      .query("payslips")
      .withIndex("byPayrollRunId", (q) => q.eq("payrollRunId", args.runId))
      .collect()

    // Batch-fetch all users and profiles referenced by payslips
    const userIds = [...new Set(payslips.map((ps) => ps.userId))]
    const [users, profiles] = await Promise.all([
      Promise.all(userIds.map((id) => ctx.db.get(id))),
      Promise.all(
        userIds.map((id) =>
          ctx.db
            .query("employeeProfiles")
            .withIndex("byUserId", (q) => q.eq("userId", id))
            .unique()
        )
      ),
    ])
    const userMap = new Map(userIds.map((id, i) => [id, users[i]]))
    const profileMap = new Map(userIds.map((id, i) => [id, profiles[i]]))

    const enriched = payslips.map((ps) => {
      const empUser = userMap.get(ps.userId)
      const profile = profileMap.get(ps.userId)
      return {
        ...ps,
        employeeName: empUser?.name ?? "Unknown",
        designation: profile?.designation ?? null,
        department: profile?.department ?? null,
        panNumber: profile?.panNumber ?? null,
        bankName: profile?.bankName ?? null,
        accountNumber: profile?.accountNumber ?? null,
      }
    })
    enriched.sort((a, b) => a.employeeName.localeCompare(b.employeeName))

    const processedByUser = await ctx.db.get(run.processedBy)
    return {
      ...run,
      payslips: enriched,
      processedByName: processedByUser?.name ?? "Unknown",
    }
  },
})

export const getMyPayslips = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return []

    const allPayslips = await ctx.db
      .query("payslips")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect()

    // Only show confirmed runs — batch-fetch runs to avoid N+1
    const runIds = [...new Set(allPayslips.map((p) => p.payrollRunId))]
    const runs = await Promise.all(runIds.map((id) => ctx.db.get(id)))
    const confirmedRunIds = new Set(
      runIds.filter((_id, i) => runs[i]?.status === "confirmed")
    )

    const confirmed = allPayslips
      .filter((p) => confirmedRunIds.has(p.payrollRunId))
      .sort((a, b) => (b.year !== a.year ? b.year - a.year : b.month - a.month))

    const limited = args.limit ? confirmed.slice(0, args.limit) : confirmed

    return await Promise.all(
      limited.map(async (p) => {
        const url = p.pdfStorageId ? await ctx.storage.getUrl(p.pdfStorageId) : null
        return { ...p, downloadUrl: url }
      })
    )
  },
})

export const getPayslipDownloadUrl = query({
  args: { payslipId: v.id("payslips") },
  handler: async (ctx, args) => {
    const user = await getUserOrNull(ctx)
    if (!user) return null
    const payslip = await ctx.db.get(args.payslipId)
    if (!payslip) return null
    const isHROrAdmin = user.role === "hr" || user.role === "admin"
    if (!isHROrAdmin && user._id !== payslip.userId) return null
    if (!payslip.pdfStorageId) return null
    return await ctx.storage.getUrl(payslip.pdfStorageId)
  },
})

export const canRunPayroll = query({
  args: { month: v.number(), year: v.number() },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, ["hr", "admin"])
    if (!user) return { canRun: false, existingRun: null }

    // Use .first() instead of .unique() to gracefully handle edge cases
    const existing = await ctx.db
      .query("payrollRuns")
      .withIndex("byYearMonth", (q) => q.eq("year", args.year).eq("month", args.month))
      .first()

    return existing
      ? { canRun: false, existingRun: existing }
      : { canRun: true, existingRun: null }
  },
})

// ── Internal Queries (for actions) ─────────────────────────────

export const getPayslipInternal = internalQuery({
  args: { payslipId: v.id("payslips") },
  handler: async (ctx, args) => {
    const payslip = await ctx.db.get(args.payslipId)
    if (!payslip) return null
    const empUser = await ctx.db.get(payslip.userId)
    const profile = await ctx.db
      .query("employeeProfiles")
      .withIndex("byUserId", (q) => q.eq("userId", payslip.userId))
      .unique()
    return { ...payslip, user: empUser, profile }
  },
})

export const listPayslipsForRun = internalQuery({
  args: { runId: v.id("payrollRuns") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("payslips")
      .withIndex("byPayrollRunId", (q) => q.eq("payrollRunId", args.runId))
      .collect()
  },
})

// ── Internal Mutations (for actions) ───────────────────────────

export const patchPayslipPdf = internalMutation({
  args: { payslipId: v.id("payslips"), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const payslip = await ctx.db.get(args.payslipId)
    if (!payslip) return // silently skip if payslip was deleted between schedule and execution
    await ctx.db.patch(args.payslipId, { pdfStorageId: args.storageId })
  },
})

// ── Public Mutations ────────────────────────────────────────────

export const createRun = mutation({
  args: { month: v.number(), year: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    // Validate inputs
    validateMonth(args.month)
    validateYear(args.year)

    // Check for duplicate — use .first() not .unique()
    const existing = await ctx.db
      .query("payrollRuns")
      .withIndex("byYearMonth", (q) =>
        q.eq("year", args.year).eq("month", args.month)
      )
      .first()
    if (existing) {
      throw new Error(
        `Payroll for ${MONTH_NAMES[args.month - 1]} ${args.year} already exists`
      )
    }

    const runId = await ctx.db.insert("payrollRuns", {
      month: args.month,
      year: args.year,
      status: "draft",
      processedBy: user._id,
      createdAt: Date.now(),
    })

    // Get all non-DSM users who have salary components configured
    const allUsers = await ctx.db.query("users").collect()
    const managedUsers = allUsers.filter((u) => u.role !== "dsm")
    const now = Date.now()
    let payslipCount = 0

    for (const emp of managedUsers) {
      const components = await ctx.db
        .query("salaryComponents")
        .withIndex("byUserId", (q) => q.eq("userId", emp._id))
        .collect()
      if (components.length === 0) continue

      components.sort((a, b) => a.order - b.order)
      const { grossEarnings, totalDeductions, netPay } = computeTotals(components)

      const breakdown = JSON.stringify({
        components: components.map((c) => ({
          name: c.name,
          type: c.type,
          amount: c.amount,
          order: c.order,
          isCustom: c.isCustom,
        })),
        grossEarnings,
        totalDeductions,
        netPay,
      })

      await ctx.db.insert("payslips", {
        payrollRunId: runId,
        userId: emp._id,
        month: args.month,
        year: args.year,
        breakdown,
        grossEarnings,
        totalDeductions,
        netPay,
        isOverridden: false,
        createdAt: now,
      })
      payslipCount++
    }

    if (payslipCount === 0) {
      // Clean up empty run — no employees have salary configured
      await ctx.db.delete(runId)
      throw new Error("No employees have salary configured. Configure salaries first.")
    }

    await logActivity(ctx, {
      entityType: "payroll",
      entityId: runId,
      action: "payroll_run_created",
      details: { month: args.month, year: args.year, employeeCount: payslipCount },
      performedBy: user._id,
    })

    return runId
  },
})

export const overridePayslip = mutation({
  args: {
    payslipId: v.id("payslips"),
    overrides: v.array(v.object({ name: v.string(), amount: v.number() })),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])

    if (args.overrides.length === 0) throw new Error("No overrides provided")

    const payslip = await ctx.db.get(args.payslipId)
    if (!payslip) throw new Error("Payslip not found")

    const run = await ctx.db.get(payslip.payrollRunId)
    if (!run || run.status !== "draft") {
      throw new Error("Can only override payslips in draft runs")
    }

    const parsed = safeParseBreakdown(payslip.breakdown)

    // Validate all override names exist in the breakdown
    const validNames = new Set(parsed.components.map((c) => c.name))
    for (const override of args.overrides) {
      if (!validNames.has(override.name)) {
        throw new Error(`Unknown component: "${override.name}"`)
      }
      if (!Number.isFinite(override.amount) || override.amount < 0 || override.amount > 100_000_000) {
        throw new Error(`Invalid amount for ${override.name}: must be between 0 and 10,00,00,000`)
      }
    }

    const overrideMap = new Map(args.overrides.map((o) => [o.name, Math.round(o.amount)]))
    const updatedComponents = parsed.components.map((c) =>
      overrideMap.has(c.name) ? { ...c, amount: overrideMap.get(c.name)! } : c
    )

    const { grossEarnings, totalDeductions, netPay } = computeTotals(updatedComponents)

    await ctx.db.patch(args.payslipId, {
      breakdown: JSON.stringify({
        components: updatedComponents,
        grossEarnings,
        totalDeductions,
        netPay,
      }),
      grossEarnings,
      totalDeductions,
      netPay,
      isOverridden: true,
    })

    const empUser = await ctx.db.get(payslip.userId)
    await logActivity(ctx, {
      entityType: "payroll",
      entityId: payslip.payrollRunId,
      action: "payslip_overridden",
      details: {
        payslipId: args.payslipId,
        employeeName: empUser?.name,
        overriddenComponents: args.overrides.map((o) => o.name),
      },
      performedBy: user._id,
    })
  },
})

export const confirmRun = mutation({
  args: { runId: v.id("payrollRuns") },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])
    const run = await ctx.db.get(args.runId)
    if (!run) throw new Error("Payroll run not found")
    if (run.status !== "draft") throw new Error("Run is already confirmed")

    // Verify run has payslips
    const payslips = await ctx.db
      .query("payslips")
      .withIndex("byPayrollRunId", (q) => q.eq("payrollRunId", args.runId))
      .first()
    if (!payslips) throw new Error("Cannot confirm an empty payroll run")

    await ctx.db.patch(args.runId, {
      status: "confirmed",
      confirmedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "payroll",
      entityId: args.runId,
      action: "payroll_confirmed",
      details: { month: run.month, year: run.year },
      performedBy: user._id,
    })

    // Schedule async PDF generation
    await ctx.scheduler.runAfter(0, internal.payroll.generateAllPayslipPdfs, {
      runId: args.runId,
    })
  },
})

export const deleteRun = mutation({
  args: { runId: v.id("payrollRuns") },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, ["hr", "admin"])
    const run = await ctx.db.get(args.runId)
    if (!run) throw new Error("Payroll run not found")
    if (run.status !== "draft") {
      throw new Error("Cannot delete a confirmed payroll run")
    }

    // Log BEFORE deleting so entityId still exists in the system
    await logActivity(ctx, {
      entityType: "payroll",
      entityId: args.runId,
      action: "payroll_deleted",
      details: {
        month: run.month,
        year: run.year,
        monthLabel: `${MONTH_NAMES[run.month - 1]} ${run.year}`,
      },
      performedBy: user._id,
    })

    // Delete all payslips for this run
    const payslips = await ctx.db
      .query("payslips")
      .withIndex("byPayrollRunId", (q) => q.eq("payrollRunId", args.runId))
      .collect()
    for (const p of payslips) {
      // Clean up any stored PDFs
      if (p.pdfStorageId) {
        await ctx.storage.delete(p.pdfStorageId)
      }
      await ctx.db.delete(p._id)
    }
    await ctx.db.delete(args.runId)
  },
})

export const retryPdfGeneration = mutation({
  args: { runId: v.id("payrollRuns") },
  handler: async (ctx, args) => {
    await requireUserWithAnyRole(ctx, ["hr", "admin"])
    const run = await ctx.db.get(args.runId)
    if (!run) throw new Error("Payroll run not found")
    if (run.status !== "confirmed") throw new Error("Can only generate PDFs for confirmed runs")

    const payslips = await ctx.db
      .query("payslips")
      .withIndex("byPayrollRunId", (q) => q.eq("payrollRunId", args.runId))
      .collect()
    const missing = payslips.filter((p) => !p.pdfStorageId)
    if (missing.length === 0) throw new Error("All PDFs already generated")

    await ctx.scheduler.runAfter(0, internal.payroll.generateAllPayslipPdfs, {
      runId: args.runId,
    })

    return missing.length
  },
})

// ── Internal Actions (PDF Generation) ──────────────────────────

const PAGE_W = 595
const PAGE_H = 842
const MARGIN = 50
const COL_MID = 297

export const generatePayslipPdf = internalAction({
  args: { payslipId: v.id("payslips") },
  handler: async (ctx, args) => {
    const data = await ctx.runQuery(internal.payroll.getPayslipInternal, {
      payslipId: args.payslipId,
    })
    if (!data || !data.user) return // skip if missing
    if (data.pdfStorageId) return // already generated

    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib")
    const { amountToWords } = await import("./lib/currency")

    let parsed: Breakdown
    try {
      parsed = JSON.parse(data.breakdown) as Breakdown
    } catch {
      console.error(`Failed to parse breakdown for payslip ${args.payslipId}`)
      return
    }

    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const bold = await doc.embedFont(StandardFonts.HelveticaBold)
    const page = doc.addPage([PAGE_W, PAGE_H])

    // WinAnsi encoding can't handle ₹ or other Unicode symbols,
    // so format with "Rs." prefix instead
    const fmt = (n: number) =>
      "Rs. " +
      new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0,
      }).format(n)

    function drawText(
      text: string,
      x: number,
      y: number,
      opts: {
        size?: number
        bold?: boolean
        align?: "left" | "center" | "right"
        maxX?: number
      } = {}
    ) {
      const f = opts.bold ? bold : font
      const sz = opts.size ?? 10
      let dx = x
      if (opts.align === "center" && opts.maxX !== undefined) {
        dx = x + (opts.maxX - x - f.widthOfTextAtSize(text, sz)) / 2
      } else if (opts.align === "right" && opts.maxX !== undefined) {
        dx = opts.maxX - f.widthOfTextAtSize(text, sz)
      }
      page.drawText(text, {
        x: dx,
        y,
        size: sz,
        font: f,
        color: rgb(0, 0, 0),
      })
    }

    function hline(y: number) {
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: PAGE_W - MARGIN, y },
        thickness: 0.5,
        color: rgb(0.4, 0.4, 0.4),
      })
    }

    let y = PAGE_H - MARGIN

    // Header
    drawText("SA VENTURES", MARGIN, y, {
      size: 18,
      bold: true,
      align: "center",
      maxX: PAGE_W - MARGIN,
    })
    y -= 24
    const monthStr = `${MONTH_NAMES[data.month - 1].toUpperCase()} ${data.year}`
    drawText(`PAYSLIP FOR ${monthStr}`, MARGIN, y, {
      size: 12,
      align: "center",
      maxX: PAGE_W - MARGIN,
    })
    y -= 18
    hline(y)
    y -= 16

    // Employee details — mask sensitive fields
    const profile = data.profile
    const maskedPAN = profile?.panNumber
      ? "XXXXX" + profile.panNumber.slice(5)
      : "-"
    const maskedBank = profile?.accountNumber
      ? "XXXX" + profile.accountNumber.slice(-4)
      : "-"
    drawText(`Name: ${data.user.name}`, MARGIN, y, { bold: true })
    drawText(`PAN: ${maskedPAN}`, MARGIN + 270, y)
    y -= 16
    drawText(`Designation: ${profile?.designation ?? "-"}`, MARGIN, y)
    y -= 14
    drawText(`Department: ${profile?.department ?? "-"}`, MARGIN, y)
    drawText(
      `Bank: ${profile?.bankName ?? "-"} / ${maskedBank}`,
      MARGIN + 270,
      y
    )
    y -= 16
    hline(y)
    y -= 16

    // Two-column table
    const tableTopY = y
    drawText("EARNINGS", MARGIN, y, { bold: true })
    drawText("DEDUCTIONS", COL_MID + 10, y, { bold: true })
    y -= 14
    hline(y)
    y -= 14

    const earnings = parsed.components.filter((c) => c.type === "earning")
    const deductions = parsed.components.filter((c) => c.type === "deduction")
    const maxRows = Math.max(earnings.length, deductions.length)

    for (let i = 0; i < maxRows; i++) {
      const e = earnings[i]
      const d = deductions[i]
      if (e) {
        drawText(e.name, MARGIN, y)
        drawText(fmt(e.amount), COL_MID - 10, y, {
          align: "right",
          maxX: COL_MID - 10,
        })
      }
      if (d) {
        drawText(d.name, COL_MID + 10, y)
        drawText(fmt(d.amount), PAGE_W - MARGIN, y, {
          align: "right",
          maxX: PAGE_W - MARGIN,
        })
      }
      y -= 14
    }

    // Vertical divider
    page.drawLine({
      start: { x: COL_MID, y: tableTopY + 2 },
      end: { x: COL_MID, y: y - 4 },
      thickness: 0.5,
      color: rgb(0.4, 0.4, 0.4),
    })

    // Totals row
    hline(y)
    y -= 14
    drawText("GROSS EARNINGS", MARGIN, y, { bold: true })
    drawText(fmt(parsed.grossEarnings), COL_MID - 10, y, {
      bold: true,
      align: "right",
      maxX: COL_MID - 10,
    })
    drawText("TOTAL DEDUCTIONS", COL_MID + 10, y, { bold: true })
    drawText(fmt(parsed.totalDeductions), PAGE_W - MARGIN, y, {
      bold: true,
      align: "right",
      maxX: PAGE_W - MARGIN,
    })
    y -= 22
    hline(y)
    y -= 22

    // Net Pay
    drawText(`NET PAY: ${fmt(parsed.netPay)}`, MARGIN, y, {
      size: 14,
      bold: true,
      align: "center",
      maxX: PAGE_W - MARGIN,
    })
    y -= 18
    drawText(`(${amountToWords(parsed.netPay)})`, MARGIN, y, {
      size: 9,
      align: "center",
      maxX: PAGE_W - MARGIN,
    })
    y -= 30
    hline(y)
    y -= 16

    // Footer
    drawText("This is a system-generated payslip.", MARGIN, y, {
      size: 8,
      align: "center",
      maxX: PAGE_W - MARGIN,
    })

    const pdfBytes = await doc.save()
    const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
    const storageId = await ctx.storage.store(blob)

    await ctx.runMutation(internal.payroll.patchPayslipPdf, {
      payslipId: args.payslipId,
      storageId,
    })
  },
})

export const generateAllPayslipPdfs = internalAction({
  args: { runId: v.id("payrollRuns") },
  handler: async (ctx, args) => {
    const payslips = await ctx.runQuery(internal.payroll.listPayslipsForRun, {
      runId: args.runId,
    })
    for (const payslip of payslips) {
      if (!payslip.pdfStorageId) {
        try {
          await ctx.runAction(internal.payroll.generatePayslipPdf, {
            payslipId: payslip._id,
          })
        } catch (e) {
          console.error(`Failed to generate PDF for payslip ${payslip._id}:`, e)
          // Continue generating remaining payslips
        }
      }
    }
  },
})
