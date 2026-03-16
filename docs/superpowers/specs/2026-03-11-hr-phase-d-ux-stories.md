# HR Phase D -- Insurance, Queries & Suggestions -- UX Stories

## Design System Reference

Same constraints as all SA CRM pages:

- **Theme:** Light only. White background (`oklch(1 0 0)`), near-black foreground (`oklch(0.145 0 0)`)
- **Primary color:** Warm red/orange (`oklch(0.514 0.222 16.935)`) -- used for primary buttons, active states, key accents
- **Border radius:** Zero everywhere. `--radius: 0`. Every card, button, input, badge is a sharp rectangle
- **Body font:** JetBrains Mono (monospace) -- data-dense, spreadsheet-replacement precision feel
- **Heading font:** Geist Sans -- page titles and section headers only
- **Icons:** HugeIcons (`@hugeicons/react` + `@hugeicons/core-free-icons`)
- **Components:** shadcn/ui exclusively. All components use `rounded-none` via the zero radius token
- **Animations:** tw-animate-css. Use `animate-in`, `fade-in`, `slide-in-from-bottom` etc.

### Phase D Aesthetic Note

Phase D adds three features that are fundamentally different from the rest of HR. Payroll is heavy data processing. Onboarding is checklist management. But insurance, queries, and suggestions are **communication channels** -- employees reaching out, HR responding. The UX must reflect this: lighter, more conversational, less spreadsheet-like. Cards over tables where appropriate. Status workflows that feel like progress, not bureaucracy.

---

## Page 1: Insurance Tracker (`/hr/insurance`)

### Page Purpose
Show HR which employees are insured, who needs attention, and when policies expire.

### User Arrives With...
**Mindset:** The HR person is in administrative mode. They are either doing a routine check ("any policies about to expire?"), processing a new enrollment that an employee submitted, or looking up a specific employee's insurance details. Insurance is not a daily task -- it is periodic, often triggered by an expiry alert or a new joiner's enrollment.
**Emotion:** Methodical but alert. Insurance lapses are serious -- an expired policy means an uninsured employee. When the expiry alert section shows red, the HR person needs to feel urgency without panic.
**Goal:** See problems first (expiring policies), then manage the full list. Process enrollments, update tracker fields, upload policy documents.

### The Attention Flow

1. **First 0.5s:** The Expiry Alerts card at the very top -- a colored banner that either reassures ("All policies current") or signals urgency ("3 policies expiring soon"). This is the eye-grabber.
2. **First 3s:** If alerts exist, scan the expiring policies list. If no alerts, eyes drop to the enrollment table and its filter controls.
3. **First 10s:** Either click into an expiring enrollment to handle it, or use the table filters to find what they came looking for.
4. **After that:** Click a row to open the detail Sheet, update tracker fields, upload documents.

### Information Hierarchy

**Tier 1 -- Expiry Alerts Card (top of page, above everything):**

```
shadcn/ui: Card with conditional styling
Layout: Full width, above the table
```

This card has three visual states:

**State A -- Urgent (policies expiring within 7 days):**
```
Background: bg-red-50
Left border: border-l-4 border-red-500
Icon: HugeIcon AlertDiamondIcon (text-red-600)
Title: "X policies expiring within 7 days" (Geist Sans, font-semibold, text-red-800)
```

**State B -- Warning (policies expiring within 30 days, none within 7):**
```
Background: bg-yellow-50
Left border: border-l-4 border-yellow-500
Icon: HugeIcon Alert02Icon (text-yellow-600)
Title: "X policies expiring within 30 days" (Geist Sans, font-semibold, text-yellow-800)
```

**State C -- All clear (no expiring policies):**
```
Background: bg-green-50
Left border: border-l-4 border-green-500
Icon: HugeIcon CheckmarkCircle01Icon (text-green-600)
Title: "All policies current" (Geist Sans, font-semibold, text-green-800)
Subtitle: "No policies expiring in the next 30 days" (text-sm text-green-700)
```

When alerts exist (State A or B), the card is expandable via shadcn Collapsible (default expanded when urgent, collapsed when warning only):

Inside the expansion, a compact list:

```
Each row:
  Employee Name (font-medium) | Policy #  (font-mono text-muted-foreground) | Expiry Date | Days Remaining

Days remaining treatment:
  <= 7 days: text-red-600 font-bold ("3 days")
  <= 14 days: text-red-600 ("12 days")
  <= 30 days: text-yellow-600 ("24 days")

Row is clickable -- opens the enrollment detail Sheet for that employee.
```

**Why alerts as a card, not stat pills?** Because insurance expiry is a time-sensitive operational alert, not a ambient stat. It deserves visual weight. The HR person needs to SEE it, process it, then move to the table below for routine work.

**Tier 2 -- Enrollment Table (main content):**

```
shadcn/ui: DataTable (built on TanStack Table)
```

**Filter bar (above table):**

```
Layout: Horizontal flex bar, gap-2, flex-wrap on mobile
```

Components (left to right):
1. **Search input** (shadcn Input, HugeIcon `Search01Icon` prefix) -- placeholder: "Search employee..." -- `w-64`
2. **Status filter** (shadcn Select) -- "All Statuses" | Pending | Enrolled | Expired | Renewed
3. --- spacer ---
4. **Column visibility toggle** (shadcn DropdownMenu, icon-only button)

**Table columns:**
| Employee Name | Status | Policy Number | Expiry Date | Nominee | Actions |
|---|---|---|---|---|---|
| Name (font-medium) | Badge (colored) | font-mono text-muted-foreground or "--" | Date with urgency coloring | Name (text-sm) | DropdownMenu |

Column details:
- **Employee Name:** Clickable -- opens enrollment detail Sheet
- **Status badge colors:** Uses `INSURANCE_STATUS_STYLES` from constants:
  - Pending: `bg-yellow-50 text-yellow-700 border-yellow-200`
  - Enrolled: `bg-green-50 text-green-700 border-green-200`
  - Expired: `bg-red-50 text-red-700 border-red-200`
  - Renewed: `bg-blue-50 text-blue-700 border-blue-200`
- **Policy Number:** Monospace. If not yet assigned (pending enrollment), show em dash `--` in muted
- **Expiry Date:** Same urgency coloring as the alerts card:
  - `<= 7 days: text-destructive font-medium`
  - `<= 30 days: text-yellow-600`
  - `> 30 days: text-muted-foreground`
  - No expiry set: em dash `--`
- **Nominee:** Truncated to ~20 chars with tooltip for full name + relation
- **Actions dropdown:** View Details, Edit Tracker, Upload Document

**Row interaction:**
- Hover: `bg-muted/50`
- Click anywhere on row: Opens enrollment detail Sheet

**Tier 3 -- Pagination (bottom of table):**

```
shadcn/ui: Pagination
"Showing 1-25 of 48 enrollments" + page controls
Page size: 25 | 50
```

### Component Map

```
Page layout:
  <div class="space-y-6">
    <RenewalAlerts />           <!-- Tier 1: Alert card, full width -->
    <div class="space-y-4">
      <FilterBar />             <!-- Search + Status filter -->
      <EnrollmentDataTable />   <!-- Tier 2: Main table -->
      <Pagination />            <!-- Tier 3: Bottom pagination -->
    </div>
  </div>
```

Components used:
- `components/hr/insurance/renewal-alerts.tsx` -- The alert card with Collapsible expansion
- `components/hr/insurance/enrollment-list.tsx` -- DataTable with filters
- `components/hr/insurance/enrollment-status-badge.tsx` -- Reusable badge

### Micro-Interactions

- **Alert card pulse:** When policies are within 7 days of expiry, the left border has a slow subtle pulse animation (`animate-pulse` with 4s cycle on the border). Not aggressive -- just enough to keep urgency alive.
- **Status badge updates:** When HR updates a tracker status (e.g., pending -> enrolled), the row's badge transitions smoothly. A brief background highlight (`bg-primary/5` for 1.5s) draws attention.
- **Expiry countdown:** The "days remaining" values in the alert list update daily without page refresh (Convex real-time query recomputes on date change).
- **Filter changes:** Instant table update, no "Apply" button. Thin progress bar at top of table area during re-query.
- **Row click to Sheet:** Sheet slides in from right with `animate-in slide-in-from-right duration-200`.

### Delight Opportunities

1. **"All clear" positive state:** When no policies are expiring, the green alert card feels like a small win. It is positive reinforcement -- "you are on top of things."
2. **Auto-sort by urgency:** The table defaults to sorting expiring-soonest first when the status filter is set to "Enrolled." The most urgent policy surfaces without the HR person having to think about sorting.
3. **Tooltip on expiry date:** Hovering over an expiry date shows "Expires [full date] -- [X days from now]" in a tooltip. The monospace rendering of the countdown makes it feel precise and trustworthy.

### Anti-Patterns to Avoid
- Do NOT use a separate "Alerts" page. Alerts belong on the same page as the data they reference -- context matters.
- Do NOT use red for ALL alert states. Reserve true red (bg-red-50) for critical urgency (<=7 days). Yellow for the 8-30 day window. This two-tier urgency prevents alert fatigue.
- Do NOT show enrollments in a card grid. Insurance data is tabular -- policy numbers, dates, statuses. A table is the right structure. Cards are for text-heavy content like suggestions.
- Do NOT auto-refresh/blink the alert card. The slow pulse on the border is enough. Flashing elements are hostile.

### Mobile Behavior

- Alert card: Full width, Collapsible still works. Expansion scrolls naturally.
- Table transforms to stacked cards: Each card shows Employee Name, Status badge, Expiry Date, Policy Number. Tap card opens Sheet (which becomes full-page on mobile).
- Filter bar: Search takes full width, Status filter below it. Stacked vertically.

---

## Page 2: Insurance Enrollment Form

### Page Purpose
Let an employee provide their insurance enrollment information accurately and quickly.

### User Arrives With...
**Mindset:** The employee was either prompted by HR ("please fill out your insurance enrollment") or noticed the enrollment section in their self-service page. They are in form-filling mode. Insurance forms are inherently tedious -- the goal is to make this as painless as possible.
**Emotion:** Mildly reluctant. Nobody enjoys filling out insurance forms. But they know it is important. The form should feel short and achievable, not like a government bureaucracy exercise.
**Goal:** Fill in the required fields, optionally add extra details, submit, and get back to their actual work.

### The Attention Flow

1. **First 0.5s:** The form title and the clear division between "Required" and "Optional." Immediately communicates: "the mandatory part is small."
2. **First 3s:** Scan the required fields -- four fields. That is it. The employee thinks "I can do this in 60 seconds."
3. **First 10s:** Already typing nominee name.
4. **After that:** Optionally expand the additional details section if they want to provide more info.

### Information Hierarchy

**Tier 1 -- Required Fields (always visible, primary visual weight):**

```
shadcn/ui: Card
Title: "Insurance Enrollment" (Geist Sans, text-lg, font-semibold)
Subtitle: "Fill in your nominee details to enroll in the company insurance plan"
```

Field layout (vertical stack, gap-4):

1. **Nominee Name** (Input, required, autofocus)
   - Label: "Nominee Name" with red asterisk
   - Placeholder: "Full legal name of your nominee"

2. **Nominee Relation** (Select, required)
   - Label: "Nominee Relation" with red asterisk
   - Options: Spouse, Parent, Child, Sibling, Other
   - Placeholder: "Select relation"

3. **Nominee Date of Birth** (shadcn DatePicker / Calendar, required)
   - Label: "Nominee Date of Birth" with red asterisk
   - Placeholder: "Select date"

4. **Existing Medical Conditions** (Switch + conditional, required)
   - Label: "Do you have any existing medical conditions?"
   - shadcn Switch, default OFF
   - When toggled ON: a Textarea appears below with `animate-in fade-in slide-in-from-top-1 duration-200`:
     - Label: "Please describe your conditions"
     - Placeholder: "Briefly describe any pre-existing conditions..."
     - This conditionally becomes required when the switch is on

**Why a Switch instead of a Yes/No Select?** The binary toggle is faster to interact with and feels lighter. The conditional expansion when toggled ON is a progressive disclosure pattern -- the textarea only appears when relevant.

**Tier 2 -- Optional Fields (collapsible, secondary visual weight):**

```
shadcn/ui: Collapsible, default collapsed
Trigger: Button variant="ghost" with ChevronDown icon
Label: "Additional Details (Optional)" -- the "(Optional)" is text-muted-foreground
```

Inside the Collapsible:

```
shadcn/ui: Card variant with bg-muted/30 background (visually lighter than the required section)
```

Fields:

1. **Dependents** (repeatable group)
   - "Add Dependent" button (variant="outline", size="sm")
   - Each dependent is a row: Name (Input) | Relation (Select) | DOB (DatePicker) | Remove button (ghost, trash icon)
   - Max 5 dependents. After 5: button disables with tooltip "Maximum 5 dependents"
   - Stored as JSON array

2. **Pre-existing Details** (Textarea)
   - Label: "Additional medical history"
   - Placeholder: "Any surgeries, chronic conditions, ongoing treatments..."
   - text-xs helper: "This helps the insurance provider assess coverage"

3. **Preferred Hospital** (Input)
   - Label: "Preferred Hospital"
   - Placeholder: "Name of your preferred network hospital"

4. **Sum Insured Preference** (Input, type="number")
   - Label: "Preferred Sum Insured (INR)"
   - Placeholder: "e.g., 500000"
   - text-xs helper: "Final sum insured will be determined by the policy"

**Footer:**

```
Layout: flex justify-end gap-2, border-t pt-4 mt-6
```

- "Cancel" (Button, variant="outline") -- returns to self-service page
- "Submit Enrollment" (Button, variant="default")

### Component Map

```
Form layout:
  <Card class="max-w-2xl">
    <CardHeader>
      Title + Subtitle
    </CardHeader>
    <CardContent class="space-y-6">
      <!-- Required Section -->
      <div class="space-y-4">
        <NomineeNameInput />
        <NomineeRelationSelect />
        <NomineeDobPicker />
        <ExistingConditionsToggle />
      </div>

      <!-- Optional Section -->
      <Collapsible>
        <CollapsibleTrigger />
        <CollapsibleContent>
          <div class="space-y-4 bg-muted/30 p-4 border">
            <DependentsRepeater />
            <PreExistingTextarea />
            <PreferredHospitalInput />
            <SumInsuredInput />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </CardContent>
    <CardFooter>
      Cancel | Submit
    </CardFooter>
  </Card>
```

Component file: `components/hr/insurance/enrollment-form.tsx`

### Micro-Interactions

- **Existing conditions toggle:** When the Switch flips ON, the textarea slides in from top with `animate-in fade-in slide-in-from-top-1 duration-200`. When flipped OFF, textarea fades out with `animate-out fade-out duration-150` and any content is preserved (not cleared) in case they toggle back.
- **Dependent add animation:** New dependent row slides in from left with `animate-in slide-in-from-left-2 duration-200`. Remove animates out with `animate-out fade-out slide-out-to-right duration-200`.
- **Submit loading:** Button enters loading state with spinner. On success, the entire Card transitions to a success state (same card, content replaced):
  - HugeIcon: `CheckmarkCircle01Icon` (size 48, text-green-600)
  - "Enrollment submitted successfully"
  - "HR will process your enrollment and update your policy details"
  - Button: "Back to My HR" (variant="outline")
- **Validation:** Inline validation on blur for required fields. Error text appears below the field with `animate-in fade-in duration-150`. Red border on the input.
- **Optional section expand:** The Collapsible trigger chevron rotates 180 degrees with `transition-transform duration-200`.

### Delight Opportunities

1. **Field count indicator:** Above the submit button, a small text: "3 of 4 required fields completed" that updates as the employee fills in fields. Creates a sense of progress on what is ultimately a short form.
2. **Smart date constraint:** The nominee DOB DatePicker disables future dates automatically. No error message needed -- the impossible dates simply are not selectable.
3. **Preserved optional state:** If the employee opens the optional section, fills some fields, then collapses it, the data persists. Collapsing is visual only, not a data wipe. This respects their effort.

### Anti-Patterns to Avoid
- Do NOT show all fields (required + optional) in a flat list. The visual separation between required and optional is critical. Employees will abandon a form that looks 12 fields long. Four required fields is approachable.
- Do NOT use a multi-step wizard for this form. Four required fields do not warrant steps. A wizard would add clicks and time to a simple task.
- Do NOT pre-collapse the required section. It must be visible immediately. Only the optional section is collapsed.
- Do NOT use a Dialog for this form. The enrollment form needs room to breathe, especially with the dependent repeater. A full-page or large Card is appropriate.

### Mobile Behavior

- Form takes full width, max-w-none. Fields stack vertically (they already do).
- Dependent rows stack: Name, Relation, DOB each on their own line within a bordered group.
- DatePicker uses the native mobile date picker where available.
- Submit button is full width on mobile, sticky at the bottom of the viewport for easy thumb reach.

---

## Page 3: Insurance Enrollment Detail Sheet

### Page Purpose
Give HR full context on an employee's insurance enrollment and let them manage the tracker fields inline.

### User Arrives With...
**Mindset:** HR clicked a row in the insurance tracker table or an alert list entry. They need to see the complete enrollment, update policy details, or upload a document. This is operational processing work.
**Emotion:** Focused on this one employee's insurance. They may be entering a policy number from an email, updating an expiry date from a renewal notice, or reviewing enrollment data before contacting the insurance provider.
**Goal:** See enrollment data, update tracker fields (policy number, expiry, status), upload documents. Close the Sheet and move to the next one.

### The Attention Flow

1. **First 0.5s:** Employee name + enrollment status badge in the Sheet header. "Who is this and what is their insurance state?"
2. **First 3s:** Scan the tracker section -- policy number, expiry date. "Is this complete or do I need to fill in details?"
3. **First 5s:** If processing a new enrollment, focus on the tracker edit fields. If reviewing, scroll to enrollment details and documents.
4. **After that:** Upload a document, update status, close Sheet.

### Component Map

**Container:** shadcn Sheet (side="right"), width ~50% of viewport (min 480px, max 640px).

**Layout inside the Sheet:**

```
Vertical stack of sections, separated by borders (border-b border-border)
Sheet has ScrollArea wrapping all content
```

**Section 1: Header (sticky at top of Sheet)**

```
Height: auto, compact
Background: bg-background, border-b, sticky top-0 z-10
```

- **Employee name** (Geist Sans, text-xl, font-bold)
- **Enrollment status badge** (large, using `INSURANCE_STATUS_STYLES`)
- **Enrollment date:** "Enrolled [date]" or "Submitted [date]" (text-sm text-muted-foreground)

**Section 2: Tracker Fields (the primary action area)**

```
shadcn/ui: Card with bg-muted/30 background
Title: "Policy Tracker" (Geist Sans, text-base, font-semibold)
```

This section is the reason HR opens this Sheet. Fields are inline-editable:

- **Policy Number** (Input, placeholder: "Enter policy number")
- **Expiry Date** (DatePicker)
- **Renewal Reminder Date** (DatePicker) -- helper text: "You will see an alert this many days before expiry"
- **Status** (Select: Pending | Enrolled | Expired | Renewed)

Below the fields:
- "Save Changes" (Button, variant="default", size="sm") -- only enabled when dirty
- The button is disabled and muted when no changes have been made. When a field is edited, it becomes active with `transition-opacity duration-200`.

**Section 3: Enrollment Details (read-only display of what the employee submitted)**

```
shadcn/ui: Collapsible, default open
Title: "Enrollment Details"
```

Key-value display (same pattern as Lead Detail "Details" section):

```
Grid: 2 columns on wide Sheet, 1 column on narrow
Each item: Label (text-xs text-muted-foreground uppercase tracking-wide) above Value (font-mono)
```

- Nominee Name: [value]
- Nominee Relation: [value]
- Nominee DOB: [value]
- Existing Conditions: Yes/No (if yes, details shown below)
- Pre-existing Details: [value or "--"]
- Preferred Hospital: [value or "--"]
- Sum Insured Preference: [formatted INR or "--"]

**Dependents sub-section (if any):**

```
Title: "Dependents" + count badge
Simple table or list:
  Name | Relation | DOB
  Name | Relation | DOB
```

If no dependents: "No dependents listed" in text-muted-foreground.

**Section 4: Documents**

```
shadcn/ui: Card
Title: "Documents" + count badge
```

- **Upload button:** Button (variant="outline", size="sm") with HugeIcon `FileUploadIcon` -- triggers file input (accepts .pdf, .jpg, .png)
- **Document list:** Each document is a row:
  ```
  [FileIcon] filename.pdf  |  Uploaded [date]  |  [Download button] [Delete button]
  ```
  - Download: Button variant="ghost" with HugeIcon `Download04Icon`
  - Delete: Button variant="ghost" with HugeIcon `Delete02Icon` -- triggers AlertDialog confirmation
- **Empty state:** "No documents uploaded" + the upload button more prominently placed

**Section 5: Activity Log**

```
shadcn/ui: Collapsible, default collapsed
Title: "Activity Log"
```

- Chronological list of changes to this enrollment
- Each entry: `[Timestamp] [User] [action]` -- e.g., "Mar 10, 2:30 PM  Priya (HR)  Updated policy number"
- Muted styling: text-xs text-muted-foreground

### Micro-Interactions

- **Sheet open:** Slides in from right with spring easing, skeleton content until data loads.
- **Tracker save:** On save, fields briefly flash a green border (`border-green-500` for 1s, then fade back). Sonner toast: "Tracker updated." The enrollment table row behind the Sheet updates its status badge in real-time.
- **Document upload:** On file drop/select, shows inline upload progress bar. File appears in list immediately with a loading shimmer overlay until upload completes. On complete, shimmer resolves to the actual file name.
- **Document delete:** AlertDialog: "Delete [filename]? This cannot be undone." On confirm, row fades out.
- **Status change effect:** When status changes (e.g., pending -> enrolled), the header badge color transitions smoothly. If changing to "enrolled" and no policy number is set, show a gentle inline hint: "Consider adding a policy number" in text-yellow-600 below the status select.

### Delight Opportunities

1. **Completeness indicator:** Next to the "Policy Tracker" title, show a small progress hint: "3 of 4 fields filled" when some tracker fields are still empty. Subtle nudge without being naggy.
2. **Smart renewal date suggestion:** When the expiry date is set and the renewal reminder is not, auto-suggest a date 30 days before expiry in the renewal reminder DatePicker as a grayed-out default. HR can accept or override.

### Anti-Patterns to Avoid
- Do NOT make the tracker fields read-only with a separate "Edit" mode. They should be directly editable in place. An edit-mode toggle adds a click to the most common action on this Sheet.
- Do NOT combine employee enrollment data with HR tracker fields in a single undifferentiated form. The visual separation (enrollment details = read-only display, tracker fields = editable Card) communicates the division of responsibility.
- Do NOT open document previews in a new tab. Use a Dialog with an inline preview for images and a download prompt for PDFs.

### Mobile Behavior

- Sheet becomes full-page on mobile (no room for slide-over).
- Tracker fields stack vertically (already do).
- Enrollment details grid becomes single-column.
- Documents list: each row becomes a card with filename, date, and action buttons stacked.
- Activity log: same vertical list, no layout change needed.

---

## Page 4: HR Query Queue (`/hr/queries`)

### Page Purpose
Process employee requests efficiently, from newest to oldest, with clear status tracking.

### User Arrives With...
**Mindset:** HR is checking their inbox of employee requests. This is like a lightweight ticket system. They might be doing a morning sweep ("what came in overnight?"), following up on in-progress queries, or looking for a specific request type (e.g., all salary certificate requests).
**Emotion:** Service-oriented but also busy. HR has many responsibilities. The query queue should feel manageable, not like a support desk drowning in tickets. Clear counts and filters help them triage.
**Goal:** See open queries, process them (resolve or reject with a note), and keep the queue clean.

### The Attention Flow

1. **First 0.5s:** The stat summary at the top -- "X open, Y in progress." Two numbers that tell the full story of the queue's health.
2. **First 3s:** Eyes drop to the filter bar, then the table. The first few rows of data -- who is asking for what.
3. **First 10s:** Click into the first open query to process it, or apply a filter to focus.
4. **After that:** Work through queries: open Sheet, resolve/reject, close, next.

### Information Hierarchy

**Tier 1 -- Queue Stats (top of page, compact):**

```
Layout: Horizontal flex bar with stat pills (same pattern as Salesperson quick stats bar)
Background: bg-muted, py-3, px-4
```

Three inline stats:
- **Open:** [number] (if > 0, the number is in `text-blue-700 font-bold`)
- **In Progress:** [number] (in `text-yellow-700`)
- **Resolved Today:** [number] (in `text-green-700`)

This is not a set of cards. It is a compact stat bar -- ambient awareness, not a focal point. The HR person does not need to click these. They exist to answer "how much is on my plate?" in half a second.

**Tier 2 -- Filter Bar + Query Table (main content):**

**Filter bar:**

```
Layout: Horizontal flex bar, gap-2, flex-wrap on mobile
```

Components (left to right):
1. **Search input** (Input, HugeIcon `Search01Icon` prefix) -- placeholder: "Search by name or subject..." -- `w-64`
2. **Status filter** (Select) -- "All Statuses" | Open | In Progress | Resolved | Rejected
3. **Type filter** (Select) -- "All Types" | Salary Certificate | Experience Letter | Leave Encashment | Salary Advance | Address Change | Bank Detail Change | Other
4. --- spacer ---
5. **Sort toggle** (Button variant="ghost", icon-only) -- toggle between "Newest first" and "Oldest first"

**Table (shadcn DataTable):**

| Employee | Type | Subject | Status | Created | Actions |
|---|---|---|---|---|---|
| Name | Badge | Text (truncated) | Badge | Relative time | DropdownMenu |

Column details:
- **Employee:** Avatar + Name (font-medium). Clickable -- opens query detail Sheet.
- **Type badge:** Styled with subtle background tints to differentiate categories. Uses shadcn Badge variant="outline":
  - Salary Certificate, Experience Letter: default outline
  - Leave Encashment, Salary Advance: slightly warm-tinted
  - Address Change, Bank Detail Change: slightly blue-tinted
  - Other: gray outline
- **Subject:** Truncated to ~50 chars. Full text in tooltip. `text-sm`
- **Status badge:** Uses `HR_QUERY_STATUS_STYLES`:
  - Open: `bg-blue-50 text-blue-700 border-blue-200`
  - In Progress: `bg-yellow-50 text-yellow-700 border-yellow-200`
  - Resolved: `bg-green-50 text-green-700 border-green-200`
  - Rejected: `bg-red-50 text-red-700 border-red-200`
- **Created:** Relative time ("2h ago", "yesterday") with full date in tooltip. `text-muted-foreground text-xs`
- **Actions:** DropdownMenu with: View Details | Mark In Progress | Resolve | Reject

**Default sort:** Open first, then In Progress, then by created date descending within each group. This prioritization means the "newest unprocessed" queries are always at the top.

**Row interaction:**
- Hover: `bg-muted/50`
- Click anywhere on row: Opens query detail Sheet

**Tier 3 -- Pagination:**

```
shadcn/ui: Pagination
"Showing 1-25 of 89 queries"
```

### Component Map

```
Page layout:
  <div class="space-y-6">
    <QueueStats />              <!-- Tier 1: Stat pills bar -->
    <div class="space-y-4">
      <FilterBar />             <!-- Search + Status + Type filters -->
      <QueryDataTable />        <!-- Tier 2: Main table -->
      <Pagination />
    </div>
  </div>
```

Components:
- `components/hr/queries/query-queue.tsx` -- Full page with table and filters
- `components/hr/queries/query-detail-sheet.tsx` -- Detail Sheet
- `components/hr/queries/query-resolve-popover.tsx` -- Resolution popover

### Micro-Interactions

- **New query arrival:** If an employee submits a query while HR has this page open, the new row slides in at the top with `animate-in fade-in slide-in-from-top-2 duration-300`. The "Open" count in the stat bar increments with a brief color flash.
- **Status change from table actions:** When HR uses the dropdown to change status directly (e.g., Mark In Progress), the badge on the row transitions smoothly. A Sonner toast confirms: "Query marked as In Progress." If the status filter would now exclude this row, it fades out with `animate-out fade-out duration-300`.
- **Filter changes:** Instant re-query, same thin progress bar pattern as other tables.
- **Stat bar highlight:** When a query is resolved from the detail Sheet, the "Resolved Today" count in the stat bar increments. Brief green flash on the number.

### Delight Opportunities

1. **Type distribution tooltip:** Hovering over the stat bar shows a tooltip: "Most common this week: Salary Certificate (4), Address Change (2)." Ambient awareness of what employees are requesting most -- useful for HR to spot patterns.
2. **"New today" indicator:** Next to the "Open" count, if any queries were submitted today, show "(X new today)" in text-xs. Helps the morning sweep -- "3 new since yesterday."
3. **Keyboard shortcut hint:** In the table's empty state or as a subtle footer note: "Press Enter on a selected row to open details." Encourages keyboard-driven workflow.

### Anti-Patterns to Avoid
- Do NOT use a Kanban board for queries. The query lifecycle (open -> in_progress -> resolved) is too simple for Kanban. A sorted table with status badges is cleaner.
- Do NOT show resolved/rejected queries by default if the list is long. Consider defaulting the status filter to "Open + In Progress" with a visible "Show Resolved" toggle. This keeps the queue focused on actionable items.
- Do NOT require HR to open the detail Sheet for simple status changes. The "Mark In Progress" action should be one click from the dropdown menu in the table row.
- Do NOT send query descriptions as push notifications. These are viewed on-demand. Dashboard stat cards handle the awareness layer.

### Empty State

```
Centered in table area:
HugeIcon: CheckmarkCircle01Icon (size 48, text-green-600)
"No open queries"
"All employee requests have been processed."
```

If the filter is active and returns no results:
```
HugeIcon: Search01Icon (size 48, text-muted-foreground)
"No queries match your filters"
Button: "Clear all filters" (variant="outline", size="sm")
```

### Mobile Behavior

- Stat bar: horizontal scroll if needed, or wrap to two lines.
- Table transforms to card list. Each card: Employee name + avatar, Type badge, Subject (full text, no truncation), Status badge, Created date.
- Tap card opens Sheet as full-page.
- Filter bar: Search full width, Status and Type filters below on a second row.

---

## Page 5: Query Submission Form (Employee Self-Service)

### Page Purpose
Let an employee submit an HR request in under 60 seconds.

### User Arrives With...
**Mindset:** The employee needs something from HR -- a salary certificate, an address change, a leave encashment. They know what they want but might not know the process. The form should make the "what" clear and handle the "how" for them.
**Emotion:** Task-oriented, possibly slightly anxious if it is a financial request (salary advance) or slightly annoyed if it is a mundane process (address change). Either way, they want it done quickly.
**Goal:** State their request clearly, submit it, get confirmation that HR will see it, and return to their work.

### The Attention Flow

1. **First 0.5s:** The form title "Submit a Query" and the type selector. "What kind of request is this?"
2. **First 3s:** Select the query type. The form feels structured and guided.
3. **First 10s:** Fill in subject and description. These are short text fields -- not an essay.
4. **After submit:** Confirmation, then the query appears in "My Queries" list below.

### Component Map

The query submission form lives within the employee self-service page as a section. It is triggered by a "Submit Query" button that opens a Dialog.

**Why a Dialog, not inline?** Because the self-service page has three sections (Insurance, Queries, Suggestions). Keeping the form in a Dialog prevents the page from becoming a long scroll of forms. The Dialog focuses attention on the single task of submission.

```
shadcn/ui: Dialog
Title: "Submit a Query" (Geist Sans, font-semibold)
Width: max-w-lg
```

**Fields (vertical stack, gap-4):**

1. **Query Type** (Select, required)
   - Label: "What do you need?"
   - Options from `HR_QUERY_TYPES`: Salary Certificate, Experience Letter, Leave Encashment, Salary Advance, Address Change, Bank Detail Change, Other
   - Placeholder: "Select request type"

2. **Subject** (Input, required)
   - Label: "Subject"
   - Placeholder changes based on selected type:
     - Salary Certificate: "e.g., For visa application"
     - Experience Letter: "e.g., For new employer"
     - Leave Encashment: "e.g., 5 days from March"
     - Salary Advance: "e.g., Personal emergency"
     - Address Change: "e.g., Moved to new address"
     - Bank Detail Change: "e.g., Changed bank account"
     - Other: "Brief summary of your request"

3. **Description** (Textarea, required, 3 rows auto-expand to 6)
   - Label: "Description"
   - Placeholder: "Provide details about your request..."
   - helper text: "Include any relevant details -- dates, amounts, document references" (text-xs text-muted-foreground)

**Footer:**
- "Cancel" (Button, variant="outline")
- "Submit Query" (Button, variant="default")

### Micro-Interactions

- **Type-dependent placeholder:** When the employee selects a query type, the Subject input placeholder updates immediately with a contextual hint. This is a tiny touch that says "we know what this type of request usually looks like" and guides the employee to provide the right information.
- **Submit loading:** Button spinner for 200-300ms. On success: Dialog closes with `animate-out fade-out duration-200`. Sonner toast at bottom-right: "Query submitted. HR will review your request." The "My Queries" table below updates in real-time (new row slides in from top).
- **Validation:** Inline on blur. All three fields are required. If the employee tries to submit with empty fields, the empty fields highlight with red border and error text.

### Delight Opportunities

1. **Expected response time hint:** After selecting a query type, show a subtle text: "Typical response time: 1-2 business days" (or type-specific estimates if available). Sets expectations and reduces anxiety about whether HR saw the request.
2. **Previous submissions awareness:** If the employee has an open query of the same type, show a non-blocking hint above the form: "You have an open [Type] query submitted [date]. Submit another?" This prevents accidental duplicates without blocking.

### Anti-Patterns to Avoid
- Do NOT use a free-text "Type" field. The predefined categories let HR filter and prioritize efficiently. "Other" exists as the escape hatch.
- Do NOT require attachments. Most query types are simple text requests. If attachments are needed, HR can request them during resolution.
- Do NOT show a multi-step wizard. Three fields do not warrant steps.
- Do NOT make the Description optional. Without context, HR cannot process the request. But keep the required minimum short -- even one sentence is enough.

### Mobile Behavior

- Dialog becomes a full-screen Sheet on mobile.
- All fields full width.
- Submit button full width, at the bottom.
- Type selector uses native mobile select behavior.

---

## Page 6: Query Detail Sheet

### Page Purpose
Give HR complete context on a query and provide clear actions to resolve or reject it.

### User Arrives With...
**Mindset:** HR clicked on a query from the queue table. They need to understand what the employee is asking, take action (mark in progress, resolve with a note, or reject with a reason), and move on to the next query.
**Emotion:** Service-mode. They want to help the employee, but efficiently. The Sheet should make it obvious what the request is and what the HR person should do next.
**Goal:** Read the query, take an action (resolve/reject/in-progress), optionally add a note, close the Sheet.

### The Attention Flow

1. **First 0.5s:** Employee name + query type + status badge in the header. Instant context.
2. **First 2s:** The subject and description -- the actual request. "What does this person need?"
3. **First 5s:** The action buttons. "What should I do with this?"
4. **After action:** Resolution note textarea, save, close.

### Component Map

**Container:** shadcn Sheet (side="right"), width ~50% of viewport (min 480px, max 640px).

**Section 1: Header (sticky)**

```
Background: bg-background, border-b, sticky top-0 z-10
```

- **Employee name** (Geist Sans, text-xl, font-bold)
- **Query type badge** (Badge variant="outline")
- **Status badge** (large, using `HR_QUERY_STATUS_STYLES`)
- **Submitted date:** "Submitted [relative time]" (text-sm text-muted-foreground)

**Section 2: Request Content**

```
No Card wrapper -- just clean typography with padding
```

- **Subject:** (font-semibold, text-base)
- **Description:** (text-sm, preserving line breaks, mt-2)

This section is intentionally plain. The request is text -- let the text breathe. No decorative containers around it.

**Section 3: Status Timeline**

```
Layout: Minimal vertical timeline (same pattern as Lead Detail remarks timeline)
Left border: border-l-2 border-muted
```

Timeline nodes (bottom to top, newest at top):
- **Submitted:** `[Date] [Employee name] submitted this query`
- **In Progress (if applicable):** `[Date] [HR name] marked as in progress`
- **Resolved/Rejected (if applicable):** `[Date] [HR name] resolved/rejected with note: "[note]"`

Each node has a dot on the left timeline:
- Submitted: blue dot
- In Progress: yellow dot
- Resolved: green dot
- Rejected: red dot

If the query is still open, the timeline shows only the "Submitted" entry. The absence of further entries is itself information -- "nothing has happened yet."

**Section 4: Action Bar (sticky at bottom of Sheet)**

```
Background: bg-background, border-t, sticky bottom-0 z-10
padding: py-3 px-4
```

The action buttons change based on current status:

**If status = "open":**
- "Mark In Progress" (Button, variant="outline", size="sm") -- one-click, no dialog
- "Resolve" (Button, variant="default", size="sm") -- opens resolution Popover
- "Reject" (Button, variant="destructive", size="sm") -- opens rejection Popover

**If status = "in_progress":**
- "Resolve" (Button, variant="default", size="sm")
- "Reject" (Button, variant="destructive", size="sm")

**If status = "resolved" or "rejected":**
- No action buttons. The status is terminal. Instead, show the resolution/rejection note prominently in the timeline.
- Optionally: "Reopen" (Button, variant="ghost", size="sm") for edge cases.

**Resolution/Rejection Popover:**

```
shadcn/ui: Popover (anchored to the respective button)
Width: 320px
```

Contents:
- **Label:** "Resolution Note" or "Rejection Reason"
- **Textarea** (3 rows, placeholder: "Describe the resolution..." or "Explain why this was rejected...")
- **"Confirm" button** (variant="default" for resolve, variant="destructive" for reject)

**Why Popover and not Dialog?** Because the resolution note is a short text entry -- 1-2 sentences. A Dialog is heavy for this. The Popover anchored to the button maintains spatial context ("I clicked Resolve, and here is where I write why"). This follows the same pattern as Lead quick-update Popovers from Phase 1.

### Micro-Interactions

- **"Mark In Progress" instant action:** One click, no confirmation, no popover. Status badge updates immediately with smooth color transition. Sonner toast: "Query marked as In Progress." Timeline adds a new node with slide-in animation. The action buttons update to remove "Mark In Progress" and keep Resolve/Reject.
- **Resolution save:** Popover closes with fade-out. Status badge transitions to green. New timeline node slides in. Sonner toast: "Query resolved." The query table row (visible behind the dimmed Sheet overlay) updates its status badge in real-time.
- **Rejection save:** Same flow, but red badge and destructive toast styling.
- **Sheet scroll behavior:** Header sticks, action bar sticks at bottom. Middle content (request + timeline) scrolls between them. This guarantees the employee's request and the action buttons are always visible simultaneously.

### Delight Opportunities

1. **Resolution note templates:** Inside the resolution Popover, a small "Templates" link that opens a DropdownMenu with pre-written notes: "Salary certificate generated and shared", "Experience letter attached to your profile", "Leave balance updated", "Bank details updated in system." One click fills the textarea. HR can edit from there.
2. **Employee notification hint:** Below the action buttons, a muted note: "The employee will see this status update in their self-service page." Reassures HR that the employee will be informed without extra effort.

### Anti-Patterns to Avoid
- Do NOT require a note for "Mark In Progress." This is a triage action -- HR is saying "I see this and will handle it." Notes are for resolution/rejection when there is something to communicate back.
- Do NOT show the resolution Popover as a full Dialog. It should feel lightweight and attached to the action.
- Do NOT make the query description scrollable within a fixed-height box. Let it flow naturally. Most descriptions are short. If someone writes a novel, the Sheet scrolls -- that is fine.
- Do NOT put action buttons at the top of the Sheet. They should be at the bottom, after HR has read the request. Top-placed actions encourage blind clicking.

### Mobile Behavior

- Sheet becomes full-page.
- Action bar remains sticky at bottom (natural thumb zone on mobile).
- Resolution Popover becomes a Dialog on mobile (Popovers on touch are unreliable).
- Timeline layout remains the same -- it is already single-column.

---

## Page 7: Suggestion Box Viewer (`/hr/suggestions`)

### Page Purpose
Let HR review employee suggestions in a low-friction, card-based reading experience.

### User Arrives With...
**Mindset:** HR is checking the suggestion box. This is a periodic review, not a daily queue. They might check weekly. The mindset is closer to "reading feedback" than "processing a ticket." The suggestions are conversational, not structured requests.
**Emotion:** Open and curious. Good HR teams genuinely want to hear what employees think. The viewer should feel inviting, not bureaucratic. It should be a pleasant reading experience.
**Goal:** Read suggestions, assess their value, mark them with a status (reviewed, implemented, dismissed), optionally add a note. Fast sweeps -- read, react, next.

### The Attention Flow

1. **First 0.5s:** The card layout itself signals "this is a reading experience, not a data table." Cards of varying content lengths create visual texture.
2. **First 3s:** Scan the first 2-3 cards. Read the beginnings of suggestions. Notice the "Anonymous" labels or employee names.
3. **First 10s:** Click into a suggestion that catches their eye, or start filtering by status/category.
4. **After that:** Review suggestions one by one -- set status, add note, move to next card.

### Information Hierarchy

**Tier 1 -- Filter Bar (top of page, compact):**

```
Layout: Horizontal flex bar, gap-2
```

Components:
1. **Status filter** (Select) -- "All" | New | Reviewed | Implemented | Dismissed
2. **Category filter** (Select) -- "All Categories" | Workplace | Policy | Process | Other
3. --- spacer ---
4. **Sort:** "Newest first" (default, text-sm text-muted-foreground toggle)

**Tier 2 -- Suggestion Cards (main content):**

**Why cards and not a table?** Suggestions are text-heavy. A table would truncate the content, forcing HR to click into every row to read it. Cards show the full text (up to a reasonable limit) directly, enabling a "scan and read" workflow without extra clicks.

```
Layout: Vertical stack of Cards, gap-4, max-w-3xl centered
```

Each suggestion card:

```
shadcn/ui: Card
```

**Card header row:**
```
flex justify-between items-start
```
Left side:
- **Author:** Employee name (font-medium) OR "Anonymous" label
  - Named: just the name, normal text
  - Anonymous: shadcn Badge variant="outline" with muted styling: `bg-gray-100 text-gray-600 border-gray-200` -- text "Anonymous"
- **Category badge** (if set): Badge variant="outline", subtle -- "Workplace", "Policy", etc.

Right side:
- **Status badge** (using `SUGGESTION_STATUS_STYLES`):
  - New: `bg-blue-50 text-blue-700 border-blue-200`
  - Reviewed: `bg-yellow-50 text-yellow-700 border-yellow-200`
  - Implemented: `bg-green-50 text-green-700 border-green-200`
  - Dismissed: `bg-gray-50 text-gray-700 border-gray-200`
- **Date:** (text-xs text-muted-foreground) "3 days ago"

**Card body:**
- **Suggestion content** (text-sm, preserving line breaks, max 6 lines with "Read more" expand)
  - If content exceeds 6 lines, truncate with an ellipsis and a "Read more" button (variant="link", size="xs"). Clicking expands the card inline to show full content.

**Card footer (action area):**

Two modes:

**Collapsed mode (default):**
- A subtle "Review" button (variant="ghost", size="sm") at the bottom-right of the card
- For already-reviewed suggestions: show the review note if one exists, in `text-xs text-muted-foreground italic` with a label "HR Note:"

**Expanded mode (when "Review" is clicked):**
- The card footer expands inline with `animate-in fade-in slide-in-from-bottom-1 duration-200`:
  ```
  Status: [Select: Reviewed | Implemented | Dismissed]
  Note:   [Textarea, 2 rows, placeholder "Add a review note..."]
  [Cancel (ghost)] [Save (default, sm)]
  ```

### Component Map

```
Page layout:
  <div class="max-w-3xl mx-auto space-y-6">
    <FilterBar />               <!-- Status + Category filters -->
    <div class="space-y-4">
      <SuggestionCard />         <!-- Repeated for each suggestion -->
      <SuggestionCard />
      <SuggestionCard />
      ...
    </div>
    <Pagination />              <!-- If > 25 suggestions -->
  </div>
```

Components:
- `components/hr/suggestions/suggestion-list.tsx` -- Card list with filters
- `components/hr/suggestions/suggestion-review-form.tsx` -- Inline review form

### Micro-Interactions

- **Card review expansion:** When "Review" is clicked, the footer area slides in from bottom with `animate-in slide-in-from-bottom-1 duration-200`. The card border subtly shifts to `border-primary/30` to indicate "this card is being acted upon." Other cards remain normal.
- **Save review:** On save, the inline form collapses with `animate-out fade-out duration-150`. The status badge on the card updates smoothly. If a note was added, it appears below the content in italic. Sonner toast: "Suggestion reviewed."
- **New suggestion arrival:** If an employee submits a suggestion while HR is viewing, the new card slides in at the top with `animate-in fade-in slide-in-from-top-2 duration-300`.
- **"Read more" expansion:** Content expands with `animate-in fade-in duration-200`. The button text changes to "Show less."
- **Anonymous badge differentiation:** Anonymous cards have a very subtle left border treatment -- `border-l-2 border-gray-300` -- to visually group them as a type without being judgmental about it.

### Delight Opportunities

1. **Suggestion count header:** At the top of the page, above the filter bar: "X suggestions this month" (Geist Sans, text-lg). Signals that the suggestion box is active and valued. If count is zero: "No new suggestions this month. The box is always open."
2. **Implemented highlight:** Suggestions with "Implemented" status get a subtle green left border (`border-l-2 border-green-500`). This creates a visual pattern -- HR (and any viewers) can see at a glance how many suggestions led to action. It is positive reinforcement for the system.
3. **Batch mode hint:** If there are 5+ unreviewed suggestions, show a muted hint below the filter bar: "Tip: Review in one sitting -- set aside 5 minutes to read through new suggestions." This reframes the task from "chore" to "focused reading time."

### Anti-Patterns to Avoid
- Do NOT use a table for suggestions. Text-heavy content in table cells looks terrible and forces truncation.
- Do NOT open suggestions in a Sheet or Dialog. The card IS the reading surface. Inline expansion keeps the flow -- read card, review, move to next card. No navigation breaks.
- Do NOT show a modal confirmation for "Dismiss." Dismissing a suggestion is a low-stakes action. The inline review form with a note field is enough accountability.
- Do NOT show the submitter's name for anonymous suggestions anywhere in the UI. Even HR admins should not see it. The `listAll` query strips it server-side.
- Do NOT sort alphabetically or by any field other than date. Newest first ensures recent suggestions get attention.

### Empty State

```
Centered in the card area:
HugeIcon: Idea01Icon (size 48, text-muted-foreground)
"No suggestions yet"
"When employees submit suggestions, they will appear here."
```

### Mobile Behavior

- Cards: Full width, same layout. Content naturally flows vertically.
- Filter bar: Status and Category selectors full width, stacked vertically.
- Inline review form: Takes full card width. Textarea is comfortable on mobile.
- "Read more" expansion: Same behavior, touch-friendly.

---

## Page 8: Suggestion Submission Form (Employee Self-Service)

### Page Purpose
Let an employee share a suggestion -- anonymously or named -- with zero friction.

### User Arrives With...
**Mindset:** The employee has something to say. Maybe a process improvement idea, a workplace concern, or a policy suggestion. They want to feel heard. The anonymous option is critical -- some things are hard to say with your name attached. This is a trust moment.
**Emotion:** This ranges widely. They might be enthusiastic ("I have a great idea!"), frustrated ("this process is broken"), or cautious ("I want to say something but I am not sure it is safe to"). The form must accommodate ALL of these emotional states by being simple, private, and non-judgmental.
**Goal:** Write their suggestion, choose whether to attach their name, submit, and feel confident it will be read.

### The Attention Flow

1. **First 0.5s:** The form title "Submit a Suggestion" and -- critically -- the anonymous toggle. The toggle must be visible immediately because it determines the employee's comfort level for the rest of the interaction.
2. **First 3s:** Read the anonymous toggle label and helper text. Decide: named or anonymous? This decision comes BEFORE writing, because the level of candor may depend on anonymity.
3. **First 10s:** Write the suggestion content. Optionally select a category.
4. **After submit:** Confirmation message that specifically acknowledges the anonymity choice.

### Component Map

Like the query form, this lives in the self-service page and opens as a Dialog.

```
shadcn/ui: Dialog
Title: "Submit a Suggestion" (Geist Sans, font-semibold)
Width: max-w-lg
```

**Field 1: Anonymous Toggle (FIRST field, top of form)**

```
Layout: flex items-center justify-between, py-3, border-b border-border mb-4
```

Left side:
- **Label:** "Submit anonymously" (font-medium)
- **Helper text below label:** (text-xs text-muted-foreground)
  - When OFF: "Your name will be visible to HR"
  - When ON: "Your identity will be hidden from HR"

Right side:
- **Switch** (shadcn Switch)

**Why the toggle is FIRST and separated by a border:** This is the most important decision on the form. It determines the employee's psychological safety for everything they write below. Placing it first, with clear helper text, and visually separating it from the content fields signals: "decide this before you start writing." It also prevents the scenario where someone writes a candid message, then realizes they forgot to toggle anonymous, and has to scroll back up.

**Visual feedback on toggle change:**
- When toggled ON (anonymous): The entire form area below the toggle gains a subtle `bg-muted/20` background tint. A small lock icon (HugeIcon `LockIcon`) appears next to the label. The helper text transitions to "Your identity will be hidden from HR" with a brief green flash. This is a **trust signal** -- the visual change confirms the system heard the choice.
- When toggled OFF: Background returns to normal. Lock icon disappears.

**Field 2: Category (optional)**

```
shadcn/ui: Select
Label: "Category (optional)"
Options: Workplace | Policy | Process | Other
Placeholder: "Select a category"
```

**Field 3: Content (required)**

```
shadcn/ui: Textarea
Rows: 4, auto-expand to 8
Label: "Your Suggestion"
Placeholder: "Share your idea, feedback, or suggestion..."
helper: "Be as specific as you can -- what is the problem and what would make it better?" (text-xs text-muted-foreground)
```

**Footer:**
- "Cancel" (Button, variant="outline")
- "Submit Suggestion" (Button, variant="default")

### Micro-Interactions

- **Anonymous toggle animation:** The background tint transition uses `transition-colors duration-300`. The lock icon fades in with `animate-in fade-in duration-200`. The helper text swap uses `animate-in fade-in duration-150`.
- **Submit loading:** Button spinner. On success, Dialog content transitions to a confirmation state:
  - **If anonymous:** HugeIcon `LockIcon` (size 48, text-green-600) + "Suggestion submitted anonymously" + "Your identity is not visible to HR. Thank you for your feedback." + "Close" button
  - **If named:** HugeIcon `CheckmarkCircle01Icon` (size 48, text-green-600) + "Suggestion submitted" + "HR will review your suggestion. Thank you." + "Close" button
- **Character count:** Below the textarea, show a character count in text-xs text-muted-foreground. Not a limit -- just awareness. "0 / 2000 characters"

### The Anonymous Toggle -- Deep UX Consideration

This toggle is the single most trust-critical interaction in the entire HR module. It deserves special attention:

1. **Default state: OFF (named).** Why? Because defaulting to anonymous could feel like the system is suggesting you SHOULD hide. Defaulting to named says "this is a safe place" while the toggle says "but we respect if you prefer privacy."

2. **The helper text is not decoration.** "Your identity will be hidden from HR" is a promise. The wording must be precise and absolute. Not "may be hidden" or "will be kept confidential" -- hidden. Period.

3. **No "Are you sure?" on toggle.** The toggle is freely switchable. Asking "are you sure you want to be anonymous?" would be patronizing and might discourage the choice.

4. **Visual confidence:** The background tint change and lock icon are not just polish. They are a psychological contract. The employee needs to SEE that the system acknowledged their choice before they start typing sensitive content. Without visual feedback, they might doubt whether the toggle actually registered.

5. **Post-submission acknowledgment matches the choice.** If they chose anonymous, the confirmation explicitly says "anonymously." This closes the trust loop.

### Delight Opportunities

1. **The lock icon moment.** When the anonymous toggle flips ON and the lock icon appears with a subtle fade-in, that tiny moment communicates more about organizational trust than any policy document ever could.
2. **Encouraging placeholder text.** The textarea placeholder "Share your idea, feedback, or suggestion..." uses three words deliberately -- "idea" (positive, forward-looking), "feedback" (neutral, evaluative), "suggestion" (constructive, solution-oriented). This sets the tone without being preachy.
3. **Named submission personal touch:** For named suggestions, the confirmation could show "Your suggestion has been added to the box. HR reviews suggestions weekly." This sets expectations and makes the employee feel part of a process, not shouting into a void.

### Anti-Patterns to Avoid
- Do NOT put the anonymous toggle at the bottom of the form. It must be the FIRST decision, before any content is written.
- Do NOT use a checkbox instead of a Switch. The Switch has a clear on/off state that is more readable than a checkbox for a binary choice this important.
- Do NOT make the category required. Some suggestions do not fit neatly into categories, and forcing a choice adds friction to what should be a low-barrier action.
- Do NOT show a warning or confirmation when toggling anonymous. Friction on the anonymity toggle signals distrust.
- Do NOT remember the anonymous toggle state from last time. Every new suggestion starts with the toggle OFF, because each submission is a fresh decision.

### Mobile Behavior

- Dialog becomes full-screen Sheet.
- Anonymous toggle: full width, switch stays right-aligned. Helper text wraps naturally.
- Textarea: full width, comfortable for typing.
- Submit button: full width.

---

## Page 9: Employee Self-Service -- Insurance, Queries, Suggestions Sections

### Page Purpose
Give employees a unified place to manage their insurance enrollment, submit HR requests, and share suggestions.

### User Arrives With...
**Mindset:** The employee navigated to "My HR" from the sidebar. This is their self-service hub. They might be here for any of the three Phase D features, or they might be checking on existing submissions. The page must make it clear what they can DO here without overwhelming them.
**Emotion:** Varies by task. Insurance enrollment feels like an obligation ("I should do this"). Query submission feels like a need ("I need something from HR"). Suggestion submission feels optional ("I have something to say"). The page must serve all three emotional states.
**Goal:** Find the right section, take their action (enroll, submit, check status), and return to their main work.

### The Attention Flow

Phase D adds three new sections to the existing self-service page. Phase A established the skeleton with the onboarding banner. These sections appear below onboarding, in tab-based navigation.

1. **First 0.5s:** The tab bar with section labels. "Where is the thing I came for?"
2. **First 3s:** Click the relevant tab. The content below updates.
3. **First 10s:** Take the primary action for that section (enroll, submit query, submit suggestion) or review existing items.

### Information Hierarchy

The self-service page uses shadcn Tabs to organize sections. Phase D adds three tabs to whatever Phase A established:

```
shadcn/ui: Tabs
Tab labels: [Onboarding] | [Payslips] | [Letters] | Insurance | Queries | Suggestions
```

The Phase D tabs are: **Insurance**, **Queries**, **Suggestions**. Each tab's content panel follows the same structural pattern: a primary action area + a history/status area below.

---

### Tab: Insurance

**Primary action area:**

Two states:

**State A -- Not enrolled:**

```
shadcn/ui: Card
```

- HugeIcon `HeartCheckIcon` (size 32, text-muted-foreground)
- **Title:** "Insurance Enrollment" (Geist Sans, font-semibold)
- **Subtitle:** "Enroll in the company insurance plan by providing your nominee details"
- **Button:** "Enroll Now" (variant="default") -- opens the Enrollment Form (Page 2 above) as a Dialog or navigates to a form view

**State B -- Already enrolled:**

```
shadcn/ui: Card
```

- **Header row:** "Insurance" (Geist Sans, font-semibold) + Status badge (Pending/Enrolled/Renewed)
- **Details grid (read-only, 2-column):**
  - Nominee: [name] ([relation])
  - Nominee DOB: [date]
  - Policy Number: [number or "Pending"]
  - Expiry Date: [date or "Pending"]
  - Existing Conditions: Yes/No
- **If enrolled with policy number and expiry:** Show expiry date with the same urgency coloring as HR view (red if <=7 days, yellow if <=30)
- **Documents section (if any):** Simple list of downloadable files with HugeIcon `Download04Icon`
- **"Update Enrollment" button** (variant="outline", size="sm") -- opens the enrollment form pre-filled for editing (only allowed while status is "pending")

**Empty state visual:** The "Not enrolled" Card should feel inviting, not pressuring. The heart-check icon and calm language ("enroll in the company insurance plan") keeps it approachable. No red warnings or urgency -- this is not the HR alert view.

---

### Tab: Queries

**Primary action area:**

```
Layout: Card header with button
```

- **Title:** "HR Queries" (Geist Sans, font-semibold)
- **Button (top-right of card header):** "Submit Query" (variant="default", size="sm") -- opens the Query Submission Form (Page 5 above) as a Dialog

**Below: "My Queries" table**

```
shadcn/ui: DataTable (lightweight)
Columns: Type (badge) | Subject | Status (badge) | Submitted | Resolution
```

Column details:
- **Type:** Badge variant="outline"
- **Subject:** Truncated, tooltip for full text
- **Status:** Colored badge from `HR_QUERY_STATUS_STYLES`
- **Submitted:** Relative time
- **Resolution:** If resolved/rejected: the resolution note text (text-xs text-muted-foreground, italic). If open/in_progress: em dash

**Row click behavior:** Opens a read-only detail view (not the HR action Sheet). The employee sees:
- Full query details (type, subject, description)
- Status timeline (same visual as HR view, but without action buttons)
- Resolution note (if resolved/rejected)

This uses a Sheet (side="right") or a Dialog, read-only.

**Sort:** Newest first.

**Empty state:**
```
HugeIcon: MessageQuestion01Icon (size 48, text-muted-foreground)
"No queries submitted"
"Need a salary certificate, address change, or anything else? Submit a query above."
Button: "Submit Your First Query" (variant="outline", size="sm")
```

---

### Tab: Suggestions

**Primary action area:**

```
Layout: Card header with button
```

- **Title:** "Suggestions" (Geist Sans, font-semibold)
- **Button (top-right of card header):** "Submit Suggestion" (variant="default", size="sm") -- opens the Suggestion Submission Form (Page 8 above) as a Dialog

**Below: "My Suggestions" list**

Important: This list shows ONLY the employee's named suggestions. Anonymous suggestions do not appear here -- the employee submitted them into the void intentionally, and showing them would undermine the anonymity contract. The system should not even hint at their existence.

```
shadcn/ui: Simple Card list (not a table -- suggestions are text content, not structured data)
```

Each suggestion card (compact):
- Content preview (first 2 lines, truncated)
- Category badge (if set)
- Status badge
- Submitted date
- If reviewed: HR's review note (text-xs italic text-muted-foreground)

**Sort:** Newest first.

**Empty state:**
```
HugeIcon: Idea01Icon (size 48, text-muted-foreground)
"No suggestions submitted"
"Have an idea to improve the workplace? Share it above -- anonymously if you prefer."
```

The empty state explicitly mentions anonymity. This is deliberate -- it signals that the option exists before the employee even opens the form. It normalizes the choice.

### Component Map (Full Self-Service Phase D)

```
self-service page (within existing tab container):

  <TabsContent value="insurance">
    <InsuranceEnrollmentSection />     <!-- State A (not enrolled) or State B (enrolled) -->
  </TabsContent>

  <TabsContent value="queries">
    <Card>
      <CardHeader>
        "HR Queries" + "Submit Query" button
      </CardHeader>
      <CardContent>
        <QueryHistoryTable />           <!-- My queries table -->
      </CardContent>
    </Card>
  </TabsContent>

  <TabsContent value="suggestions">
    <Card>
      <CardHeader>
        "Suggestions" + "Submit Suggestion" button
      </CardHeader>
      <CardContent>
        <MySuggestionsList />           <!-- Named suggestions only -->
      </CardContent>
    </Card>
  </TabsContent>
```

Components:
- `components/hr/insurance/enrollment-form.tsx` (shared with HR)
- `components/hr/queries/query-submit-form.tsx`
- `components/hr/queries/query-history.tsx`
- `components/hr/suggestions/suggestion-submit-form.tsx`
- `components/hr/suggestions/my-suggestions.tsx`

### Micro-Interactions

- **Tab switch:** Content fades in with `animate-in fade-in duration-150`. No sliding -- tabs are spatial peers, not a sequence.
- **Submit actions:** Dialog opens with `animate-in fade-in zoom-in-95 duration-200`. On success, Dialog closes and the list below updates in real-time (new item slides in from top).
- **Insurance status update:** If HR updates the employee's insurance tracker (e.g., adds a policy number), the insurance tab content updates in real-time via Convex subscription. A brief highlight animation on the changed field.
- **Query status update:** If HR resolves a query while the employee is viewing the page, the status badge on the relevant row transitions smoothly and the resolution note appears with a fade-in. A Sonner toast: "Your [Type] query has been resolved."

### Delight Opportunities

1. **Unified "My HR" feel:** All three sections use the same Card + button + list pattern. This consistency makes the self-service page feel like a cohesive tool, not three disconnected features bolted together. The tabs provide structure; the repeated visual pattern provides familiarity.
2. **Status progress awareness:** In the Queries table, a resolved query's row has a subtle green left border. An open query has a blue left border. At a glance, the employee can see what is resolved and what is pending. Same urgency-via-color-border pattern as the salesperson follow-up cards.
3. **Insurance enrollment progress:** If the employee is partially through enrollment (started but did not submit), the Insurance tab could show a draft indicator: "You have an unfinished enrollment. Pick up where you left off." This requires local storage or a draft mechanism, but the UX benefit is significant -- it prevents lost effort.
4. **Suggestion anonymity reminder:** Below the "My Suggestions" list, a small muted note: "Anonymous suggestions are not shown here for your privacy." This explains the absence without making it confusing. The employee understands: "my anonymous ones are safe and invisible, even to me."

### Anti-Patterns to Avoid
- Do NOT use a separate page per section. Insurance, Queries, and Suggestions are lightweight enough to coexist under tabs. Separate pages would fragment the experience and add navigation overhead.
- Do NOT show anonymous suggestions in the "My Suggestions" list. This is the MOST important privacy contract in Phase D. If an employee sees their anonymous suggestion listed, they will never trust the anonymity toggle again.
- Do NOT auto-open the enrollment form if the employee is not enrolled. Show the enrollment Card with a clear button. Let the employee decide when they are ready. Forcing a form is hostile.
- Do NOT show HR action buttons (Resolve, Reject, Mark In Progress) to employees. The employee view of queries is read-only. They see status changes but cannot act on them.
- Do NOT mix suggestion categories and query types in the same UI. These are different concepts -- queries are structured requests, suggestions are freeform feedback. They share a section of the page but have different interfaces (table vs. card list).

### Mobile Behavior

- Tabs: Horizontal scrollable tab bar if tabs overflow. Active tab has bottom border in primary color.
- Insurance Card: Full width, details grid becomes single-column.
- Query table: Transforms to card list (Type badge, Subject, Status badge, Date per card).
- Suggestion list: Already card-based, no change needed.
- Submit buttons: All Dialog triggers work as full-screen Sheets on mobile.

---

## Cross-Cutting Patterns for Phase D

### Pattern: Status Workflow Consistency

All three Phase D features have status workflows. The visual and interaction treatment must be consistent:

| Feature | Statuses | Badge Style Source |
|---|---|---|
| Insurance | pending, enrolled, expired, renewed | `INSURANCE_STATUS_STYLES` |
| Queries | open, in_progress, resolved, rejected | `HR_QUERY_STATUS_STYLES` |
| Suggestions | new, reviewed, implemented, dismissed | `SUGGESTION_STATUS_STYLES` |

All use the same Badge component with the same dimensional treatment (variant with bg/text/border classes). The color semantics are consistent:
- **Blue:** Initial/new state (open, new, pending)
- **Yellow:** In-progress/transitional (in_progress, reviewed, pending)
- **Green:** Positive terminal state (resolved, enrolled, implemented, renewed)
- **Red/Gray:** Negative or neutral terminal state (rejected, expired, dismissed)

### Pattern: HR Action vs. Employee View

Every entity in Phase D has two views:
1. **HR view:** Full data + action buttons + tracker fields + activity log
2. **Employee view:** Read-only data + status + resolution/review notes

The component architecture should reflect this. The data display components can be shared, but the action areas are conditionally rendered based on the viewer's role. Do NOT build two completely separate component trees -- build one with role-aware sections.

### Pattern: Real-Time Updates

Phase D adds three new real-time subscription channels:
1. **Insurance enrollments:** HR sees new enrollments appear, employees see tracker updates
2. **Query status changes:** Both HR and employees see status transitions live
3. **New suggestions:** HR sees new cards appear in the viewer

Apply the same animation conventions from Phase 1:
- New items: `animate-in fade-in slide-in-from-top-2 duration-300`
- Status changes: Smooth badge color transition + brief row/card highlight
- Removed items (filtered out): `animate-out fade-out duration-300`
- Connection issues: Same yellow reconnection banner

### Pattern: Toast Messages for Phase D

| Action | Toast Text | Duration |
|---|---|---|
| Insurance enrollment submitted | "Insurance enrollment submitted" | 4s |
| Tracker updated (HR) | "Insurance tracker updated" | 4s |
| Document uploaded | "Document uploaded successfully" | 4s |
| Document deleted | "Document deleted" | 4s |
| Query submitted | "Query submitted. HR will review your request." | 4s |
| Query status changed (HR) | "Query marked as [status]" | 4s |
| Query resolved (employee view) | "Your [type] query has been resolved" | 6s |
| Suggestion submitted (named) | "Suggestion submitted" | 4s |
| Suggestion submitted (anonymous) | "Suggestion submitted anonymously" | 4s |
| Suggestion reviewed (HR) | "Suggestion reviewed" | 4s |

### Pattern: Empty States

Every list/table in Phase D must have a thoughtful empty state:

| Context | Icon | Message | Action |
|---|---|---|---|
| Insurance tracker (no enrollments) | `HeartCheckIcon` | "No insurance enrollments yet. Employees can enroll from their self-service page." | -- |
| Insurance alerts (all clear) | `CheckmarkCircle01Icon` | "All policies current" | -- |
| Query queue (empty) | `CheckmarkCircle01Icon` | "No open queries. All employee requests have been processed." | -- |
| Query queue (filtered, no results) | `Search01Icon` | "No queries match your filters" | "Clear all filters" button |
| Suggestion viewer (empty) | `Idea01Icon` | "No suggestions yet. When employees submit suggestions, they will appear here." | -- |
| My Queries (employee, empty) | `MessageQuestion01Icon` | "No queries submitted. Need something from HR? Submit a query above." | "Submit Your First Query" button |
| My Suggestions (employee, empty) | `Idea01Icon` | "No suggestions submitted. Have an idea? Share it above -- anonymously if you prefer." | -- |
| Insurance (employee, not enrolled) | `HeartCheckIcon` | "Enroll in the company insurance plan by providing your nominee details." | "Enroll Now" button |

### Pattern: Loading States

Follow the Phase 1 loading conventions exactly:
- **Initial page load:** Skeleton screens matching actual layout
  - Insurance tracker: Skeleton alert card + 5 skeleton table rows
  - Query queue: Skeleton stat pills + 5 skeleton table rows
  - Suggestion viewer: 3 skeleton cards (varying heights to match text content)
  - Self-service tabs: Skeleton card per section
- **Mutation loading:** Button spinner + disabled state
- **Filter/search loading:** Thin progress bar at top of data area
- **Sheet loading:** Skeleton content inside Sheet, parent page dimmed

### Pattern: Keyboard Shortcuts

Phase D does not introduce new global shortcuts, but within its pages:
- `Escape` closes any open Sheet/Dialog
- `Cmd+Enter` submits any open form (enrollment, query, suggestion)
- `Enter` on a focused table row opens the detail Sheet
- Within the suggestion viewer, `j`/`k` to navigate between cards (nice-to-have)

### HR Dashboard Stat Card Integration

Phase D completes the HR dashboard's 4-card stat row (Phase A started with 2):

```
Position 3: "Open Queries"
  Number: count of open queries
  Sub-stat: "X new today" in primary color if > 0
  Click: navigates to /hr/queries filtered to "open"

Position 4: "Upcoming Renewals"
  Number: count of insurance policies expiring in 30 days
  Sub-stat: "X within 7 days" in text-destructive if > 0
  Click: navigates to /hr/insurance (alerts section scrolls into view)
```

Both stat cards follow the same visual treatment as Phases A-C cards:
```
shadcn/ui: Card
Label: text-xs text-muted-foreground uppercase tracking-wide
Number: Geist Sans, text-3xl font-bold tabular-nums
Sub-stat: text-xs inline, color-coded
```

The "Upcoming Renewals" card uses destructive color for the "within 7 days" sub-stat because insurance lapses have real consequences. This is appropriate urgency.

Below the stat cards, Phase D adds a "Recent Queries" preview section (same pattern as the existing "Recent Activity" preview from Phase 1):

```
shadcn/ui: Card
Title: "Recent Queries"
```

- Shows the 5 most recent open queries: Employee name, Type badge, Subject (truncated), time ago
- Each row is clickable -- navigates to /hr/queries with that query's Sheet open
- "View All" link at bottom -> /hr/queries
