# HR Phase C -- Payroll UX Stories

## Design System Reference

Same constraints as all SA CRM pages:

- **Theme:** Light only. White background (`oklch(1 0 0)`), near-black foreground (`oklch(0.145 0 0)`)
- **Primary color:** Warm red/orange (`oklch(0.514 0.222 16.935)`) -- used for primary buttons, active states, key accents
- **Border radius:** Zero everywhere. `--radius: 0`. Every card, button, input, badge is a sharp rectangle
- **Body font:** JetBrains Mono (monospace) -- the precision instrument aesthetic. Payroll data in monospace looks like what HR expects: a ledger, not a brochure
- **Heading font:** Geist Sans -- page titles, section headers, stat numbers
- **Icons:** HugeIcons (`@hugeicons/react` + `@hugeicons/core-free-icons`)
- **Components:** shadcn/ui exclusively
- **Animations:** tw-animate-css -- `animate-in`, `fade-in`, `slide-in-from-bottom`, etc.
- **Currency:** Indian format always. `₹1,25,000` not `₹125,000`. Lakhs/crores grouping via `Intl.NumberFormat("en-IN")`

### Payroll-Specific Aesthetic Notes

Payroll is the most numerically dense area of the entire CRM. The monospace font earns its keep here -- columns of rupee amounts align perfectly, decimal positions lock into place, and totals read like a proper financial ledger. Every number on every payroll page uses `tabular-nums` to ensure digit-width consistency. The sharp zero-radius badges and cards frame financial data the way a printed salary register would: precise, institutional, trustworthy.

---

## Page 1: Payroll Management (`/hr/payroll`)

### Page Purpose
Run monthly payroll and track the history of every payroll cycle the company has ever processed.

### User Arrives With...
**Mindset:** The HR person or admin is here for one of two reasons: (a) it is end-of-month and they need to run payroll for all employees, or (b) they need to look up a past payroll run -- maybe to re-download payslips, check an override, or verify a historical amount. The first scenario is time-sensitive and happens once a month. The second is ad-hoc lookup.
**Emotion:** When running payroll: focused and slightly tense. Payroll is high-stakes -- getting someone's salary wrong is a serious error. They want the system to calculate everything correctly and let them verify before committing. When browsing history: calm, investigative.
**Goal:** Either initiate this month's payroll run and get to the review table, or find a specific past run quickly.

### The Attention Flow

1. **First 0.5s:** The "Run Payroll" section at the top -- a prominent card with a month/year selector and a large action button. This is unmissable and answers "can I run payroll right now?"
2. **First 3s:** Eyes scan the month/year selector (pre-filled with current month), check if a run already exists for this period (inline validation message), and locate the button
3. **First 10s:** Either they click "Run Payroll" and navigate to the review table, or they scroll down to the history table to find a past run
4. **After that:** Browse history, filter by year/status, click into a run for details

### Information Hierarchy

**Tier 1 -- Run Payroll Card (top of page, above the fold):**

```
shadcn/ui: Card (border, prominent, bg-background)
Width: full width, but content is compact -- centered controls in a horizontal layout
Padding: p-6
```

Layout inside the card:

```
| "Run Payroll"  (Geist Sans, text-lg, font-semibold)                              |
|                                                                                    |
| Month: [Select ▾]   Year: [Select ▾]   [ Run Payroll → ]                         |
|                                                                                    |
| (validation message area -- contextual, see below)                                |
```

Component details:
- **Month Select** (shadcn Select): Options are January through December. Default: current month. Width: `w-40`
- **Year Select** (shadcn Select): Options are current year and previous year. Default: current year. Width: `w-28`
- **Run Payroll button** (shadcn Button, variant="default", size="default"): HugeIcon `MoneyReceiveSquareIcon` on the left. This is the primary action for the entire page.

**Validation states (shown below the controls):**
- If no run exists for selected month/year: no message. Button is enabled.
- If a draft run exists: Yellow-tinted inline alert -- "A draft payroll run already exists for [Month Year]." with a link: "Continue reviewing →" (Button variant="link") that navigates to the run detail page. The "Run Payroll" button is disabled.
- If a confirmed run exists: Green-tinted inline alert -- "Payroll for [Month Year] has been confirmed." with a link: "View details →". The "Run Payroll" button is disabled.

**Why the validation is inline, not a blocking dialog:** The HR person may click through several months to find the right one. Blocking each selection with a dialog would be infuriating. Inline messages let them scan quickly.

**Tier 2 -- Payroll History Table (main body):**

```
Section header: "Payroll History" (Geist Sans, text-lg, font-semibold)
shadcn/ui: DataTable (built on TanStack Table)
```

**Filter bar above the table:**
```
Layout: Horizontal flex bar, gap-2
```
- **Year filter** (shadcn Select): "All Years" default, plus each year that has runs. Width: `w-28`
- **Status filter** (shadcn Select): "All" | "Draft" | "Confirmed". Width: `w-32`

**Table columns:**

| Month/Year | Status | Employees | Total Net Pay | Processed By | Date | Actions |
|---|---|---|---|---|---|---|
| March 2026 | Badge | 47 | ₹18,45,000 | Priya H. | 28 Mar 2026 | DropdownMenu |

Column details:
- **Month/Year:** `font-medium`. Formatted as "March 2026" (full month name + year). Clickable -- navigates to run detail page. This is the primary identifier for a payroll run.
- **Status:** shadcn Badge with color coding:
  - Draft: `bg-yellow-50 text-yellow-700 border-yellow-200` -- signals "needs attention"
  - Confirmed: `bg-green-50 text-green-700 border-green-200` -- signals "done, locked"
- **Employees:** Integer count. `text-muted-foreground`. The number of payslips in this run.
- **Total Net Pay:** `font-mono font-medium`. Indian-formatted currency. This is the most important number per row -- the total disbursement. Align right within the column for ledger aesthetics.
- **Processed By:** User name who created the run. `text-muted-foreground text-xs`.
- **Date:** When the run was created. Format: "28 Mar 2026". `text-muted-foreground text-xs`.
- **Actions:** shadcn DropdownMenu (icon-only trigger, `MoreHorizontalIcon`):
  - "View Details" -- navigates to run detail
  - "Delete Run" (only for draft runs, `text-destructive`) -- opens AlertDialog confirmation

**Pagination:**
```
shadcn/ui: Pagination
Position: Bottom of table
Show: "Showing 1-10 of 24 runs" + page controls
Page size: 10 (payroll runs are monthly -- 10 rows = almost a year of history per page)
```

**Tier 3 -- Empty State (when no payroll runs exist):**

```
Centered in table area:
HugeIcon: MoneyReceiveSquareIcon (size 48, text-muted-foreground)
"No payroll runs yet"
"Select a month above and run your first payroll."
```

### Component Map

```
Layout: Single column, max-w-5xl, mx-auto
Top: Run Payroll Card
Gap: space-y-6
Bottom: Payroll History section (header + filters + DataTable + pagination)
```

**Responsive behavior:**
- Desktop (>= 1024px): Full table layout. Run Payroll controls are horizontal (month, year, button side by side)
- Tablet (768-1023px): Same layout, table may horizontally scroll for the Actions column
- Mobile (< 768px): Run Payroll controls stack vertically (month select, year select, button each on their own line, full width). History table transforms into card list:

Mobile card per run:
```
| March 2026           [Draft badge]  |
| 47 employees  ₹18,45,000 net       |
| Priya H.  •  28 Mar 2026           |
```

### Micro-Interactions

- **Run Payroll button click:** Button enters loading state (spinner + "Processing..."). This is NOT instant -- the system creates a payrollRuns record and generates payslips for every configured employee. Show the loading state for the full duration. On success, navigate to the run detail page with `router.push`. The navigation itself is the success signal.
- **Table row hover:** `bg-muted/50` background. Cursor pointer on the Month/Year cell.
- **Row click (on Month/Year column):** Navigate to `/hr/payroll/[runId]`.
- **Delete draft confirmation:** AlertDialog: "Delete March 2026 payroll run? This will remove all 47 draft payslips. This cannot be undone." Cancel (variant="outline") | Delete (variant="destructive").
- **Real-time update:** If another HR user confirms a run while this page is open, the status badge transitions from yellow to green with `transition-colors duration-500`. The row briefly highlights with `bg-primary/5`.
- **Year filter change:** Instant table re-query. Thin progress bar at top of table during re-fetch.

### Delight Opportunities

1. **Smart month defaulting:** If the current month already has a confirmed run, default the selector to next month. The system anticipates the HR person's intent -- they would not be here to re-run a confirmed month.
2. **Running total at the bottom of the history table:** A summary row showing the year's total disbursement: "2026 Total: ₹2,21,40,000 across 564 payslips." This gives the HR person an instant annual overview without navigating anywhere. Only shown when a year filter is active.
3. **Draft run age warning:** If a draft run is more than 3 days old, show a subtle warning icon next to the status badge with tooltip: "This draft has been pending for 5 days." Gentle nudge to either confirm or delete.

### Anti-Patterns to Avoid

- Do NOT use a calendar or date picker for month/year selection. Two simple Select dropdowns are faster and less error-prone than a calendar widget for month-level granularity.
- Do NOT auto-run payroll. The "Run Payroll" button must require an explicit click. Payroll is too high-stakes for any automatic processing.
- Do NOT show individual employee data on this page. The history table is an overview. Employee-level detail belongs on the run detail page.
- Do NOT hide the "Run Payroll" section behind a button or tab. It must be always visible at the top of the page -- this is the primary action.
- Do NOT allow running payroll for future months. Only current month and past months are valid.

### Mobile Behavior

- Run Payroll card: Controls stack vertically. Button becomes full-width.
- History table: Converts to card list. Each card shows month/year, status badge, employee count, total net pay, and processed-by info. Tap card to navigate to detail.
- Filters: Collapse into a "Filters" button that opens a Sheet with year and status selects stacked vertically.

---

## Page 2: Payroll Run Detail (`/hr/payroll/[runId]`)

### Page Purpose
Review every employee's calculated salary, make overrides where needed, and confirm the payroll run.

### User Arrives With...
**Mindset:** The HR person just ran payroll (or is returning to a draft). They need to carefully review the calculated amounts for each employee before confirming. This is the "double-check" step. They are scanning for anomalies: "Does Rahul's net look right? Did we account for Priya's salary revision? Is the new hire included?" After confirmation, they may return to download PDFs.
**Emotion:** Alert and methodical. This is the most consequential page in the payroll flow. A mistake here means incorrect salary disbursement. They need to trust the numbers. If the run is already confirmed, the emotion shifts to calm retrieval -- they are here to download payslips or verify historical data.
**Goal:** (Draft) Verify all amounts, override where necessary, confirm. (Confirmed) Download payslips, reference historical data.

### The Attention Flow

1. **First 0.5s:** The page header -- "Payroll -- March 2026" with the status badge (Draft or Confirmed). Instant orientation: which month, what state.
2. **First 3s:** The summary row at the top of the review table -- total gross, total deductions, total net pay across ALL employees. This is the aggregate number the HR person compares against their mental model or previous month.
3. **First 10s:** Eyes scan down the table. The Net Pay column (rightmost numeric column, bold) is the scanning column -- anomalies jump out when one number is wildly different from the others.
4. **After that:** Click into specific employees to see breakdowns, override amounts if needed, then confirm.

### Information Hierarchy

**Tier 1 -- Page Header:**

```
Layout: Flex row, items-center, justify-between
Left: Title + status
Right: Action buttons
```

Left side:
- **Back link:** "← Payroll" (Button variant="link", navigates to `/hr/payroll`). Small, unobtrusive, top-left.
- **Title:** "Payroll -- March 2026" (Geist Sans, text-xl, font-bold)
- **Status badge:** Draft (yellow) or Confirmed (green), same colors as history table

Right side (action buttons):
- **Draft state:**
  - "Confirm Payroll" (Button, variant="default", size="default") -- HugeIcon `CheckmarkCircle01Icon` on left. This is the BIG action.
  - "Delete Run" (Button, variant="outline", size="sm", `text-destructive`) -- HugeIcon `Delete01Icon` on left. Smaller, less prominent.
- **Confirmed state:**
  - "Download All Payslips" (Button, variant="default", size="default") -- HugeIcon `FileDownloadIcon` on left.

**Tier 1.5 -- Summary Strip (immediately below header):**

```
Layout: Horizontal flex bar, bg-muted/50, py-3, px-6
Three stat groups, evenly spaced
```

| Total Gross Earnings | Total Deductions | Total Net Pay |
|---|---|---|
| ₹24,50,000 | ₹3,06,250 | ₹21,43,750 |

Each stat:
- Label: `text-xs text-muted-foreground uppercase tracking-wide font-mono`
- Value: `font-sans text-2xl font-bold tabular-nums` (Geist Sans for the big numbers)
- Net Pay gets additional treatment: `text-primary` color to distinguish it as THE number

Additionally, at the far right of the strip:
- **Employee count:** "47 employees" in `text-sm text-muted-foreground`
- **Override count** (if any): "3 overridden" in `text-xs text-amber-600` -- alerts HR that manual adjustments exist

**Tier 2 -- Review Table (the core of the page):**

```
shadcn/ui: DataTable (built on TanStack Table)
Full width, no max-width constraint -- this table needs all available horizontal space
```

**Table columns:**

| # | Employee | Designation | Gross Earnings | Total Deductions | Net Pay | Status | Actions |
|---|---|---|---|---|---|---|---|
| 1 | Rahul Sharma | Sales Executive | ₹50,000 | ₹6,075 | ₹43,925 | -- | ... |
| 2 | Priya Mehta | Sr. Sales Executive | ₹65,000 | ₹8,100 | ₹56,900 | Overridden | ... |

Column details:
- **#:** Row number. `text-muted-foreground text-xs`. Simple counter for reference during verbal discussions ("check row 12").
- **Employee:** `font-medium`. Full name. Not clickable here (the Actions column handles navigation).
- **Designation:** `text-muted-foreground text-xs`. Provides context for whether the salary range makes sense.
- **Gross Earnings:** `font-mono tabular-nums text-right`. Indian-formatted. Right-aligned for ledger scanning.
- **Total Deductions:** `font-mono tabular-nums text-right text-muted-foreground`. Right-aligned. Slightly muted because the net pay is what matters most.
- **Net Pay:** `font-mono tabular-nums text-right font-medium`. Right-aligned. Bold -- this is the column HR scans. The most important number per row.
- **Status:** Only visible when `isOverridden` is true. Shows a small Badge: `bg-amber-50 text-amber-700 border-amber-200` with text "Overridden". Empty cell for non-overridden rows to keep the table clean.
- **Actions:** Three icon buttons in a horizontal group:
  - **View Detail** (HugeIcon `EyeIcon`, ghost button, size="icon-sm") -- opens Payslip Detail Sheet
  - **Override** (HugeIcon `PencilEdit01Icon`, ghost button, size="icon-sm") -- opens Override Popover. Only visible when status is Draft. Hidden for confirmed runs.
  - **Download PDF** (HugeIcon `FileDownloadIcon`, ghost button, size="icon-sm") -- downloads payslip PDF. Only visible when status is Confirmed and PDF has been generated.

**Table sorting:**
- Default sort: Employee name alphabetical. HR knows their team and scans by name.
- Sortable columns: Employee, Gross, Deductions, Net Pay. Clicking header toggles sort. Active sort shows chevron.

**Table search:**
- A search input above the table: "Search employee..." (shadcn Input, `w-64`, with `Search01Icon`). Filters rows client-side by employee name. Essential when the table has 50+ rows.

**Summary row at table bottom:**

```
Sticky row at the bottom of the table (or below the last data row)
Background: bg-muted font-medium
```

| | TOTAL | | ₹24,50,000 | ₹3,06,250 | ₹21,43,750 | | |

The summary row mirrors the summary strip above. This redundancy is intentional -- when scrolled deep into the table, the bottom summary provides the same aggregate without scrolling back up.

**Tier 3 -- Confirmation Flow:**

When "Confirm Payroll" is clicked:

```
shadcn/ui: AlertDialog
Title: "Confirm March 2026 Payroll?"
Description: "This will lock all 47 payslips and generate PDFs. Amounts cannot be changed after confirmation.

Total disbursement: ₹21,43,750"

Cancel (variant="outline") | "Confirm & Generate Payslips" (variant="default")
```

The total disbursement amount in the dialog is intentional -- it is the final sanity check. The HR person sees the big number one last time before committing.

### Component Map

```
Layout: Full width, p-6
Top: Header (back link + title + status + action buttons)
Below header: Summary strip
Gap: space-y-4
Main: Search input + DataTable + summary row + pagination
```

**Responsive behavior:**
- Desktop (>= 1024px): Full table with all columns visible
- Tablet (768-1023px): Designation column hidden. Actions column becomes a single DropdownMenu button.
- Mobile (< 768px): Table converts to card list.

Mobile card per employee:
```
| Rahul Sharma                    [Override badge] |
| Sales Executive                                   |
| Gross: ₹50,000  Deductions: ₹6,075              |
| Net Pay: ₹43,925                         [•••]   |
```

The `[•••]` is a DropdownMenu with View Detail, Override, Download actions.

### Micro-Interactions

- **Row hover:** `bg-muted/50`. The entire row highlights to maintain scanning context.
- **Override badge appearance:** When an override is saved, the "Overridden" badge appears on that row with `animate-in fade-in duration-200`. The numeric values in that row briefly flash with `bg-amber-50` background for 1.5 seconds to signal the change.
- **Confirm button loading:** After clicking "Confirm & Generate Payslips" in the AlertDialog, the button enters loading state: spinner + "Confirming...". This takes a few seconds (batch PDF generation is scheduled). On success:
  - AlertDialog closes
  - Status badge transitions from yellow "Draft" to green "Confirmed" with `transition-colors duration-500`
  - The Override buttons fade out from the Actions column with `animate-out fade-out duration-200`
  - Download PDF buttons fade in with `animate-in fade-in duration-300` (staggered per row, top-to-bottom, 50ms delay between rows -- creates a satisfying cascade effect as PDFs become available)
  - Sonner toast: "Payroll confirmed. Generating 47 payslips..." with a progress-style message
- **Delete run:** AlertDialog: "Delete March 2026 draft? This will permanently remove all 47 draft payslips." Cancel | Delete (destructive). On confirm, navigate back to `/hr/payroll` with Sonner toast: "Draft payroll run deleted."
- **PDF download ready:** As PDFs generate asynchronously, download buttons appear per-row via real-time Convex subscription. Each button fades in individually -- the user can start downloading early payslips while others are still generating.
- **Search input:** Client-side filtering, instant. No debounce needed for 50-row datasets.

### Delight Opportunities

1. **Anomaly highlighting:** If any employee's net pay differs by more than 20% from the previous month's run, highlight that row with a subtle left border: `border-l-3 border-l-amber-400`. Tooltip on hover: "Net pay changed by +15% vs. February 2026." This catches salary revisions, missing deductions, or configuration errors before confirmation.
2. **PDF generation progress:** Instead of a generic "generating" message, show a counter below the summary strip: "Generating payslips: 23 of 47 complete" that increments in real-time as each PDF finishes. The HR person knows exactly how long to wait.
3. **Quick navigation between runs:** Add "← February 2026" and "April 2026 →" navigation links in the header (if adjacent runs exist). Lets HR compare months without going back to the history page.

### Anti-Patterns to Avoid

- Do NOT use a spreadsheet/editable table for the review. This is a REVIEW table with selective overrides via popover, not a bulk-edit spreadsheet. Direct inline editing of every cell would be error-prone and terrifying for payroll.
- Do NOT hide the summary numbers. The aggregate totals must be visible without any scrolling or clicking.
- Do NOT allow confirming while an override popover is open. If the user has unsaved changes in a popover, the Confirm button should be disabled or warn.
- Do NOT show the Override action on confirmed runs. Confirmed payroll is locked. Period.
- Do NOT use pagination for the review table if possible. At 50-60 employees, render all rows. Pagination breaks the scanning flow and hides data. If the employee count exceeds 100, use pagination at page size 50.

### Mobile Behavior

- Header: Title and status on one line. Action buttons stack below.
- Summary strip: Three stats stack vertically instead of horizontal.
- Table: Converts to card list (described above). Cards are tappable to open the detail Sheet.
- Search: Full-width input above the card list.

---

## Page 3: Salary Configuration Form

### Page Purpose
Set up an employee's monthly salary structure with standard Indian components and optional custom additions.

### User Arrives With...
**Mindset:** The HR person is on an employee's detail page (`/hr/employees/[id]`) and needs to either set up salary for a new employee or modify an existing employee's salary structure. They understand Indian payroll components (Basic, HRA, DA, PF, ESI, etc.) and think in terms of CTC breakdowns.
**Emotion:** Careful and methodical. Getting salary configuration wrong means every future payroll run for this employee will be wrong. They may be referencing an offer letter or CTC breakdown document while filling this form.
**Goal:** Enter the correct amounts for each standard component, add any custom components, verify the totals, and save.

### The Attention Flow

1. **First 0.5s:** The form title -- "Salary Configuration" or "Configure Salary" with the employee's name. Confirms they are editing the right person.
2. **First 3s:** The pre-populated list of Indian salary components with amount fields. The structure is familiar -- Basic, HRA, DA, etc. They recognize it instantly.
3. **First 10s:** Start entering amounts. The running total at the bottom updates as they type.
4. **After that:** Add custom components if needed, verify totals, save.

### Information Hierarchy

**Container:** This form lives within the employee detail page, in the "Salary" section. It could be rendered inline (expanding the section) or as a Dialog. Given the number of fields (10+ component rows), a Dialog with scroll is the better choice -- it provides focused context without the employee detail page scrolling behind.

```
shadcn/ui: Dialog (wide -- max-w-2xl)
Title: "Salary Configuration -- [Employee Name]"
Description: "Set monthly salary components. Changes apply to future payroll runs only."
```

**Tier 1 -- Earnings Section:**

```
Section label: "EARNINGS" (text-xs text-muted-foreground uppercase tracking-wide, with a bottom border separator)
```

A table-like form layout. Each row is one earning component:

| Component | Amount (₹/month) | |
|---|---|---|
| Basic | [Input: ₹ 25,000] | |
| HRA (House Rent Allowance) | [Input: ₹ 12,500] | Helper: "50% of Basic = ₹12,500" |
| DA (Dearness Allowance) | [Input: ₹ 5,000] | |
| Conveyance Allowance | [Input: ₹ 1,600] | |
| Medical Allowance | [Input: ₹ 1,250] | |
| Special Allowance | [Input: ₹ 4,650] | |

Component details per row:
- **Component name:** `font-mono text-sm`. Non-editable for default components. Editable Input for custom components.
- **Amount input:** shadcn Input, `w-36`, right-aligned text, `font-mono tabular-nums`. Prefix: "₹" shown as InputGroup addon or inside the input placeholder. Accepts only numbers. On blur, formats to Indian number format for display.
- **Helper text:** `text-xs text-muted-foreground`. Shown for PF, ESI, and HRA where the amount is typically a percentage of another component. The helper is a calculation aid, NOT an enforced formula. Example: when Basic is ₹25,000, the HRA helper shows "50% of Basic = ₹12,500". The HR person can enter any amount -- the helper is advisory.
- **Remove button:** Only on custom components. HugeIcon `Cancel01Icon`, ghost button, size="icon-sm". Not shown for default components (they can be set to ₹0 but not removed).

**Subtotal row:**
```
| Gross Earnings | ₹50,000 |
```
`font-medium`, right-aligned. Updates in real-time as amounts change. Styled with a top border to visually separate from input rows.

**Tier 2 -- Deductions Section:**

```
Section label: "DEDUCTIONS" (same styling as Earnings)
```

| Component | Amount (₹/month) | |
|---|---|---|
| PF (Provident Fund) | [Input: ₹ 3,000] | Helper: "12% of Basic = ₹3,000" |
| ESI (Employee State Insurance) | [Input: ₹ 375] | Helper: "0.75% of Gross = ₹375" |
| Professional Tax | [Input: ₹ 200] | |
| TDS (Tax Deducted at Source) | [Input: ₹ 2,500] | |

Same row structure as earnings. Helpers for PF and ESI show the standard percentage calculation.

**ESI conditional note:** Below the ESI row, if gross exceeds ₹21,000: "ESI is typically applicable only when gross salary ≤ ₹21,000/month" in `text-xs text-amber-600`. Advisory only -- the HR person decides.

**Subtotal row:**
```
| Total Deductions | ₹6,075 |
```

**Tier 3 -- Summary Strip (bottom of form, above action buttons):**

```
Layout: bg-muted/50 p-4, flex justify-between
```

| Gross Earnings: ₹50,000 | Total Deductions: ₹6,075 | **Net Pay: ₹43,925** |

The net pay is the star: `font-sans text-xl font-bold text-primary`. This number updates in real-time as any amount changes. It is the instant feedback that tells HR "this is what this person will take home."

**Tier 4 -- Add Custom Component:**

Below the deductions section, before the summary:
```
Button: "+ Add Custom Component" (variant="outline", size="sm")
HugeIcon: PlusSignIcon on left
```

Clicking adds a new row at the bottom of either Earnings or Deductions (a Select lets them choose the type). The new row has an editable name Input + amount Input + type Select (earning/deduction) + remove button.

**Form Footer:**
```
shadcn/ui: DialogFooter
Left: "Cancel" (Button, variant="outline")
Right: "Save Salary Configuration" (Button, variant="default")
```

### Component Map

```
shadcn/ui: Dialog, max-w-2xl
Content: ScrollArea wrapping the form (in case of many custom components)
Sections: Earnings table + Deductions table + Summary strip + Add custom button
Footer: Cancel + Save
```

**Responsive behavior:**
- Desktop: Dialog at max-w-2xl. Component name and amount sit side by side with helper text.
- Tablet: Same layout, Dialog may be slightly narrower.
- Mobile: Dialog becomes full-screen Sheet. Component rows stack: name on top, amount input below (full width).

### Micro-Interactions

- **Amount input typing:** As the user types a number, the subtotals and net pay update instantly with each keystroke. No debounce -- the calculation is simple addition/subtraction. Numbers are formatted on blur (adding comma separators) but raw during editing.
- **Helper calculation updates:** When Basic amount changes, the HRA helper ("50% of Basic = ₹X") and PF helper ("12% of Basic = ₹X") recalculate in real-time. This teaches the HR person what the standard amounts should be, without enforcing them.
- **Add custom component:** New row animates in with `animate-in fade-in slide-in-from-bottom-2 duration-200`. The name Input auto-focuses.
- **Remove custom component:** Row animates out with `animate-out fade-out duration-200`. Subtotals update immediately.
- **Save:** Button loading state. On success, Dialog closes. Sonner toast: "Salary configuration saved for [Employee Name]." The employee detail page's salary section updates to show the saved components.
- **First-time setup:** When opening for an employee with no salary configured, all default components are pre-populated with ₹0 amounts. The Dialog subtitle says: "Enter monthly amounts for each component. Default Indian salary structure is shown."

### Delight Opportunities

1. **CTC reverse calculator:** A small helper at the top of the form: "Monthly CTC: ₹50,000 | Annual CTC: ₹6,00,000" that updates as the gross changes. Many HR people think in annual CTC and this saves them a mental multiplication.
2. **"Copy from another employee" option:** A small link in the Dialog header: "Copy salary structure from..." that opens a Select of other employees. Selecting one pre-fills all amounts. Useful when hiring for the same role and CTC band. Saves significant time when onboarding multiple employees.
3. **Change indicator on revisits:** When editing an existing configuration, any field that has been changed shows a subtle left border: `border-l-2 border-l-primary`. The original value appears as a ghost beneath: "Was: ₹22,000" in `text-xs text-muted-foreground`. This makes salary revision auditing trivial.

### Anti-Patterns to Avoid

- Do NOT use percentage inputs for PF/ESI. The spec explicitly stores amounts, not percentages. Show percentage helpers for reference, but the input is always a rupee amount. Mixing percentage and amount inputs in the same form would create confusion.
- Do NOT enforce the helper calculations. The helper says "12% of Basic = ₹3,000" but the HR person can enter ₹2,500. The helper is advisory guidance, not a constraint.
- Do NOT use a stepper/wizard for salary setup. It is a single form with a clear structure. A wizard would over-complicate a fundamentally simple data entry task.
- Do NOT allow negative amounts. Validate on input -- amounts must be >= 0.
- Do NOT allow saving with all zero amounts. If every component is ₹0, show an inline warning: "All amounts are zero. This employee will not appear in payroll runs." Require explicit acknowledgment or actual amounts.

### Mobile Behavior

- Dialog becomes a full-screen Sheet (side="bottom", full height).
- Component rows stack vertically: name label, then amount input (full width), then helper text.
- Summary strip stacks: three values vertically with labels.
- Save button is full-width at the bottom, sticky.

---

## Page 4: Payslip Detail Sheet

### Page Purpose
Show the complete salary breakdown for one employee in one month, formatted like a traditional Indian payslip.

### User Arrives With...
**Mindset:** The HR person clicked "View Detail" on a specific employee in the payroll review table. They want to see the full component-by-component breakdown -- not just the summary numbers from the table. They may be verifying a specific component, checking if an override was applied correctly, or reviewing data before confirming the run.
**Emotion:** Investigative. They are looking at one person's numbers in detail. This is a "zoom in" action from the review table.
**Goal:** Verify the breakdown is correct. Optionally trigger an override. Close the Sheet and continue reviewing other employees.

### The Attention Flow

1. **First 0.5s:** Employee name + month/year at the top of the Sheet. "Whose payslip am I looking at?"
2. **First 2s:** Eyes scan to the bottom -- the Net Pay number. The most important figure.
3. **First 5s:** Scan the two-column layout: Earnings on the left, Deductions on the right. This mirrors the traditional payslip format that HR people have seen a thousand times.
4. **After that:** Verify specific components, check for the "Overridden" indicator, close or trigger override.

### Information Hierarchy

**Container:**
```
shadcn/ui: Sheet (side="right")
Width: min 420px, max 560px (~35% of viewport on desktop)
```

**Section 1: Header (sticky top)**

```
Background: bg-background, border-b, sticky top-0
Padding: p-4
```

- **Employee name** (Geist Sans, text-lg, font-bold)
- **"Payslip for March 2026"** (text-sm text-muted-foreground)
- **Override badge** (if applicable): Badge `bg-amber-50 text-amber-700 border-amber-200` "Overridden"
- **Close button** (Sheet default X button, top-right)

**Section 2: Employee Info**

```
Layout: Simple key-value grid, 2 columns
Padding: p-4
Background: bg-muted/30
```

| Designation | Sales Executive |
| Department | Sales |
| PAN | ABCDE1234F |
| Bank Account | SBI / XXXX1234 |

Styled as:
- Key: `text-xs text-muted-foreground uppercase tracking-wide`
- Value: `text-sm font-mono`

PAN and bank account are masked (last 4 digits shown) for privacy even in the HR view. Full values visible on hover with a tooltip.

**Section 3: Earnings Table**

```
Section label: "EARNINGS" (text-xs text-muted-foreground uppercase tracking-wide)
```

| Component | Amount |
|---|---|
| Basic | ₹25,000 |
| HRA | ₹12,500 |
| DA | ₹5,000 |
| Conveyance | ₹1,600 |
| Medical | ₹1,250 |
| Special Allowance | ₹4,650 |
| **Gross Earnings** | **₹50,000** |

- Component names: `text-sm font-mono`
- Amounts: `text-sm font-mono tabular-nums text-right`
- Gross Earnings row: `font-medium`, top border, slightly larger text
- If a component was overridden, show a small amber dot next to the amount with tooltip: "Original: ₹24,000 -- Overridden to ₹25,000"

**Section 4: Deductions Table**

Same layout as Earnings:

| Component | Amount |
|---|---|
| PF | ₹3,000 |
| ESI | ₹375 |
| Professional Tax | ₹200 |
| TDS | ₹2,500 |
| **Total Deductions** | **₹6,075** |

**Section 5: Net Pay Summary**

```
Layout: Full width, bg-muted/50, p-4, text-center
```

- "NET PAY" (text-xs text-muted-foreground uppercase tracking-wide)
- **₹43,925** (Geist Sans, text-2xl, font-bold, text-primary)
- "(Rupees Forty-Three Thousand Nine Hundred Twenty-Five Only)" (text-xs text-muted-foreground, italic)

The amount-in-words line mirrors the Indian payslip tradition. It adds formality and serves as a built-in verification -- if the number and the words don't match, something is wrong.

**Section 6: Actions (bottom of Sheet)**

```
Layout: Flex row, gap-2, p-4, border-t, sticky bottom-0
```

- **Draft run:** "Override Amounts" button (variant="outline", size="sm") -- triggers the Override Popover flow
- **Confirmed run:** "Download PDF" button (variant="default", size="sm") -- downloads the generated payslip PDF

### Component Map

```
shadcn/ui: Sheet (side="right")
Content: ScrollArea wrapping all sections
Sections stacked vertically with border-b separators
Sticky header (top) + sticky actions (bottom)
```

### Micro-Interactions

- **Sheet open animation:** Standard Sheet slide-in-from-right with `duration-300`. Content inside fades in with `animate-in fade-in duration-200 delay-150` (staggered after the Sheet itself opens).
- **Override indicator:** If any component was overridden, the amber dot next to the amount pulses once on Sheet open to draw attention.
- **Download PDF:** Button loading state while fetching the signed download URL. On success, triggers browser download. Sonner toast: "Downloading payslip for [Employee Name]."
- **Close Sheet:** Standard Sheet close. Returns focus to the review table row that was clicked.

### Delight Opportunities

1. **Month-over-month comparison:** Below the net pay, a small line: "vs. February 2026: ₹43,925 (no change)" or "vs. February 2026: ₹41,200 (+₹2,725 / +6.6%)". This instantly surfaces salary changes without requiring HR to open last month's run.
2. **Print-friendly layout:** A small "Print" icon button in the header. Clicking it opens the browser print dialog with a clean, print-optimized stylesheet that matches the PDF layout. Useful for quick physical copies without generating a formal PDF.

### Anti-Patterns to Avoid

- Do NOT show the full employee profile in this Sheet. This is a PAYSLIP view, not an employee view. Only show the 4 fields relevant to payslips: designation, department, PAN, bank account.
- Do NOT use tabs to split earnings and deductions. They must be visible simultaneously for the scanning pattern to work.
- Do NOT truncate the amount-in-words line. If it wraps to two lines, that is fine. The full words must be visible.
- Do NOT show edit buttons for individual components in this Sheet. The Override Popover is the editing mechanism, and it shows all components at once to prevent partial edits.

### Mobile Behavior

- Sheet becomes full-screen (side="bottom", full height, or side="right" full width).
- Employee info section remains a 2-column grid (keys and values are short enough).
- Earnings and Deductions tables remain as-is -- they are simple two-column layouts that work at any width.
- Net Pay summary is prominent and centered. Actions button is full-width.

---

## Page 5: Override Popover

### Page Purpose
Let HR quickly adjust one or more salary component amounts for a specific employee in a draft payroll run.

### User Arrives With...
**Mindset:** The HR person spotted an amount that needs adjusting on the review table. Maybe the employee had unpaid leave (reduce an earning), or there is a one-time bonus (add to special allowance), or TDS needs manual adjustment. They want to change one or two numbers, see the recalculated net, and save. This should feel like a quick correction, not a major editing operation.
**Emotion:** Decisive. They already know what needs to change. The popover should get out of their way and let them type a number and save.
**Goal:** Change 1-2 amounts, verify the new net pay, save, return to scanning the table.

### The Attention Flow

1. **First 0.5s:** The popover appears anchored to the Override button they clicked. The employee's name is at the top for context.
2. **First 2s:** A compact list of all components with editable amount fields. They locate the component they need to change.
3. **First 5s:** They edit the amount. The recalculated net pay updates at the bottom of the popover.
4. **After that:** Save. Popover closes. Row in the review table updates.

### Information Hierarchy

**Container:**
```
shadcn/ui: Popover
Width: 360px (fixed -- compact but sufficient for component name + amount)
Anchor: The Override button (pencil icon) in the review table's Actions column
```

**Header:**
- **Employee name** (font-medium, text-sm)
- **"Override Amounts"** subtitle (text-xs text-muted-foreground)

**Component List:**

```
Layout: Compact vertical list with ScrollArea if needed (max-height: 360px)
```

Each row:

```
| Basic                    [₹ 25,000] |
| HRA                      [₹ 12,500] |
| DA                        [₹ 5,000] |
| ...                                  |
| ------- separator -------            |
| PF                        [₹ 3,000] |
| ESI                         [₹ 375] |
| ...                                  |
```

Row details:
- Component name: `text-xs font-mono`. Left-aligned.
- Amount input: shadcn Input, `w-28`, right-aligned, `font-mono tabular-nums text-sm`. No ₹ prefix inside the input (saves space) -- the context is clear.
- Earnings and deductions are separated by a subtle border (Separator component).
- A visual separator labeled "EARNINGS" above earnings and "DEDUCTIONS" above deductions, both in `text-[10px] text-muted-foreground uppercase tracking-widest`.

**Recalculated Summary (bottom of popover):**

```
Layout: border-t, pt-2
```

| Gross: ₹50,000 | Deductions: ₹6,075 | **Net: ₹43,925** |

All on one line, `text-xs font-mono`. Net pay in `font-medium`. Updates in real-time as amounts change.

**Changed field indicator:** Any amount that differs from the original auto-calculated value gets a small amber left border on the input: `border-l-2 border-l-amber-400`. This makes it instantly obvious which fields have been modified.

**Footer:**

```
Layout: flex gap-2, pt-2, border-t
```

- "Cancel" (Button, variant="ghost", size="sm") -- closes popover, discards changes
- "Save Override" (Button, variant="default", size="sm") -- saves changes

### Component Map

```
shadcn/ui: Popover (anchored to the Override button in the table row)
Content: Compact form with component list + summary + actions
Width: 360px fixed
```

### Micro-Interactions

- **Popover open:** Standard Popover animation: `animate-in fade-in zoom-in-95 duration-200`. The popover should feel snappy, not heavy.
- **Amount editing:** As the user changes a number, the summary at the bottom recalculates with each keystroke. Changed inputs get the amber left border immediately.
- **Save:** Button loading state (brief). On success:
  - Popover closes with `animate-out fade-out zoom-out-95 duration-150`
  - The table row updates: numbers change, "Overridden" badge appears (or updates)
  - Row briefly highlights with `bg-amber-50` for 1.5 seconds
  - Summary strip at top of page recalculates (total net pay changes)
  - Sonner toast: "Override saved for [Employee Name]"
- **Cancel:** Popover closes. No changes. No toast.
- **Click outside popover:** Same as Cancel -- closes without saving. Standard Popover behavior.
- **Keyboard:** `Tab` moves between amount inputs. `Enter` triggers Save. `Escape` cancels.

### Delight Opportunities

1. **"Reset to calculated" button:** A small "Reset" link (variant="link", text-xs) next to each overridden input that reverts it to the original auto-calculated amount. For when the HR person realizes the override was unnecessary.
2. **Change delta display:** When an amount is changed, show the delta inline: "₹25,000 → ₹27,000 (+₹2,000)" in `text-xs text-amber-600` below the input. Quantifies the impact of each change without mental math.

### Anti-Patterns to Avoid

- Do NOT use a Dialog for overrides. The whole point is that this is a quick, lightweight interaction. A Dialog feels like a commitment. A Popover feels like a quick note.
- Do NOT allow adding or removing components in the override. The override only adjusts AMOUNTS for the existing components. Structural changes belong in the Salary Configuration Form.
- Do NOT require a reason/note for overrides in Phase C. While auditing is nice, adding a required "reason" field adds friction to what should be a 5-second interaction. The activity log already captures who overrode what.
- Do NOT show the Override Popover for confirmed payroll runs. The button should not exist in confirmed state.

### Mobile Behavior

- On mobile (< 768px), the Popover transforms into a bottom Sheet (side="bottom"). Component list scrolls vertically. Save/Cancel buttons are full-width at the bottom.
- Amount inputs become full-width with a ₹ prefix visible (more room on mobile Sheet than in a 360px popover).

---

## Page 6: Self-Service My Payslips (Employee View)

### Page Purpose
Let an employee view and download their own payslip history.

### User Arrives With...
**Mindset:** A salesperson or admin is checking their "My HR" self-service section. They might need a payslip for a bank loan application, a visa application, tax filing, or just personal records. This is an occasional, goal-oriented visit -- not daily.
**Emotion:** Purposeful and possibly slightly anxious (if they need the document for an external requirement with a deadline). They want to find the right month's payslip, download it, and leave.
**Goal:** Find a specific month's payslip and download the PDF. Possibly review their pay history for trends.

### The Attention Flow

1. **First 0.5s:** The section title "My Payslips" with the most recent payslip prominently displayed. The most recent month is almost always what they want.
2. **First 3s:** Scan the list -- months listed chronologically, most recent first. Each row clearly shows the month, the net pay amount, and a download button.
3. **First 5s:** They find the month they need and click "Download."
4. **After that:** If they need older payslips, they scroll or click "View All."

### Information Hierarchy

**Container:** This section lives within the "My HR" self-service page (`/dashboard/hr` for salespeople, `/admin/hr` for admins). It is one section among others (onboarding, letters, insurance, queries). The payslips section should be placed prominently -- it is the most frequently accessed self-service feature.

```
shadcn/ui: Card
Title: "My Payslips" (Geist Sans, text-lg, font-semibold)
Subtitle: showing last 12 months by default
```

**Payslip List:**

```
shadcn/ui: Table (simple, NOT a full DataTable -- this is a personal list, not an admin grid)
```

| Month | Gross Earnings | Deductions | Net Pay | |
|---|---|---|---|---|
| March 2026 | ₹50,000 | ₹6,075 | **₹43,925** | [Download] |
| February 2026 | ₹50,000 | ₹6,075 | **₹43,925** | [Download] |
| January 2026 | ₹48,000 | ₹5,850 | **₹42,150** | [Download] |

Column details:
- **Month:** "March 2026" format. `font-medium`. Clickable -- opens a payslip detail view (simplified version of the HR Payslip Detail Sheet, read-only, no override action).
- **Gross Earnings:** `font-mono tabular-nums text-right text-muted-foreground`. Present for transparency but not the focus.
- **Deductions:** `font-mono tabular-nums text-right text-muted-foreground`. Same treatment.
- **Net Pay:** `font-mono tabular-nums text-right font-medium`. Bold -- this is the number employees care about.
- **Download:** Button (variant="outline", size="sm") with HugeIcon `FileDownloadIcon`. Only shown when PDF exists. If PDF is not yet generated (run confirmed but PDF pending), show a Skeleton button or "Pending..." text.

**Show last 12 months by default.** Below the table, if more months exist:
```
Button: "View All Payslips" (variant="link", size="sm")
```
Clicking expands to show all available months or loads a paginated view.

**Empty state:**
```
Centered in the Card:
HugeIcon: MoneyReceiveSquareIcon (size 48, text-muted-foreground)
"No payslips yet"
"Your payslips will appear here after payroll is processed."
```

### Component Map

```
shadcn/ui: Card, wrapping a simple Table
Within the My HR page layout (alongside other self-service sections)
```

**Responsive behavior:**
- Desktop: Full table with all columns.
- Tablet: Same layout; table fits fine with the amounts.
- Mobile (< 768px): Table simplifies to card list:

Mobile card per payslip:
```
| March 2026                                      |
| Net Pay: ₹43,925                    [Download]  |
```

Gross and Deductions are hidden on mobile. Tapping the month name opens the detail view where full breakdown is visible.

### Micro-Interactions

- **Download click:** Button enters loading state (spinner replaces icon). On success, browser download triggers. Sonner toast: "Payslip downloaded." Button returns to default state.
- **Month click:** Opens a read-only payslip detail Sheet (same layout as HR's Payslip Detail Sheet, but without Override and without employee info section -- they already know who they are). The Sheet shows earnings, deductions, and net pay with the amount-in-words line.
- **New payslip arrival:** When HR confirms a payroll run that includes this employee, a new row appears at the top of the table with `animate-in fade-in slide-in-from-top-2 duration-300`. If the employee happens to be on this page in real-time (unlikely but possible), they see it appear live.
- **PDF becoming available:** If a payslip row exists but PDF is still generating, the "Download" column shows a subtle pulse animation (Skeleton). When the PDF becomes available via Convex real-time subscription, the download button fades in replacing the skeleton.

### Delight Opportunities

1. **Annual summary at the top:** Above the table, a simple stat strip: "2026 YTD: ₹1,30,775 earned across 3 months." Gives the employee a running total for the financial year. Useful for tax planning.
2. **Net pay trend indicator:** Next to each month's net pay, if it differs from the previous month, show a tiny arrow and delta: "↑ ₹1,775" in `text-green-600 text-xs` or "↓ ₹500" in `text-red-600 text-xs`. Employees notice their pay changes and this preempts confused HR queries ("why did my pay change?") because they can click into the detail and see which component changed.
3. **Quick copy for bank verification:** A tiny copy icon next to the net pay amount. Employees often need to report their salary amount for loan applications and copying the exact figure saves them from typing it manually and potentially getting it wrong.

### Anti-Patterns to Avoid

- Do NOT show other employees' payslip data. The query must be scoped to `ctx.auth.userId` on the server side. This is a self-service view -- no cross-employee visibility.
- Do NOT show draft payslips to employees. Only payslips from confirmed runs should be visible. Draft runs are internal HR working states.
- Do NOT require the employee to select a month from a picker. The chronological list IS the interface. Scroll or "View All" handles historical access.
- Do NOT show a preview of the PDF inline. The table provides the numbers; the PDF is for official download. Inline PDF rendering would slow the page and add complexity for no gain.
- Do NOT mix payslip data with other HR sections. The payslips Card is a self-contained unit within the My HR page. Clear Card boundaries prevent information bleeding between sections.

### Mobile Behavior

- Card takes full width. Title stays at top.
- Table converts to card list (month + net pay + download per card).
- Tap month to open full-screen Sheet with complete breakdown.
- Download button is a full-width action at the bottom of each mobile card.
- Annual summary strip wraps to two lines if needed.

---

## Cross-Cutting Payroll UX Patterns

### Pattern: Indian Currency Formatting

Every monetary value across all payroll pages uses `formatINR()` from `lib/currency.ts`:
- Uses `Intl.NumberFormat("en-IN")` with `style: "currency"`, `currency: "INR"`, `maximumFractionDigits: 0`
- Results in lakhs/crores grouping: ₹1,25,000 (not ₹125,000), ₹24,50,000 (not ₹2,450,000)
- All amount columns in tables are right-aligned with `tabular-nums` for digit alignment
- No paise (fractional rupees). All amounts are whole rupees. The `maximumFractionDigits: 0` ensures this.

### Pattern: Amount-in-Words

The payslip detail and PDF both show the net pay amount in words: "(Rupees Forty-Three Thousand Nine Hundred Twenty-Five Only)". This is a legal/cultural requirement in Indian payslips. A utility function converts the number to Indian English words.

### Pattern: Payroll Status Colors

Consistent across every page where payroll run status appears:

| Status | Background | Text | Border | Meaning |
|--------|-----------|------|--------|---------|
| Draft | `bg-yellow-50` | `text-yellow-700` | `border-yellow-200` | Under review, editable |
| Confirmed | `bg-green-50` | `text-green-700` | `border-green-200` | Locked, PDFs generated |

Override indicator:

| Indicator | Background | Text | Border | Meaning |
|-----------|-----------|------|--------|---------|
| Overridden | `bg-amber-50` | `text-amber-700` | `border-amber-200` | Amount manually adjusted |

### Pattern: Payroll Loading States

1. **Run Payroll button clicked:** Button spinner + "Processing..." text. This operation creates payslip records for all employees, so it may take 2-5 seconds. The button stays in loading state until the mutation completes and the router navigates.
2. **Confirm Payroll button clicked:** AlertDialog button spinner + "Confirming..." text. After confirmation, PDF generation is asynchronous -- the page transitions to confirmed state immediately, and download buttons appear per-row as PDFs complete.
3. **PDF generation progress:** On the run detail page after confirmation, a thin progress bar or counter: "Generating payslips: 23/47" appears below the summary strip. Each payslip row's download button transitions from skeleton to active as its PDF finishes.
4. **Payslip download:** Download button spinner for 0.5-1 seconds while fetching the signed URL, then browser download triggers.

### Pattern: Payroll Empty States

- **Payroll management, no runs:** "No payroll runs yet. Select a month above and run your first payroll." + HugeIcon `MoneyReceiveSquareIcon`
- **Payroll run detail, no employees:** "No employees with salary configurations. Configure salaries on the employee detail pages first." + HugeIcon `UserMultipleIcon` + "Go to Employees" link button
- **Self-service, no payslips:** "No payslips yet. Your payslips will appear here after payroll is processed." + HugeIcon `MoneyReceiveSquareIcon`
- **Salary section on employee detail, unconfigured:** "No salary configured. Set up this employee's monthly salary structure." + "Configure Salary" button (variant="default")

### Pattern: Payroll Error States

- **Duplicate run attempt:** Inline yellow alert on the Run Payroll card (never a toast or dialog for validation errors that can be shown in context)
- **Override save failure:** Sonner error toast: "Could not save override. Please try again." + "Retry" button. Popover remains open with values preserved.
- **PDF generation failure:** The payslip row's download column shows a red error icon with tooltip: "PDF generation failed. Click to retry." Clicking triggers a regeneration action.
- **Confirm failure:** AlertDialog shows inline error: "Could not confirm payroll. Please try again." Confirm button re-enables.

### Pattern: Payroll Activity Logging

Every payroll mutation is logged to the `activityLogs` table:
- "Priya H. created draft payroll for March 2026"
- "Priya H. overridden payslip for Rahul Sharma in March 2026 run"
- "Priya H. confirmed payroll for March 2026 (47 payslips)"
- "Priya H. deleted draft payroll for March 2026"

These entries appear in the HR Dashboard activity feed and the full activity log, using the same formatting as Phase 1 activity entries.

---

## Payroll Page Flow Map

```
/hr/payroll (Payroll Management)
  |
  +--[Run Payroll button]--> /hr/payroll/[runId] (Payroll Run Detail -- Draft)
  |                              |
  |                              +--[View Detail action]--> Payslip Detail Sheet (side="right")
  |                              |
  |                              +--[Override action]--> Override Popover (inline)
  |                              |
  |                              +--[Confirm Payroll]--> /hr/payroll/[runId] (same page, now Confirmed)
  |                              |                           |
  |                              |                           +--[Download PDF]--> Browser download
  |                              |                           |
  |                              |                           +--[Download All]--> Batch download
  |                              |
  |                              +--[Delete Run]--> /hr/payroll (redirect back)
  |
  +--[Click history row]-----> /hr/payroll/[runId] (Payroll Run Detail -- view existing)

/hr/employees/[id] (Employee Detail)
  |
  +--[Configure Salary / Edit Salary]--> Salary Configuration Dialog
  |
  +--[Payslips sub-section]--> Payslip History Table (same as self-service but with HR actions)

/dashboard/hr (Salesperson Self-Service)
  |
  +--[My Payslips section]
       |
       +--[Click month]--> Payslip Detail Sheet (read-only)
       |
       +--[Download]--> Browser download
```

---

## Design Tokens Quick Reference (Payroll-Specific)

```css
/* Currency numbers */
Currency amount:     font-mono tabular-nums text-right  /* ₹1,25,000 aligned */
Currency prominent:  font-sans text-2xl font-bold tabular-nums text-primary  /* Net Pay hero number */
Currency in table:   font-mono text-sm tabular-nums text-right  /* Table cells */
Currency muted:      font-mono text-sm tabular-nums text-right text-muted-foreground  /* Secondary amounts */

/* Payroll status badges */
Draft:       bg-yellow-50 text-yellow-700 border-yellow-200
Confirmed:   bg-green-50 text-green-700 border-green-200
Overridden:  bg-amber-50 text-amber-700 border-amber-200

/* Section labels (EARNINGS / DEDUCTIONS) */
Section label:  font-mono text-xs text-muted-foreground uppercase tracking-wide

/* Summary strips */
Summary bg:     bg-muted/50
Summary label:  font-mono text-xs text-muted-foreground uppercase tracking-wide
Summary value:  font-sans text-2xl font-bold tabular-nums

/* Popover dimensions */
Override popover:  w-[360px]
Payslip Sheet:     min-w-[420px] max-w-[560px]
Salary Dialog:     max-w-2xl

/* Animation (payroll-specific moments) */
Row override highlight:   bg-amber-50 duration-1500 (1.5s fade)
PDF ready cascade:        animate-in fade-in duration-300 delay-[row*50ms]
Confirm status transition: transition-colors duration-500
```
