# After-Sales Process Module — Design Spec

## Context

SA Ventures CRM tracks leads through a sales pipeline ending at "Booking Done" / "Closed Won". After booking, there is a 10-step legal, financial, and documentation process to complete the property purchase. This is currently untracked.

## Goal

Add a first-class After-Sales Process entity that auto-creates when a lead reaches "Booking Done" and tracks 10 sequential steps from booking form fill-up through bank disbursement. Same salesperson manages it. No new roles needed.

## The 10 Steps

| # | Key | Label | Category | Optional Fields |
|---|-----|-------|----------|----------------|
| 1 | `booking_form_fillup` | Booking Form Fill-up | documentation | `bookingAmount` |
| 2 | `share_project_documents` | Share Project Documents | documentation | Document uploads |
| 3 | `loan_document_collection` | Loan Document Collection | documentation | Document uploads |
| 4 | `loan_processing` | Loan Processing | loan | `bankName`, `loanAmount`, `sanctionDate` |
| 5 | `ocr_payment_collection` | OCR / Down Payment Collection | financial | `amount`, `paymentMode` |
| 6 | `draft_agreement_preparation` | Draft Agreement Preparation | documentation | — |
| 7 | `stamp_duty_payment` | Stamp Duty Payment | financial | `amount` |
| 8 | `registration` | Property Registration | legal | `registrationNumber`, `registrationDate` |
| 9 | `original_document_collection` | Original Document Collection | documentation | Document uploads |
| 10 | `bank_disbursement` | Bank Disbursement | financial | `disbursementAmount`, `disbursementDate` |

Steps are strictly sequential. Admin can skip steps (e.g., loan steps for cash purchases). All structured fields are optional.

## Data Model

### Table: `afterSalesProcesses`

- `leadId` — link to lead (1:1)
- `assignedTo` — denormalized from lead for indexed queries
- `projectId` — denormalized from lead
- `status` — "in_progress" | "completed" | "on_hold"
- `currentStep` — key of first incomplete step
- `steps` — JSON string: AfterSalesStep[]
- `completedAt` — set when all steps done
- `createdAt`, `updatedAt`

### Lead Lifecycle

- Lead stays at "Booking Done" during after-sales
- All 10 steps complete → lead auto-transitions to "Closed Won"
- Deal falls through → salesperson manually sets "Closed Lost"

## Backend

New file: `convex/afterSales.ts`

### Queries
- `getByLeadId` — lead detail banner
- `getById` — full process view
- `getMyProcesses` — salesperson dashboard
- `listAll` — admin table with filters
- `getStats` — dashboard stat counts

### Mutations
- `create` — manual creation / backfill
- `completeStep` — complete current step, advance
- `skipStep` — admin-only skip
- `updateStatus` — in_progress / on_hold
- `uploadDocument` / `removeDocument` — document step files
- `updateStepRemark` — edit remarks

### Triggers
- Auto-create on "Booking Done" (in `leads.updateStatus`)
- Cascade reassign (in `leads.reassign`)

## UI

### Vertical Stepper (core component)
- 10-step vertical progression in a Dialog (sm:max-w-4xl h-[90vh])
- Completed: green square + checkmark, strikethrough label, expandable data
- Current: primary square + step number, inline complete action
- Pending: muted square, not interactive
- Skipped: dashed border, "Skipped" badge

### Lead Detail Banner
- Between auto-suggest banner and lead details grid
- Shows "After Sales: Step X of 10 — {label}" with progress bar + "View" button

### Salesperson Dashboard
- After-sales cards between Follow-ups and My Leads sections
- Urgency colors: red (5+ days stale), primary (3+ days), blue (active)

### Admin Page
- `/admin/after-sales` — stat cards + filters + DataTable
- Row click opens process dialog

### Sidebar
- "After Sales" nav item for both admin and salesperson
- Badge count for stale processes

## Components

| Component | Pattern Source |
|-----------|---------------|
| `after-sales-process-dialog.tsx` | `lead-detail-sheet.tsx` |
| `after-sales-stepper.tsx` | `remark-timeline.tsx` |
| `after-sales-step-node.tsx` | `onboarding-checklist.tsx` |
| `after-sales-banner.tsx` | `auto-suggest-banner.tsx` |
| `after-sales-card.tsx` | `follow-up-card.tsx` |
| `after-sales-admin-table.tsx` | `admin/lead-table.tsx` |
