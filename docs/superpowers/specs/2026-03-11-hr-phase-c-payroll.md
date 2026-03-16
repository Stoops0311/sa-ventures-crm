# HR Phase C — Payroll

## Overview

Adds payroll management: per-employee salary configuration with configurable Indian components, monthly batch payroll processing, inline overrides, and payslip PDF generation in Indian format. Employees view/download payslips from self-service.

**Depends on:** Phase A (employee profiles must exist)

## New Tables

### `salaryComponents`

```ts
salaryComponents: defineTable({
  userId: v.id("users"),
  name: v.string(),         // "Basic" | "HRA" | "DA" | "PF" | etc. or custom
  type: v.string(),         // "earning" | "deduction"
  amount: v.number(),       // monthly amount in INR (whole rupees)
  isCustom: v.boolean(),    // true if HR added a custom component
  order: v.number(),        // display order
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("byUserId", ["userId"])
```

### `payrollRuns`

```ts
payrollRuns: defineTable({
  month: v.number(),        // 1-12
  year: v.number(),
  status: v.string(),       // "draft" | "confirmed"
  processedBy: v.id("users"),
  confirmedAt: v.optional(v.number()),
  createdAt: v.number(),
})
  .index("byYearMonth", ["year", "month"])
  .index("byStatus", ["status"])
```

### `payslips`

```ts
payslips: defineTable({
  payrollRunId: v.id("payrollRuns"),
  userId: v.id("users"),
  month: v.number(),
  year: v.number(),
  breakdown: v.string(),    // JSON: { components: [{ name, type, amount }], grossEarnings, totalDeductions, netPay }
  grossEarnings: v.number(),
  totalDeductions: v.number(),
  netPay: v.number(),
  isOverridden: v.boolean(),
  pdfStorageId: v.optional(v.id("_storage")),
  createdAt: v.number(),
})
  .index("byPayrollRunId", ["payrollRunId"])
  .index("byUserId", ["userId"])
  .index("byUserIdAndYearMonth", ["userId", "year", "month"])
```

## Default Indian Salary Structure

When HR first configures an employee's salary, these components are pre-populated (HR adjusts amounts):

### Earnings
| Component | Default | Notes |
|-----------|---------|-------|
| Basic | — | HR sets amount. Typically 40-50% of CTC |
| HRA (House Rent Allowance) | — | Typically 40-50% of Basic |
| DA (Dearness Allowance) | — | Optional, HR sets |
| Conveyance Allowance | — | Typically ₹1,600/month |
| Medical Allowance | — | Typically ₹1,250/month |
| Special Allowance | — | Balancing figure |

### Deductions
| Component | Default | Notes |
|-----------|---------|-------|
| PF (Provident Fund) | 12% of Basic | Employee contribution |
| ESI (Employee State Insurance) | 0.75% of Gross | If gross ≤ ₹21,000/month |
| Professional Tax | ₹200/month | State-dependent, simplified |
| TDS (Tax Deducted at Source) | — | HR enters manually based on tax slab |

**Note:** PF and ESI percentages are stored as amounts (not percentages). When HR sets up salary, the system shows a helper that calculates `12% of Basic = ₹X` but stores the final ₹X amount. This avoids percentage-vs-amount ambiguity in the payslip snapshot.

## New Convex Files

### `convex/salaryComponents.ts`

**Queries:**
- `listByUser(userId)` — All salary components for an employee, ordered by `order`. HR/admin: any. Self-service: own only.
- `hasComponents(userId)` — Boolean check if employee has salary configured. Used by payroll batch to skip unconfigured employees.

**Mutations:**
- `setAll(userId, components[])` — Replace all components for an employee at once. Each component: `{ name, type, amount, isCustom, order }`. HR/admin only. Logs activity.
- `initializeDefaults(userId)` — Create the default Indian structure with zero amounts for a new employee. HR/admin only.

### `convex/payroll.ts`

**Queries:**
- `listRuns(filters?)` — All payroll runs, sorted by year/month descending. Paginated. HR/admin only.
- `getRunDetail(runId)` — Single run with all payslips joined (with user names). HR/admin only.
- `getMyPayslips(limit?)` — Current user's payslip history, sorted by year/month descending. Self-service.
- `getPayslipDownloadUrl(payslipId)` — Signed download URL. HR/admin or payslip owner.
- `canRunPayroll(month, year)` — Check if a run already exists for this month. Prevents duplicates.

**Mutations:**
- `createRun(month, year)` — Create a new draft payroll run. HR/admin only.
  1. Validate no existing run for this month/year
  2. Create `payrollRuns` record with status `"draft"`
  3. Query all managed employees (non-DSM) with salary components
  4. For each employee with components:
     - Sum earnings (`type: "earning"`) → `grossEarnings`
     - Sum deductions (`type: "deduction"`) → `totalDeductions`
     - Calculate `netPay = grossEarnings - totalDeductions`
     - Store breakdown as JSON snapshot
     - Insert `payslips` record
  5. Skip employees without salary components (they don't appear in this run)
  6. Log activity

- `overridePayslip(payslipId, overrides)` — Override specific component amounts in a draft payslip. HR/admin only.
  1. Validate run is still `"draft"`
  2. Parse breakdown JSON
  3. Apply overrides to specific components
  4. Recalculate gross/deductions/net
  5. Update payslip with `isOverridden: true`
  6. Log activity

- `confirmRun(runId)` — Confirm a draft run. HR/admin only.
  1. Set status to `"confirmed"`, set `confirmedAt`
  2. Log activity
  3. Schedule PDF generation (calls action)

- `deleteRun(runId)` — Delete a draft run and all its payslips. HR/admin only. Cannot delete confirmed runs.

**Actions:**
- `generatePayslipPdf(payslipId)` — Generate Indian-format payslip PDF for one employee/month.
  1. Fetch payslip + employee profile + user data
  2. Generate A4 PDF with:
     - Company header (SA VENTURES)
     - "PAYSLIP FOR [Month Year]"
     - Employee details table (Name, Designation, Department, PAN, Bank Account)
     - Earnings table (left column) + Deductions table (right column)
     - Totals row: Gross Earnings | Total Deductions | **Net Pay**
     - Footer: "This is a system-generated document"
  3. Store in Convex file storage
  4. Patch `pdfStorageId` on payslip record

- `generateAllPayslipPdfs(runId)` — Batch generate PDFs for all payslips in a confirmed run. Iterates and calls `generatePayslipPdf` for each.

## New Pages

### `/app/hr/payroll/page.tsx` — Payroll Management

**Top section: Run Payroll**
- Month/Year selector (default: current month)
- "Run Payroll" button → calls `createRun` → redirects to run detail page
- Validation: if run already exists for selected month, show warning with link to existing run

**Main section: Payroll History**
- Table of all runs: Month/Year, Status (badge: draft=yellow, confirmed=green), Employees Count, Total Net Pay, Processed By, Date
- Click row → navigates to run detail
- Filter by status, year

### `/app/hr/payroll/[runId]/page.tsx` — Payroll Run Detail

**Header:**
- "Payroll — [Month Year]" title
- Status badge (Draft / Confirmed)
- Action buttons:
  - Draft: "Confirm Payroll" (primary), "Delete Run" (destructive)
  - Confirmed: "Download All Payslips" (zip or individual links)

**Main: Review Table**
- DataTable with columns:
  - Employee Name
  - Designation
  - Gross Earnings (₹ formatted)
  - Total Deductions (₹ formatted)
  - Net Pay (₹ formatted, bold)
  - Override indicator (badge if `isOverridden`)
  - Actions: View Detail (opens Sheet), Override (opens Popover — draft only), Download PDF (confirmed only)

- **Override Popover** (draft only): Shows all components with editable amount fields. "Save" recalculates and updates. Same pattern as lead status change popover.

- **Payslip Detail Sheet** (side="right"): Full breakdown for one employee:
  - Employee info (name, designation, PAN, bank)
  - Earnings table (component name, amount)
  - Deductions table (component name, amount)
  - Summary: Gross | Deductions | Net Pay

- **Summary row at bottom of table:** Total across all employees for Gross, Deductions, Net

### Updated: Employee Detail (`/app/hr/employees/[id]/page.tsx`)

**Salary section** (previously placeholder):
- If no components configured: "Configure Salary" button → opens salary config form
- If configured: Table of components (Name, Type badge, Amount ₹)
- Edit button → opens salary config form
- **Salary Config Form**: Starts with default Indian components (zero amounts). Each row: component name, type (earning/deduction), amount input. "Add Custom Component" button at bottom. Save replaces all components.

**Payslips sub-section:**
- Table of payslips: Month/Year, Gross, Deductions, Net, Status (from run), Download
- Links to payslip detail

### Updated: Salesperson Self-Service (`/app/dashboard/hr/page.tsx`)

**My Payslips section**:
- Table: Month/Year, Net Pay (₹), Download PDF
- Empty state: "No payslips yet"
- Last 12 months shown by default, "View All" for older

## New Components

### `components/hr/payroll/`
- `salary-config-form.tsx` — Configure salary components per employee. Table of rows with name/type/amount. Add/remove custom components.
- `payroll-run-list.tsx` — Table of payroll runs with status filter
- `payroll-run-wizard.tsx` — Month selector + "Run Payroll" button with validation
- `payroll-review-table.tsx` — DataTable of payslips with override popover and inline actions
- `payslip-detail-sheet.tsx` — Sheet showing full payslip breakdown
- `payslip-override-popover.tsx` — Popover with editable component amounts (follows status change popover pattern)
- `payslip-history.tsx` — Reusable payslip list (used in employee detail + self-service)
- `salary-helper.tsx` — Shows percentage calculations (e.g., "12% of ₹25,000 = ₹3,000") when configuring PF/ESI

## Currency Formatting

Add to `lib/constants.ts` or a new `lib/currency.ts`:
```ts
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}
```

All monetary values displayed with Indian number formatting (lakhs/crores grouping): ₹1,25,000 not ₹125,000.

## Payslip PDF Layout

```
┌─────────────────────────────────────────────┐
│              SA VENTURES                      │
│         PAYSLIP FOR MARCH 2026               │
├─────────────────────────────────────────────┤
│ Name: Rahul Sharma    PAN: ABCDE1234F        │
│ Designation: Sales Executive                  │
│ Department: Sales     Bank: SBI / XXXX1234   │
├──────────────────────┬──────────────────────┤
│      EARNINGS        │     DEDUCTIONS        │
├──────────────────────┼──────────────────────┤
│ Basic      ₹25,000   │ PF          ₹3,000   │
│ HRA        ₹12,500   │ ESI           ₹375   │
│ DA          ₹5,000   │ Prof. Tax     ₹200   │
│ Conveyance  ₹1,600   │ TDS         ₹2,500   │
│ Medical     ₹1,250   │                       │
│ Special     ₹4,650   │                       │
├──────────────────────┼──────────────────────┤
│ GROSS      ₹50,000   │ TOTAL       ₹6,075   │
├──────────────────────┴──────────────────────┤
│           NET PAY: ₹43,925                    │
│    (Rupees Forty-Three Thousand               │
│     Nine Hundred Twenty-Five Only)            │
├─────────────────────────────────────────────┤
│ This is a system-generated payslip.           │
└─────────────────────────────────────────────┘
```

## Verification

1. Open employee detail → click "Configure Salary" → default Indian components appear with zero amounts
2. Set amounts → save → components persist
3. Add a custom component ("Performance Bonus", earning) → appears in list
4. Navigate to `/hr/payroll` → select current month → "Run Payroll"
5. Draft run created → review table shows all employees with configured salaries
6. Click override on an employee → adjust an amount → net pay recalculates
7. Confirm payroll → status changes to confirmed → PDFs generated for all payslips
8. Download a payslip PDF → verify Indian format with correct amounts
9. Employee logs into self-service → sees payslip under "My Payslips" → can download
10. Cannot create duplicate run for same month/year
11. Cannot override amounts on a confirmed run
12. Can delete a draft run; cannot delete a confirmed run
13. All operations logged in activity log
