# HR Phase A — Foundation & Onboarding

## Overview

Establishes the HR module foundation: new `hr` role, employee profiles, onboarding system, HR dashboard, employee directory, and the self-service skeleton for salespeople/admins.

## New Tables

### `employeeProfiles`

```ts
employeeProfiles: defineTable({
  userId: v.id("users"),
  // Personal info
  dateOfBirth: v.optional(v.string()),        // "YYYY-MM-DD"
  gender: v.optional(v.string()),             // "male" | "female" | "other"
  fatherName: v.optional(v.string()),
  motherName: v.optional(v.string()),
  maritalStatus: v.optional(v.string()),      // "single" | "married" | "divorced" | "widowed"
  bloodGroup: v.optional(v.string()),         // "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-"
  panNumber: v.optional(v.string()),
  aadharNumber: v.optional(v.string()),
  photoStorageId: v.optional(v.id("_storage")),
  address: v.optional(v.string()),
  // Banking
  bankName: v.optional(v.string()),
  accountNumber: v.optional(v.string()),
  ifscCode: v.optional(v.string()),
  // Emergency contact
  emergencyContactName: v.optional(v.string()),
  emergencyContactPhone: v.optional(v.string()),
  emergencyContactRelation: v.optional(v.string()),
  // Employment
  dateOfJoining: v.optional(v.string()),      // "YYYY-MM-DD"
  designation: v.optional(v.string()),
  department: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("byUserId", ["userId"])
```

### `onboardingChecklists`

```ts
onboardingChecklists: defineTable({
  userId: v.id("users"),
  employeeProfileId: v.id("employeeProfiles"),
  status: v.string(),                         // "pending" | "in_progress" | "completed"
  items: v.string(),                          // JSON: [{ key, label, completedAt?, completedBy? }]
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("byUserId", ["userId"])
  .index("byStatus", ["status"])
```

### Hardcoded Checklist Items

Define in `convex/lib/constants.ts`:

```ts
export const ONBOARDING_CHECKLIST_ITEMS = [
  { key: "submit_pan", label: "Submit PAN card copy" },
  { key: "submit_aadhar", label: "Submit Aadhar card copy" },
  { key: "submit_bank_details", label: "Submit bank account details" },
  { key: "submit_photos", label: "Submit passport-size photos" },
  { key: "sign_offer_letter", label: "Sign offer letter" },
  { key: "complete_personal_info", label: "Complete personal information form" },
  { key: "submit_emergency_contact", label: "Provide emergency contact details" },
]
```

## Files to Modify

### Auth & Role System

**`convex/lib/auth.ts`** — Add `"hr"` to Role union and all helper functions.

**`types/globals.d.ts`** — Add `"hr"` to Roles type.

**`lib/constants.ts`** — Add HR role:
```ts
{ value: "hr", label: "HR", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" }
```

**`convex/lib/constants.ts`** — Add `ONBOARDING_CHECKLIST_ITEMS`, `ONBOARDING_STATUSES`, `HR_DEPARTMENTS`, `GENDERS`, `MARITAL_STATUSES`, `BLOOD_GROUPS`.

**`middleware.ts`** — Add:
- `/hr` route matcher (allow `hr` and `admin`)
- `hr: "/hr"` in `roleHomeRoutes`

### Sidebar Navigation

**`components/layout/app-sidebar.tsx`** — Add:
- Full `hr` nav config with 9 items
- "My HR" item to `salesperson` nav (`/dashboard/hr`)
- "My HR" item to `admin` nav (`/admin/hr`)

### User Management

**`convex/users.ts`** — Modify `updateUser` mutation:
- After role change to non-DSM, check if `employeeProfiles` exists
- If not, create `employeeProfiles` + `onboardingChecklists` records
- Log activity

**`convex/schema.ts`** — Add `employeeProfiles` and `onboardingChecklists` tables.

## New Convex Files

### `convex/employeeProfiles.ts`

**Queries:**
- `getByUserId(userId)` — Get profile for a user. HR/admin: any user. Self-service: own profile only.
- `listAll(filters?)` — All employee profiles with joined user data. HR/admin only. Supports: search (name/email), filter by role, filter by onboarding status. Paginated.
- `getStats()` — HR dashboard stats: total employees, pending onboardings, active employees.

**Mutations:**
- `upsert(userId, fields)` — Create or update profile. HR/admin can update any. Self-service: own only, restricted fields (can't change designation/department).
- `uploadPhoto(userId)` — Generate upload URL for profile photo.

### `convex/onboarding.ts`

**Queries:**
- `getByUserId(userId)` — Get onboarding for a user. HR/admin or self.
- `listPending()` — All pending/in-progress onboardings with user data joined. HR/admin only.
- `getMyOnboarding()` — Current user's own onboarding status + checklist.

**Mutations:**
- `create(userId)` — Create onboarding checklist for a user. Internal use (called from `updateUser`).
- `toggleItem(checklistId, itemKey)` — Mark item complete/incomplete. HR/admin can toggle any item. Employee can only toggle: `complete_personal_info`, `submit_emergency_contact` (the form-based ones).
- `markComplete(checklistId)` — Mark entire onboarding as completed. HR/admin only. Requires all items done.

### `convex/hrMigration.ts`

**Mutations:**
- `backfillExistingEmployees()` — One-time migration. Creates `employeeProfiles` + `onboardingChecklists` for all existing non-DSM users who don't have one. Called once after module deployment.

## New Pages

### `/app/hr/layout.tsx`
Wraps all HR pages in `<AppShell role="hr" />`. Same pattern as admin/dashboard/dsm layouts.

### `/app/hr/page.tsx` — HR Dashboard
- 4 stat cards: Total Employees, Pending Onboardings, Open Queries (Phase D), Upcoming Insurance Renewals (Phase D)
- Onboarding queue preview (5 most recent pending)
- Quick actions: View Employees, Run Payroll (Phase C link), Generate Letter (Phase B link)
- Phase A shows only Total Employees + Pending Onboardings cards; others show "Coming soon" or are added in later phases

### `/app/hr/employees/page.tsx` — Employee Directory
- DataTable with columns: Name, Email, Phone, Role, Department, Onboarding Status, Date of Joining
- Search bar (name/email/phone)
- Filters: Role (admin/salesperson/hr), Onboarding Status (pending/in_progress/completed), Department
- Click row → navigates to employee detail page
- Paginated (cursor-based, same as existing leads table)

### `/app/hr/employees/[id]/page.tsx` — Employee Detail
- Tabbed layout using vertical sections with collapsibles (following Phase 1 anti-pattern of avoiding tabs):
  - **Profile** section: Personal info, banking, emergency contact. Edit button opens inline form.
  - **Onboarding** section: Checklist with toggle items. Status badge. "Mark Complete" button when all done.
  - **Letters** section: Placeholder for Phase B
  - **Salary** section: Placeholder for Phase C
  - **Insurance** section: Placeholder for Phase D
  - **Activity** section: Activity log filtered to this employee

### `/app/hr/onboarding/page.tsx` — Onboarding Queue
- Table of all pending/in-progress onboardings
- Columns: Employee Name, Status, Items Completed (3/7), Created Date
- Click → navigates to employee detail page (scrolled to onboarding section)
- Filter by status

### `/app/dashboard/hr/page.tsx` — Salesperson Self-Service
- Onboarding banner (if incomplete): "Complete your onboarding — X of 7 items done" with CTA
- Profile summary (read-only view of their own data)
- Sections for: Letters (Phase B), Payslips (Phase C), Insurance (Phase D), Queries (Phase D), Suggestions (Phase D) — shown as placeholders until built

### `/app/dashboard/hr/onboarding/page.tsx` — Salesperson Onboarding Form
- Multi-section form:
  - Personal Info: Full name (pre-filled from users), DOB, gender, address, PAN, Aadhar, photo upload, father/mother name, marital status, blood group
  - Banking: Bank name, account number, IFSC code
  - Emergency Contact: Name, phone, relation
- Save button updates `employeeProfiles`
- Below the form: checklist items that the employee can see (read-only for HR-managed items, toggleable for form-related items)

### `/app/admin/hr/page.tsx` — Admin Self-Service
- Same shared component as salesperson self-service
- Onboarding banner if applicable

## New Components

### `components/hr/dashboard/`
- `hr-stat-cards.tsx` — Reuses stat card pattern from admin dashboard
- `onboarding-queue-preview.tsx` — Mini table of 5 most recent pending onboardings
- `hr-quick-actions.tsx` — Action buttons

### `components/hr/employees/`
- `employee-table.tsx` — DataTable for employee directory
- `employee-detail-page.tsx` — Detail layout with collapsible sections
- `employee-profile-form.tsx` — Editable form for personal/banking/emergency info
- `employee-profile-view.tsx` — Read-only key-value display

### `components/hr/onboarding/`
- `onboarding-list.tsx` — Table for onboarding queue page
- `onboarding-checklist.tsx` — Checklist card with toggle items
- `onboarding-banner.tsx` — Prominent banner for incomplete onboarding (used in self-service)
- `employee-onboarding-form.tsx` — Multi-section form for employee to fill

### `components/hr/self-service/`
- `my-hr-page.tsx` — Shared self-service page component (used by both salesperson and admin)
- `self-service-profile.tsx` — Read-only profile summary

## Verification

1. Create a test user with `hr` role in Clerk → should be routed to `/hr` dashboard
2. Admin can access `/hr/...` routes; salesperson/DSM cannot
3. Admin assigns salesperson role to a new user → `employeeProfiles` and `onboardingChecklists` auto-created
4. Salesperson logs in → sees "My HR" in sidebar → clicks → sees onboarding banner
5. Salesperson fills onboarding form → profile fields update → form-related checklist items auto-toggle
6. HR toggles remaining checklist items → marks onboarding complete → banner disappears for employee
7. Run `backfillExistingEmployees` → all existing non-DSM users get profiles + checklists
8. Employee directory shows all managed employees with correct filters and search
9. Employee detail shows profile data and onboarding status
10. All mutations log to activity log
