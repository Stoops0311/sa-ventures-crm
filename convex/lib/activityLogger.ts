import type { MutationCtx } from "../_generated/server"
import type { Id } from "../_generated/dataModel"

/**
 * Logs an activity entry inline within a mutation.
 * Called within the same transaction as the data change for atomicity.
 */
export async function logActivity(
  ctx: MutationCtx,
  params: {
    entityType: "lead" | "project" | "user" | "employee" | "onboarding" | "letter" | "template" | "payroll" | "salary" | "insurance" | "hr_query" | "suggestion" | "vehicle" | "trip" | "article"
    entityId: string
    action: string
    details?: Record<string, unknown>
    performedBy: Id<"users">
  }
) {
  await ctx.db.insert("activityLogs", {
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    details: params.details ? JSON.stringify(params.details) : undefined,
    performedBy: params.performedBy,
    timestamp: Date.now(),
  })
}
