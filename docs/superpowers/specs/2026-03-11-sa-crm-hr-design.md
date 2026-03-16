# SA CRM — HR Module Design Spec

## Overview

An HR software module for SA Ventures, managing employee lifecycle from onboarding to payroll. The company has 50+ employees — all non-DSM CRM users (admins and salespeople). This module adds a new `hr` role for dedicated HR staff, while admins also retain full HR access.

**Scope:** Employee profiles, onboarding, document/letter generation, payroll (Indian format), insurance enrollment/tracking, HR queries, and an anonymous suggestion box.

## Tech Stack (Same as Phase 1)

- **Frontend:** Next.js 16 (App Router, Turbopack) + Tailwind CSS v4 + shadcn/ui
- **Backend:** Convex (database, real-time queries, server functions, file storage)
- **Auth:** Clerk (role-based access control)
- **PDF Generation:** `pdf-lib` (pure JS, runs in Convex actions, zero native deps)
- **Fonts:** Geist (sans), JetBrains Mono (mono — default body font)
- **Theme:** Light only. Zero border-radius. Warm red/orange primary.
- **Icons:** HugeIcons

## User Roles (Updated)

| Role | Description |
|------|-------------|
| **Admin** | Everything from Phase 1 + full HR access. Can access `/hr/...` routes. |
| **Salesperson** | Phase 1 access + "My HR" self-service section (view payslips, letters, submit queries, fill onboarding). |
| **DSM** | Unchanged. Excluded from HR entirely — not a managed employee. |
| **HR** | New role. Manages employee profiles, onboarding, payroll, letters, insurance, queries, suggestions. Sees only HR features. |

### HR Permissions Matrix

| Capability | Admin | HR | Salesperson | DSM |
|---|:---:|:---:|:---:|:---:|
| View HR dashboard | Yes | Yes | No | No |
| Manage employee profiles | Yes | Yes | Own (via self-service) | No |
| Run payroll | Yes | Yes | No | No |
| Generate letters | Yes | Yes | No | No |
| View own payslips | Yes | Yes | Yes | No |
| Download own letters | Yes | Yes | Yes | No |
| Submit HR query | No | No | Yes | No |
| Submit suggestion | No | No | Yes | No |
| Review queries/suggestions | Yes | Yes | No | No |
| Manage insurance | Yes | Yes | Own enrollment | No |
| Complete own onboarding form | N/A | N/A | Yes | No |
| Manage onboarding checklists | Yes | Yes | No | No |

## Core Entities (New)

### Employee Profiles
- Extends the existing `users` table via a separate `employeeProfiles` table (linked by `userId`)
- Keeps the Clerk-synced `users` table clean — sensitive HR data lives separately
- Fields: personal info (DOB, gender, PAN, Aadhar, address, blood group, marital status, parents' names), banking (bank name, account number, IFSC), emergency contact (name, phone, relation), employment metadata (date of joining, designation, department)

### Onboarding Checklists
- One per employee, auto-created when admin assigns a non-DSM role
- 7 hardcoded items: Submit PAN copy, Submit Aadhar copy, Submit bank details, Submit passport photos, Sign offer letter, Complete personal info form, Provide emergency contact
- Stored as JSON array in a single row (small fixed set, always loaded together)
- Both HR and employee can update — HR is source of truth
- Existing employees get onboarding too (backfill on module launch)

### Letter Templates
- System-defined templates with `{{placeholder}}` syntax
- 6 default templates: appointment, warning, experience, termination, salary certificate, increment
- HR picks template + employee → auto-fills → can edit text → generates PDF
- External document upload also supported

### Employee Letters
- Generated or uploaded PDFs linked to employees
- Stored in Convex file storage (same pattern as `projectCreatives`)

### Salary Components
- Per-employee configurable structure — each row is one component (earning or deduction)
- Default Indian structure: Basic, HRA, DA, Conveyance, Medical, Special Allowance (earnings) + PF 12%, ESI 0.75%, Professional Tax, TDS (deductions)
- HR can add/remove custom components per employee

### Payroll Runs
- Monthly batch processing: HR runs payroll → system auto-calculates from salary components → HR reviews → overrides individual amounts if needed → confirms
- Each run creates payslip records for all managed employees
- Confirmed runs trigger PDF generation for all payslips

### Payslips
- Per-employee per-month record with JSON breakdown snapshot
- Snapshot captures exact component amounts at time of processing (not live references)
- Generated as Indian-format PDF via `pdf-lib`

### Insurance Enrollments
- Employee fills enrollment form: required (nominee name/relation/DOB, existing conditions) + optional (dependents, pre-existing details, preferred hospital, sum insured)
- HR manages tracker: policy number, expiry date, renewal reminder, status
- Document upload for policy files

### HR Queries
- Predefined types: salary certificate, experience letter, leave encashment, salary advance, address change, bank detail change, custom/other
- Status workflow: open → in_progress → resolved/rejected
- Employee submits, HR processes

### Suggestions
- Anonymous or named (employee chooses at submission time)
- System stores userId internally for abuse prevention
- HR-facing queries strip userId from anonymous entries
- Status workflow: new → reviewed → implemented/dismissed

## Schema (10 New Tables)

```
employeeProfiles
├── userId -> users._id
├── dateOfBirth, gender, fatherName, motherName, maritalStatus, bloodGroup
├── panNumber, aadharNumber, photoStorageId, address
├── bankName, accountNumber, ifscCode
├── emergencyContactName, emergencyContactPhone, emergencyContactRelation
├── dateOfJoining, designation, department
├── createdAt, updatedAt
└── Index: byUserId

onboardingChecklists
├── userId -> users._id
├── employeeProfileId -> employeeProfiles._id
├── status ("pending" | "in_progress" | "completed")
├── items (JSON string: [{ key, label, completedAt?, completedBy? }])
├── createdAt, completedAt?
└── Indexes: byUserId, byStatus

letterTemplates
├── type ("appointment" | "warning" | "experience" | "termination" | "salary_certificate" | "increment")
├── name, content (with {{placeholders}}), isActive
├── createdAt, updatedAt
└── Indexes: byType, byIsActive

employeeLetters
├── userId -> users._id
├── templateType?, title, storageId -> _storage, fileName
├── isGenerated (true = system-generated, false = uploaded)
├── generatedBy -> users._id
├── createdAt
└── Indexes: byUserId, byUserIdAndType

salaryComponents
├── userId -> users._id
├── name, type ("earning" | "deduction"), amount (INR)
├── isCustom, order
├── createdAt, updatedAt
└── Index: byUserId

payrollRuns
├── month (1-12), year
├── status ("draft" | "confirmed")
├── processedBy -> users._id, confirmedAt?
├── createdAt
└── Indexes: byYearMonth, byStatus

payslips
├── payrollRunId -> payrollRuns._id
├── userId -> users._id
├── month, year
├── breakdown (JSON: { components[], grossEarnings, totalDeductions, netPay })
├── grossEarnings, totalDeductions, netPay
├── isOverridden, pdfStorageId?
├── createdAt
└── Indexes: byPayrollRunId, byUserId, byUserIdAndYearMonth

insuranceEnrollments
├── userId -> users._id
├── nomineeName, nomineeRelation, nomineeDob, existingConditions
├── dependents? (JSON), preExistingDetails?, preferredHospital?, sumInsured?
├── policyNumber?, expiryDate?, renewalReminderDate?, status
├── createdAt, updatedAt
└── Indexes: byUserId, byStatus, byExpiryDate

insuranceDocuments
├── insuranceEnrollmentId -> insuranceEnrollments._id
├── userId -> users._id
├── storageId -> _storage, fileName, fileType
├── createdAt
└── Indexes: byInsuranceEnrollmentId, byUserId

hrQueries
├── userId -> users._id
├── type, subject, description
├── status ("open" | "in_progress" | "resolved" | "rejected")
├── resolvedBy?, resolutionNote?
├── createdAt, updatedAt, resolvedAt?
└── Indexes: byUserId, byStatus, byType

suggestions
├── userId? -> users._id (null if anonymous)
├── isAnonymous, content, category?
├── status ("new" | "reviewed" | "implemented" | "dismissed")
├── reviewedBy?, reviewNote?
├── createdAt, updatedAt
└── Indexes: byStatus, byUserId
```

## Route Structure

### HR Portal (`/hr/...`) — accessible by `hr` and `admin` roles

| Route | Purpose |
|-------|---------|
| `/hr` | HR Dashboard — stat cards (pending onboardings, open queries, upcoming renewals, payroll status) |
| `/hr/employees` | Employee directory — searchable, filterable, paginated table |
| `/hr/employees/[id]` | Employee detail — profile, onboarding, letters, salary, insurance, history |
| `/hr/onboarding` | Onboarding queue — pending/in-progress checklists |
| `/hr/letters` | Letter template management + generation |
| `/hr/payroll` | Payroll management — run payroll, view history |
| `/hr/payroll/[runId]` | Payroll run detail — review/override payslips |
| `/hr/insurance` | Insurance tracker — enrollment list, expiry alerts |
| `/hr/queries` | HR query queue — process employee requests |
| `/hr/suggestions` | Suggestion box viewer — review/dismiss |

### Employee Self-Service — "My HR" sidebar item

| Route | Purpose |
|-------|---------|
| `/dashboard/hr` | Salesperson's HR self-service page |
| `/dashboard/hr/onboarding` | Onboarding form (if incomplete) |
| `/admin/hr` | Admin's HR self-service page (same shared component) |

Self-service pages use a shared component (`components/hr/self-service/my-hr-page.tsx`) mounted under different layouts. The onboarding banner renders front-and-center (non-blocking reminder) until completed.

### Sidebar Updates

**HR role:**
1. Dashboard (`/hr`)
2. Employees (`/hr/employees`)
3. Onboarding (`/hr/onboarding`)
4. Letters (`/hr/letters`)
5. Payroll (`/hr/payroll`)
6. — separator —
7. Insurance (`/hr/insurance`)
8. Queries (`/hr/queries`)
9. Suggestions (`/hr/suggestions`)

**Salesperson — add:**
- "My HR" (`/dashboard/hr`) — after existing items, before separator

**Admin — add:**
- "My HR" (`/admin/hr`) — after existing items, before separator

## Cross-Cutting Concerns

### Activity Logging
All HR mutations log to the existing `activityLogs` table. Extended `entityType` union:
`"lead" | "project" | "user" | "employee" | "payroll" | "letter" | "insurance" | "hr_query" | "suggestion"`

### PDF Storage
All generated PDFs (letters, payslips) use Convex file storage — same pattern as `projectCreatives`:
- Actions generate PDF blobs using `pdf-lib`
- Store via `ctx.storage.store(blob)`
- Retrieve via `ctx.storage.getUrl(storageId)` for signed download URLs

### Onboarding Auto-Trigger
When `updateUser` mutation changes a user's role to a non-DSM role:
1. Check if `employeeProfiles` record exists for this user
2. If not, create one + create an `onboardingChecklists` record with all 7 items
3. On module launch, backfill: run a one-time migration for all existing non-DSM users

### Middleware
- Add `/hr` route matcher: only `hr` and `admin` roles can access
- Add `hr` to `roleHomeRoutes`: `hr -> "/hr"`
- Self-service routes (`/dashboard/hr`, `/admin/hr`) already covered by existing matchers

## Key Design Decisions

1. **Separate `employeeProfiles` table:** The `users` table is Clerk-managed. HR data (PAN, Aadhar, bank details) is sensitive and domain-specific. Separation avoids polluting Clerk sync.

2. **JSON checklist items:** The onboarding checklist is 7 fixed items, always loaded together. A JSON string in one row is simpler than 7 rows in a join table.

3. **JSON payslip snapshots:** A payslip captures the exact salary breakdown at time of processing. If salary changes next month, prior payslips stay accurate.

4. **`pdf-lib` for PDF generation:** Pure JS, no native deps, runs in Convex actions. Sufficient for letters and payslips. No external PDF service needed.

5. **Non-blocking onboarding:** The banner is a persistent reminder, not a CRM blocker. Employees can still work leads while onboarding is in progress.

6. **Anonymous suggestions — stored but hidden:** `userId` is stored internally (abuse safety valve) but stripped from HR-facing queries for anonymous entries.

7. **HR skips self-service:** HR role has full access to all HR data directly, so no "My HR" section needed for them.

## Development Phases

| Phase | Scope | Dependencies |
|-------|-------|-------------|
| **A: Foundation & Onboarding** | `hr` role, employee profiles, onboarding checklists, HR dashboard, employee directory, self-service skeleton | None — foundation for everything |
| **B: Documents & Letters** | Letter templates, generation, upload, PDF creation | Phase A (needs employee profiles) |
| **C: Payroll** | Salary components, batch payroll, payslip PDF generation | Phase A (needs employee profiles) |
| **D: Insurance, Queries & Suggestions** | Insurance enrollment/tracker, HR query system, suggestion box | Phase A (needs employee profiles + self-service) |

Each phase has its own spec and UX stories document.
