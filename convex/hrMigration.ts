import { internalMutation } from "./_generated/server"
import { ONBOARDING_CHECKLIST_ITEMS } from "./lib/constants"

export const backfillExistingEmployees = internalMutation({
  args: {},
  handler: async (ctx) => {

    const allUsers = await ctx.db.query("users").collect()
    const nonDSMUsers = allUsers.filter((u) => u.role !== "dsm")

    let created = 0

    for (const user of nonDSMUsers) {
      const existingProfile = await ctx.db
        .query("employeeProfiles")
        .withIndex("byUserId", (q) => q.eq("userId", user._id))
        .unique()

      if (existingProfile) continue

      const profileId = await ctx.db.insert("employeeProfiles", {
        userId: user._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      const items = ONBOARDING_CHECKLIST_ITEMS.map((item) => ({
        key: item.key,
        label: item.label,
        completedAt: null,
        completedBy: null,
      }))

      await ctx.db.insert("onboardingChecklists", {
        userId: user._id,
        employeeProfileId: profileId,
        status: "pending" as const,
        items: JSON.stringify(items),
        createdAt: Date.now(),
      })

      created++
    }

    return { created, total: nonDSMUsers.length }
  },
})
