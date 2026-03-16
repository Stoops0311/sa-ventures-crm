# HR Phase D — Insurance, Queries & Suggestions

## Overview

Adds three employee-facing features: insurance enrollment and tracking, an HR query/request system, and an anonymous suggestion box. All three are accessible via employee self-service and managed by HR.

**Depends on:** Phase A (employee profiles + self-service skeleton must exist)

## New Tables

### `insuranceEnrollments`

```ts
insuranceEnrollments: defineTable({
  userId: v.id("users"),
  // Required fields (employee fills)
  nomineeName: v.string(),
  nomineeRelation: v.string(),
  nomineeDob: v.string(),                    // "YYYY-MM-DD"
  existingConditions: v.boolean(),
  // Optional fields (employee fills)
  dependents: v.optional(v.string()),         // JSON: [{ name, relation, dob }]
  preExistingDetails: v.optional(v.string()),
  preferredHospital: v.optional(v.string()),
  sumInsured: v.optional(v.number()),
  // Tracker fields (HR manages)
  policyNumber: v.optional(v.string()),
  expiryDate: v.optional(v.string()),         // "YYYY-MM-DD"
  renewalReminderDate: v.optional(v.string()),
  status: v.string(),                         // "pending" | "enrolled" | "expired" | "renewed"
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("byUserId", ["userId"])
  .index("byStatus", ["status"])
  .index("byExpiryDate", ["expiryDate"])
```

### `insuranceDocuments`

```ts
insuranceDocuments: defineTable({
  insuranceEnrollmentId: v.id("insuranceEnrollments"),
  userId: v.id("users"),
  storageId: v.id("_storage"),
  fileName: v.string(),
  fileType: v.string(),
  createdAt: v.number(),
})
  .index("byInsuranceEnrollmentId", ["insuranceEnrollmentId"])
  .index("byUserId", ["userId"])
```

### `hrQueries`

```ts
hrQueries: defineTable({
  userId: v.id("users"),
  type: v.string(),         // "salary_certificate" | "experience_letter" | "leave_encashment" | "salary_advance" | "address_change" | "bank_detail_change" | "other"
  subject: v.string(),
  description: v.string(),
  status: v.string(),       // "open" | "in_progress" | "resolved" | "rejected"
  resolvedBy: v.optional(v.id("users")),
  resolutionNote: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  resolvedAt: v.optional(v.number()),
})
  .index("byUserId", ["userId"])
  .index("byStatus", ["status"])
  .index("byType", ["type"])
```

### `suggestions`

```ts
suggestions: defineTable({
  userId: v.optional(v.id("users")),          // stored internally even for anonymous
  isAnonymous: v.boolean(),
  content: v.string(),
  category: v.optional(v.string()),           // "workplace" | "policy" | "process" | "other"
  status: v.string(),                         // "new" | "reviewed" | "implemented" | "dismissed"
  reviewedBy: v.optional(v.id("users")),
  reviewNote: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("byStatus", ["status"])
  .index("byUserId", ["userId"])
```

## Constants

Add to `convex/lib/constants.ts`:

```ts
export const HR_QUERY_TYPES = [
  { value: "salary_certificate", label: "Salary Certificate" },
  { value: "experience_letter", label: "Experience Letter" },
  { value: "leave_encashment", label: "Leave Encashment" },
  { value: "salary_advance", label: "Salary Advance" },
  { value: "address_change", label: "Address Change" },
  { value: "bank_detail_change", label: "Bank Detail Change" },
  { value: "other", label: "Other" },
]

export const HR_QUERY_STATUSES = ["open", "in_progress", "resolved", "rejected"]

export const SUGGESTION_CATEGORIES = [
  { value: "workplace", label: "Workplace" },
  { value: "policy", label: "Policy" },
  { value: "process", label: "Process" },
  { value: "other", label: "Other" },
]

export const SUGGESTION_STATUSES = ["new", "reviewed", "implemented", "dismissed"]

export const INSURANCE_STATUSES = ["pending", "enrolled", "expired", "renewed"]
```

Add to `lib/constants.ts` (client-side with styling):

```ts
export const HR_QUERY_STATUS_STYLES = [
  { value: "open", label: "Open", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "in_progress", label: "In Progress", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "resolved", label: "Resolved", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "rejected", label: "Rejected", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
]

export const INSURANCE_STATUS_STYLES = [
  { value: "pending", label: "Pending", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "enrolled", label: "Enrolled", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "expired", label: "Expired", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  { value: "renewed", label: "Renewed", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
]

export const SUGGESTION_STATUS_STYLES = [
  { value: "new", label: "New", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "reviewed", label: "Reviewed", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "implemented", label: "Implemented", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "dismissed", label: "Dismissed", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
]
```

## New Convex Files

### `convex/insurance.ts`

**Queries:**
- `getByUserId(userId)` — Enrollment for a user. HR/admin or self.
- `listAll(filters?)` — All enrollments with user data. HR/admin only. Filter by status.
- `getExpiringSoon(days?)` — Enrollments expiring within N days (default 30). HR/admin only.
- `listDocuments(enrollmentId)` — Documents for an enrollment. HR/admin or enrollment owner.

**Mutations:**
- `enroll(userId, fields)` — Create or update enrollment. Employee submits required + optional fields. HR can also fill/edit. Sets status to "pending".
- `updateTracker(enrollmentId, fields)` — Update policy number, expiry date, renewal reminder, status. HR/admin only.
- `uploadDocument(enrollmentId, storageId, fileName, fileType)` — Attach document. HR/admin or enrollment owner.
- `removeDocument(documentId)` — Remove a document. HR/admin only.

### `convex/hrQueries.ts`

**Queries:**
- `listAll(filters?)` — All queries. HR/admin only. Filter by status, type. Paginated. Sorted by createdAt descending (newest first).
- `listByUser(userId?)` — Current user's own queries. Self-service. Sorted by createdAt descending.
- `getById(queryId)` — Single query detail. HR/admin or query owner.
- `getStats()` — Counts by status (open, in_progress). For HR dashboard stat card.

**Mutations:**
- `submit(type, subject, description)` — Employee submits a query. Status defaults to "open". Logs activity.
- `updateStatus(queryId, status, resolutionNote?)` — HR changes status. If resolving/rejecting, sets `resolvedBy`, `resolvedAt`, optional `resolutionNote`. Logs activity.

### `convex/suggestions.ts`

**Queries:**
- `listAll(filters?)` — All suggestions. HR/admin only. Filter by status, category. Anonymous entries have `userId` stripped (null). Paginated.
- `listByUser()` — Current user's own named suggestions only. Self-service.
- `getStats()` — Counts by status. For HR dashboard.

**Mutations:**
- `submit(content, isAnonymous, category?)` — Employee submits. Always stores `userId` internally. Logs activity (with anonymized performer if anonymous).
- `review(suggestionId, status, reviewNote?)` — HR reviews/dismisses. Sets `reviewedBy`, `reviewNote`. Logs activity.

## New Pages

### `/app/hr/insurance/page.tsx` — Insurance Tracker

**Top section: Expiry Alerts**
- Card with count of policies expiring in 30 days
- If any: expandable list showing employee name, policy number, expiry date, days remaining
- Visual urgency: red text for ≤7 days, yellow for ≤30 days

**Main section: Enrollment Table**
- DataTable: Employee Name, Status (badge), Policy Number, Expiry Date, Nominee, Actions
- Filter by status
- Click row → opens Sheet (side="right") with full enrollment details:
  - Employee info
  - Enrollment form data (nominee, conditions, dependents)
  - Tracker data (policy number, expiry, renewal)
  - Uploaded documents list with download
  - Edit tracker fields inline
  - Upload document button

### `/app/hr/queries/page.tsx` — HR Query Queue

**Filter bar:**
- Status filter (Select: All, Open, In Progress, Resolved, Rejected)
- Type filter (Select from HR_QUERY_TYPES)
- Search (by employee name or subject)

**Main: Query Table**
- DataTable: Employee Name, Type (badge), Subject, Status (badge), Created Date, Actions
- Default sort: open first, then by created date descending
- Click row → opens Sheet with:
  - Full query details (type, subject, description)
  - Employee info
  - Status timeline (created → in_progress → resolved)
  - Action buttons: "Mark In Progress", "Resolve" (opens popover with resolution note textarea), "Reject" (opens popover with reason)

### `/app/hr/suggestions/page.tsx` — Suggestion Box Viewer

**Main: Suggestions List**
- Card-based layout (not table — suggestions are text-heavy)
- Each card: Content text, Category badge, Status badge, Date, "Anonymous" label or Employee Name
- Filter by status, category
- Sort: newest first
- Click card → expands inline with review actions:
  - Status dropdown (reviewed/implemented/dismissed)
  - Review note textarea
  - Save button

## Updated Pages

### HR Dashboard (`/app/hr/page.tsx`)
Phase D adds two more stat cards (completing the 4-card row):
- **Open Queries** — count, with "X new today" indicator
- **Upcoming Renewals** — insurance policies expiring in 30 days

Plus a "Recent Queries" preview section below the onboarding queue preview.

### Employee Detail (`/app/hr/employees/[id]/page.tsx`)
**Insurance section** (previously placeholder):
- Shows enrollment status badge
- If enrolled: nominee info, policy number, expiry date, documents
- If not enrolled: "Not enrolled" with "Send enrollment reminder" action (just updates activity log)

### Salesperson Self-Service (`/app/dashboard/hr/page.tsx`)

**Insurance section:**
- If not enrolled: "Enroll in Insurance" button → opens enrollment form
- If enrolled: View enrollment status, nominee details, policy info (read-only)
- Enrollment form: Required fields (nominee name, relation, DOB, existing conditions toggle). Optional fields in a collapsible "Additional Details" section (dependents, pre-existing details, preferred hospital, sum insured preference)

**Queries section:**
- "Submit Query" button → opens form:
  - Type selector (dropdown from HR_QUERY_TYPES)
  - Subject input
  - Description textarea
  - Submit button
- Below: "My Queries" table (Type, Subject, Status badge, Date, Resolution note if resolved)
- Empty state: "No queries submitted"

**Suggestions section:**
- "Submit Suggestion" button → opens form:
  - Anonymous toggle (Switch component, default: off)
  - When anonymous: helper text "Your identity will be hidden from HR"
  - Category selector (optional)
  - Content textarea
  - Submit button
- Below: "My Suggestions" table (only named suggestions — anonymous ones don't appear here since the employee shouldn't see them listed)
- Empty state: "No suggestions submitted"

## New Components

### `components/hr/insurance/`
- `enrollment-form.tsx` — Insurance enrollment form with required + optional sections
- `enrollment-list.tsx` — DataTable for HR's insurance tracker
- `enrollment-detail-sheet.tsx` — Sheet with full enrollment details + tracker editing
- `insurance-document-upload.tsx` — Upload button + document list with download/delete
- `renewal-alerts.tsx` — Expiry alert card with urgency coloring
- `enrollment-status-badge.tsx` — Reusable status badge for insurance

### `components/hr/queries/`
- `query-submit-form.tsx` — Employee query submission form (type, subject, description)
- `query-queue.tsx` — HR-facing DataTable with filters and actions
- `query-detail-sheet.tsx` — Sheet with full query details + status timeline + action buttons
- `query-resolve-popover.tsx` — Popover for resolution note (follows existing popover pattern)
- `query-history.tsx` — Employee's own query list for self-service

### `components/hr/suggestions/`
- `suggestion-submit-form.tsx` — Submission form with anonymous toggle + category + content
- `suggestion-list.tsx` — Card-based list for HR with inline expand/review
- `suggestion-review-form.tsx` — Inline status change + review note
- `my-suggestions.tsx` — Employee's named suggestions list for self-service

## Anonymous Suggestion Privacy

The `suggestions.listAll` query (HR-facing) explicitly strips `userId` from results where `isAnonymous === true`:

```ts
// In the query handler:
const results = suggestions.map(s => ({
  ...s,
  userId: s.isAnonymous ? undefined : s.userId,
  submitterName: s.isAnonymous ? null : userName,
}))
```

This means:
- HR sees the content but not the author for anonymous suggestions
- The `userId` is stored in the DB for abuse cases (admin can access raw DB if needed)
- The API never exposes the identity to the HR UI
- Employee's "My Suggestions" only shows their named suggestions (anonymous ones are invisible to them after submission too)

## Verification

### Insurance
1. Employee navigates to self-service → sees "Enroll in Insurance" → fills required fields → submits
2. HR sees enrollment in tracker with "pending" status
3. HR adds policy number, expiry date → status changes to "enrolled"
4. HR uploads insurance document → appears in enrollment detail
5. Employee sees their enrollment status in self-service (read-only)
6. When policy is 30 days from expiry → appears in HR dashboard alerts
7. All operations logged

### Queries
1. Employee submits a "Salary Certificate" request with subject and description
2. HR sees it in query queue as "open"
3. HR marks it "in_progress" → employee sees status update in their query list
4. HR resolves with a note → employee sees "resolved" with the note
5. Filter by status/type works correctly
6. All operations logged

### Suggestions
1. Employee submits a named suggestion → appears in HR viewer with their name
2. Employee submits an anonymous suggestion → appears in HR viewer as "Anonymous"
3. HR reviews and marks as "implemented" with a note
4. Employee can see their named suggestions in self-service but NOT their anonymous ones
5. Filter by status/category works
6. All operations logged (anonymous submissions logged with anonymized performer)
