# HR Phase A -- Foundation & Onboarding -- UX Stories

## Design System Reference

Same constraints as Phase 1 UX stories. Every page in the HR module honors these rules:

- **Theme:** Light only. White background (`oklch(1 0 0)`), near-black foreground (`oklch(0.145 0 0)`)
- **Primary color:** Warm red/orange (`oklch(0.514 0.222 16.935)`) -- used for primary buttons, active states, key accents
- **Border radius:** Zero everywhere. `--radius: 0`. Every card, button, input, badge is a sharp rectangle
- **Body font:** JetBrains Mono (monospace) -- the CRM's signature. HR data (employee IDs, PAN numbers, Aadhar numbers, dates of joining) benefits enormously from monospace: numbers align, data looks precise, the spreadsheet-replacement feel extends naturally into HR
- **Heading font:** Geist Sans -- page titles and section headers
- **Icons:** HugeIcons (`@hugeicons/react` + `@hugeicons/core-free-icons`)
- **Components:** shadcn/ui exclusively. All components use `rounded-none` via the zero radius token
- **Animations:** tw-animate-css. Use `animate-in`, `fade-in`, `slide-in-from-bottom` etc. for micro-interactions

### HR Module Aesthetic Identity

The HR module is an extension of the same "precision instrument" philosophy from the sales CRM. HR data is inherently sensitive and structured -- PAN numbers, bank account details, salary figures. The monospace font makes all of this feel handled with care and exactness. The zero-radius architecture communicates: this system is rigid about protecting your information, not sloppy.

Where the sales CRM is optimized for speed (call, update, next), the HR module is optimized for completeness (fill every field, check every box, miss nothing). The UX must convey thoroughness without feeling like a chore.

### HR-Specific Color Palette (Badges & Status)

Onboarding statuses:
- Pending: `bg-yellow-50 text-yellow-700 border-yellow-200`
- In Progress: `bg-blue-50 text-blue-700 border-blue-200`
- Completed: `bg-green-50 text-green-700 border-green-200`

HR role badge:
- `bg-teal-50 text-teal-700 border-teal-200`

Department badges (use outline variant, neutral tones -- departments are labels, not status indicators):
- All departments: `variant="outline"` with default border

---

## Navigation Updates

### HR Role Sidebar

The HR role gets its own sidebar configuration, following the same `Sidebar` (shadcn) + collapsible pattern as admin/salesperson/DSM.

**HR sidebar items:**
1. Dashboard (HugeIcon: `Home01Icon`) -- `/hr`
2. Employees (HugeIcon: `UserMultipleIcon`) -- `/hr/employees`
3. Onboarding (HugeIcon: `TaskDone01Icon`) -- with count badge showing pending onboardings -- `/hr/onboarding`
4. Letters (HugeIcon: `FileTextIcon`) -- `/hr/letters` -- Phase B placeholder (disabled, muted, tooltip: "Coming in Phase B")
5. Payroll (HugeIcon: `MoneyBag02Icon`) -- `/hr/payroll` -- Phase C placeholder
6. --- separator ---
7. Insurance (HugeIcon: `ShieldCheckIcon`) -- `/hr/insurance` -- Phase D placeholder
8. Queries (HugeIcon: `HelpCircleIcon`) -- `/hr/queries` -- Phase D placeholder
9. Suggestions (HugeIcon: `LightBulb02Icon`) -- `/hr/suggestions` -- Phase D placeholder

**Why show disabled items for future phases?** Because the HR user can see the full scope of what is coming. It builds confidence that this is a comprehensive system, not a half-built prototype. The disabled state (muted text, no hover effect, tooltip explaining the phase) prevents confusion while maintaining architectural awareness.

### Salesperson Sidebar Addition

Add after existing items, before the separator:
- "My HR" (HugeIcon: `UserAccountIcon`) -- `/dashboard/hr`
  - If onboarding is incomplete: show a small red dot indicator next to the label (same notification dot pattern as "New leads" badge on the leads nav item)

### Admin Sidebar Addition

Add after existing items, before the separator:
- "My HR" (HugeIcon: `UserAccountIcon`) -- `/admin/hr`
  - Same onboarding dot indicator if applicable

---

## Page 1: HR Dashboard (`/hr`)

### Page Purpose
Give HR staff a 10-second operational snapshot: who needs onboarding, what needs attention, and what is coming next.

### User Arrives With...
**Mindset:** The HR staff member opens this at the start of their workday. They are thinking: "Do any new employees need onboarding? Are there pending tasks I need to follow up on? What is the state of my team?" Unlike the sales admin who monitors a real-time machine, the HR person manages slower-moving processes -- onboarding takes days, payroll is monthly, queries trickle in.
**Emotion:** Organized and methodical. HR professionals want to feel like nothing is falling through the cracks. Their worst fear is forgetting an onboarding step or missing a document deadline.
**Goal:** Scan for items that need action today. Then navigate to the specific area that needs work.

### The Attention Flow

1. **First 0.5s:** The stat cards at the top -- four numbers that answer "what is the current state of HR operations?"
2. **First 3s:** Eyes scan left-to-right across stat cards, then drop to the onboarding queue preview
3. **First 10s:** If any onboarding items are pending, click through to the onboarding queue. Otherwise, scan quick actions for the next task.
4. **After that:** Use quick action buttons to navigate to specific HR sections

### Information Hierarchy

**Tier 1 -- The Numbers (top of page):**
Four stat cards in a horizontal row (`grid cols-4`, responsive to `cols-2` on mobile).

```
shadcn/ui: Card component
Each card contains:
  - Label (text-xs text-muted-foreground uppercase tracking-wide)
  - Number (Geist Sans, text-3xl font-bold tabular-nums)
  - Sub-stat or contextual note (text-xs, inline)
```

The four cards:
1. **Total Employees** -- number of active non-DSM users with employee profiles. Sub-stat: "+X this month" in primary color if new employees were added
2. **Pending Onboardings** -- count of `pending` + `in_progress` checklists. If > 0, the number is in primary color to signal action needed. Sub-stat: "X new, Y in progress"
3. **Open Queries** -- Phase D placeholder. Shows "0" with muted text "Coming soon" underneath. Card has a subtle `opacity-60` treatment to communicate it is not yet active
4. **Insurance Renewals** -- Phase D placeholder. Same muted treatment

**Why show placeholder cards?** Consistency with the sales admin dashboard pattern of 4 stat cards. It establishes the visual rhythm. The HR person sees that the system will grow. And when Phase D ships, the layout does not change -- the placeholders simply activate.

**Tier 2 -- Onboarding Queue Preview (middle of page, left column ~60%):**

```
shadcn/ui: Card with a mini Table inside
Title: "Pending Onboardings" (Geist Sans, font-semibold)
Subtitle: "Employees who need attention"
```

A compact table showing the 5 most recent pending/in-progress onboardings:

| Employee | Status | Progress | Created |
|---|---|---|---|
| Priya Sharma | In Progress | 4/7 items | 2 days ago |
| Amit Kumar | Pending | 0/7 items | 5 hours ago |

Column details:
- **Employee:** Name (font-medium). Clickable -- navigates to `/hr/employees/[id]` with scroll-to onboarding section
- **Status:** Badge with onboarding status colors
- **Progress:** "X/7 items" displayed as text. A tiny inline progress bar below (4px height, `bg-primary` fill, `bg-muted` track) gives visual weight to how far along they are
- **Created:** Relative time

Below the table: "View All Onboardings" link (Button variant="link", text-sm) that navigates to `/hr/onboarding`

If there are zero pending onboardings:
```
Centered in the card:
HugeIcon: CheckmarkCircle01Icon (size 36, text-green-600)
"All employees onboarded"
"No pending onboarding checklists"
```

**Tier 2 -- Quick Actions (middle of page, right column ~40%):**

```
shadcn/ui: Card
Title: "Quick Actions"
```

- **View Employees** (Button, variant="default", full width) -- the primary HR action is people management
- **Manage Onboarding** (Button, variant="outline", full width)
- **Generate Letter** (Button, variant="outline", full width, disabled with "Phase B" tooltip)
- **Run Payroll** (Button, variant="outline", full width, disabled with "Phase C" tooltip)

Each button has a HugeIcon on the left. The "View Employees" button is primary because the employee directory is the HR person's home base -- everything branches from people.

**Tier 3 -- Recent Activity (bottom of page):**

```
shadcn/ui: Card with ScrollArea inside
Title: "Recent HR Activity"
```

- Chronological feed of HR-related activity log entries
- Each entry: `[Timestamp] [User avatar+name] [action verb] [entity link]`
- Example: `9:42 AM  Admin  created employee profile  Priya Sharma`
- Example: `Yesterday  Amit K.  completed onboarding item  Submit PAN copy`
- Entity names are links (Button variant="link") that navigate to the relevant employee detail
- Show last 15 entries, with "View All" link to filtered activity log
- **Real-time:** New entries animate in from top with `animate-in fade-in slide-in-from-top-2 duration-300`

### Component Map

```
Layout: Single column, max-w-7xl, mx-auto, px-6
Top section: grid grid-cols-4 gap-4 (stat cards)
Middle section: grid grid-cols-5 gap-6 (3 cols onboarding queue, 2 cols quick actions)
Bottom section: full width (activity feed)
Spacing: py-6 between sections
```

### Micro-Interactions

- **Stat card hover:** Subtle `bg-muted/50` background transition on active cards (Total Employees, Pending Onboardings). No hover effect on placeholder cards. Cursor changes to pointer on active cards -- clicking the Pending Onboardings card navigates to `/hr/onboarding`, clicking Total Employees navigates to `/hr/employees`.
- **Stat number real-time update:** When an employee completes an onboarding item (via Convex subscription), the Pending Onboardings count decrements live. The number briefly flashes in primary color for 1 second, then fades back. Use `transition-colors duration-1000`.
- **Onboarding table row hover:** `bg-muted/50` background. The progress bar subtly highlights (primary color brightens).
- **Activity feed real-time:** New entries slide in from top. Feed does not jump -- new entries push others down smoothly.
- **Quick action button hover:** Subtle `bg-muted` background for outline variants. Primary button gets slightly darker `bg-primary/90`.

### Delight Opportunities

1. **Time-aware greeting:** "Good morning, [Name]" header (same pattern as admin/salesperson dashboards). Below it: "You have X pending onboardings and Y open items." One sentence that tells the full story. Rendered in Geist Sans, text-lg, text-muted-foreground, above the stat cards.
2. **Progress celebration:** When the last pending onboarding is marked complete (the Pending Onboardings card goes to 0), briefly show the card with a green-tinted background and a checkmark icon replacing the number. This reverts to "0" after 3 seconds. Small acknowledgment that you cleared your queue.
3. **Onboarding progress mini-bar:** The 4px inline progress bars in the queue preview are not just data -- they are visual momentum. Seeing "5/7" with a mostly-filled bar feels close to done and motivates follow-through.

### Anti-Patterns to Avoid
- Do NOT show charts or graphs. At 50 employees, charts are overkill. Numbers and small tables communicate faster at this scale.
- Do NOT make the dashboard a landing page with only links. It must have real data -- the stat cards and onboarding preview are live data, not just navigation.
- Do NOT hide the placeholder cards. Showing them (muted) is better than having the layout shift when Phase D ships.
- Do NOT overload with Phase D/C/B previews. Two placeholder cards and two disabled buttons are enough. More than that and the page feels incomplete rather than growing.

### Mobile Behavior

- Stat cards: `grid-cols-2` on mobile. Active cards in the first row, placeholder cards in the second row.
- Onboarding queue and quick actions: Stack vertically (queue on top, full width; actions below, full width).
- Activity feed: Full width, same vertical scroll.
- Quick actions: Buttons stack vertically at full width (they already do since they are full-width within the card).

---

## Page 2: Employee Directory (`/hr/employees`)

### Page Purpose
Find any employee and access their complete HR profile.

### User Arrives With...
**Mindset:** The HR person is either (a) looking for a specific employee by name to update their profile or check onboarding, (b) scanning the entire roster to review who needs attention, or (c) filtering by a specific attribute (role, department, onboarding status) to work a batch of tasks.
**Emotion:** Purposeful and focused. They came here with a person in mind or a filter in mind.
**Goal:** Find the employee fast, click through to their detail page, take action.

### The Attention Flow

1. **First 0.5s:** The search/filter bar at the top -- immediately communicates "this is a searchable directory"
2. **First 3s:** Eyes scan the table headers, then the first few rows of data
3. **First 10s:** Type a name in search, or apply a filter, or click into an employee row

### Information Hierarchy

**Tier 1 -- Filter Bar (top of page, sticky below top bar):**

```
Layout: Horizontal flex bar, gap-2, flex-wrap on mobile
Sticky: yes, sticks below the 48px top bar on scroll
Background: bg-background with border-b border-border
```

Components (left to right):
1. **Search input** (shadcn Input, with HugeIcon `Search01Icon` as prefix) -- placeholder: "Search by name, email, or phone..." -- `w-72`
2. **Role filter** (shadcn Select) -- "All Roles" default, options: Admin, Salesperson, HR
3. **Onboarding Status filter** (shadcn Select) -- "All Statuses" default, options: Pending, In Progress, Completed
4. **Department filter** (shadcn Select) -- "All Departments" default, populated from existing department values
5. --- spacer ---
6. **Employee count** -- "X employees" (text-sm text-muted-foreground) right-aligned. This gives confidence that the filter is working.

**Why no "Add Employee" button here?** Employees are created through the User Management page (when a user is assigned a non-DSM role, their employee profile is auto-created). The HR module does not create users -- it manages their HR data. This separation is important: user creation is an admin function; HR profile management is an HR function.

**Tier 2 -- Data Table (main content):**

```
shadcn/ui: DataTable (built on TanStack Table, cursor-based pagination)
Columns: Name | Email | Phone | Role | Department | Onboarding | Date of Joining | Actions
```

Column details:
- **Name:** Avatar (32px, using initials if no photo uploaded, Clerk image if available) + full name. `font-medium`. Clickable -- navigates to `/hr/employees/[id]`.
- **Email:** `text-muted-foreground`. Truncated with tooltip on long addresses.
- **Phone:** `font-mono text-muted-foreground`. Click to copy (toast: "Phone number copied").
- **Role:** Badge (color-coded: Admin = primary-tinted, Salesperson = blue-tinted, HR = teal-tinted). Same colors as User Management page for consistency.
- **Department:** Text, `text-muted-foreground`. Shows "Not set" in italic if missing.
- **Onboarding:** Three possible displays:
  - Badge "Pending" (yellow) -- employee has not started
  - Badge "In Progress" + "X/7" text beside it (blue) -- partially done
  - Badge "Completed" (green) -- all items checked off
  - No badge if for some reason no checklist exists (edge case for migrated data)
- **Date of Joining:** Formatted date (`DD MMM YYYY`), `font-mono text-muted-foreground`. Shows "--" if not set.
- **Actions:** shadcn DropdownMenu (icon-only trigger, `MoreHorizontal` icon):
  - "View Profile" -- navigates to employee detail
  - "Edit Profile" -- navigates to employee detail with edit mode active (via URL query param `?edit=true`)

**Row interaction:**
- Hover: `bg-muted/50` background
- Click anywhere on row (except phone and actions): Navigates to `/hr/employees/[id]`

**Pagination:**
```
shadcn/ui: Pagination component (cursor-based, same pattern as leads table)
Position: Bottom of table
Show: "Showing 1-25 of X employees" + page controls
Page size: 25 (fixed -- at 50 employees, pagination is rarely needed but is present for future scale)
```

### Component Map

```
Layout: Full width within the content area (max-w-7xl mx-auto px-6)
Top: Filter bar (sticky)
Middle: DataTable (scrollable within viewport)
Bottom: Pagination (sticky bottom when table overflows)
```

### Micro-Interactions

- **Search:** Debounced at 300ms. Shows inline loading indicator (thin progress bar at top of table). Results filter in real-time via Convex query.
- **Filter changes:** Instant table update. No "Apply" button. Each filter change triggers a new Convex query. Subtle loading bar during re-query.
- **Column sorting:** Click header to sort. Active sort column gets a chevron icon. Sortable columns: Name (alpha), Date of Joining, Role, Department, Onboarding status.
- **Phone click-to-copy:** Same pattern as leads table. Sonner toast: "Phone number copied".
- **Real-time updates:** If another HR user or admin updates an employee's profile or onboarding status, the row updates live with a brief background highlight (`bg-primary/5` for 1.5s).
- **New employee appears:** When a user is assigned a non-DSM role elsewhere (triggering auto-profile creation), the new row animates into the table with `animate-in fade-in slide-in-from-top-2`.

### Empty State

If no employees exist (extremely unlikely after backfill, but handle it):
```
Centered in table area:
HugeIcon: UserMultipleIcon (size 48, text-muted-foreground)
"No employee profiles yet"
"Employee profiles are created automatically when users are assigned non-DSM roles in User Management."
Button: "Go to User Management" (variant="outline", size="sm")
```

If filters return zero results:
```
Centered in table area:
HugeIcon: Search01Icon (size 48, text-muted-foreground)
"No employees match your filters"
"Try adjusting your search or filters"
Button: "Clear all filters" (variant="outline", size="sm")
```

### Delight Opportunities

1. **Onboarding progress at a glance:** The onboarding column does not just show a status badge -- it shows the fraction ("4/7") next to the "In Progress" badge. This gives the HR person an instant sense of how close each person is without clicking in.
2. **Smart sort default:** Default sort is by onboarding status (Pending first, then In Progress, then Completed), then by created date descending within each group. This means the people who need the most attention are always at the top. Problem-first sorting, not alphabetical.
3. **Keyboard shortcut:** `Cmd+K` global search also searches employees by name/email within the HR module.

### Anti-Patterns to Avoid
- Do NOT use a card/grid layout. At 50+ employees, a table is the only scalable way to scan a directory.
- Do NOT open employee detail as a Sheet. Unlike leads (where salespeople quickly bounce between many leads), HR users dive deep into one employee at a time. A full page gives them the space for the profile sections, onboarding checklist, and future tabs.
- Do NOT show salary or insurance data in the directory table. That is detail-level information, not scannable directory data.
- Do NOT hide the onboarding status. It is the most actionable column in Phase A -- the HR person needs to see who still needs attention.

### Mobile Behavior

- **Filter bar:** Wraps to multiple lines, or collapses into a "Filters" button that opens a Sheet (side="bottom") with all filter controls stacked vertically. Search always remains visible.
- **Table -> Card list:** On < 768px, each employee becomes a card:
  ```
  | Avatar  Name                            Role Badge |
  | Email                              Onboarding Badge |
  | Department              Date of Joining              |
  ```
  Cards are stacked vertically. Tap to navigate to detail.
- **Phone number:** On mobile, tapping opens the native dialer (`tel:` link).

---

## Page 3: Employee Detail (`/hr/employees/[id]`)

### Page Purpose
Show everything HR knows about one employee, and make it easy to update any section of their profile.

### User Arrives With...
**Mindset:** The HR person clicked an employee from the directory or onboarding queue. They need to either (a) review/complete onboarding for this person, (b) update their profile information (bank details came in, address changed), (c) check their HR history, or (d) in future phases, manage letters/salary/insurance for this person.
**Emotion:** Focused on this one individual. They may have the employee on the phone asking about their onboarding status, or they may be working through a batch of onboarding reviews.
**Goal:** See the full picture of this employee, update what needs updating, track what is still missing.

### The Attention Flow

1. **First 0.5s:** Employee name + role badge at the top. "Who am I looking at?"
2. **First 2s:** Onboarding status and progress indicator. "What is their onboarding state?" This is the primary Phase A concern.
3. **First 5s:** Scan the profile sections -- what data is filled, what is missing?
4. **After that:** Click into specific sections to edit, toggle onboarding items, or review activity history.

### Information Hierarchy

**Tier 1 -- Employee Header (top of page, not sticky -- this is a full page, not a Sheet):**

```
Layout: flex items-start gap-6, with avatar on left and details on right
Background: bg-background, border-b border-border, pb-6, mb-6
```

- **Avatar:** 64px, using the employee's uploaded photo (from `photoStorageId`) if available, Clerk profile image as fallback, or initials if neither exists. Sharp square (no border-radius). Border: `border-2 border-border`.
- **Employee name** (Geist Sans, text-2xl, font-bold)
- **Role badge** (teal for HR, primary-tinted for Admin, blue-tinted for Salesperson)
- **Department** (text-sm text-muted-foreground) -- "Not set" in italic if missing
- **Designation** (text-sm text-muted-foreground) -- "Not set" in italic if missing
- **Date of Joining** (text-sm font-mono text-muted-foreground) -- "Not set" if missing
- **Email** (text-sm text-muted-foreground, with copy button)
- **Phone** (text-sm font-mono text-muted-foreground, with copy button and `tel:` link icon)

Right side of header:
- **Onboarding status indicator** -- a prominent visual:
  - If Pending: Yellow badge "Onboarding Pending" + "0/7 items" + link "Start Onboarding" (scrolls to onboarding section)
  - If In Progress: Blue badge "Onboarding In Progress" + "X/7 items" + small progress bar (48px wide, 4px height)
  - If Completed: Green badge "Onboarding Complete" + checkmark icon
  - This indicator is the most important piece of Tier 1 information in Phase A

**Tier 2 -- Collapsible Sections (vertical stack below header):**

The detail page uses vertically stacked collapsible sections, NOT tabs. This follows the Phase 1 anti-pattern rule: tabs hide information and add clicks. Vertical sections show everything in context, and collapsibles keep it manageable.

Each section follows the same pattern:
```
shadcn/ui: Collapsible
Trigger: flex bar with section title (Geist Sans, font-semibold) + chevron icon + optional status indicator
Content: section-specific content with py-4
Border: border-b border-border between sections
```

**Section A: Onboarding Checklist** (default: OPEN if not completed, CLOSED if completed)

```
shadcn/ui: Collapsible, default open when status != "completed"
Title: "Onboarding" + status badge + "X/7 complete"
```

Content:
- A vertical list of 7 checklist items, each as a row:
  ```
  | [Checkbox] Item label                    Completed by [Name] on [Date] |
  ```
  - shadcn Checkbox for each item
  - Completed items: checkbox checked, text has `line-through text-muted-foreground`, completion metadata on the right
  - Incomplete items: checkbox unchecked, text is normal weight, right side is empty
  - Items are in their defined order (not sorted by completion)

- **Toggle behavior:** HR can check/uncheck any item. Each toggle is an immediate Convex mutation. No "Save" button for the checklist -- each checkbox click is atomic.
- **"Mark Complete" button:** Appears at the bottom of the checklist when all 7 items are checked. Button variant="default", label: "Mark Onboarding Complete". This is a deliberate final step -- even though all items are done, HR explicitly confirms the overall completion. Clicking triggers a confirmation: "Mark [Employee Name]'s onboarding as complete? This cannot be undone." (shadcn AlertDialog)
- **If already completed:** The section collapses by default. When expanded, all items show as checked with timestamps. A green "Completed on [Date]" note appears at the top of the section content.

**Section B: Personal Information** (default: OPEN)

```
shadcn/ui: Collapsible, default open
Title: "Personal Information" + "Edit" button (Button variant="ghost", size="sm") on the right side of the trigger bar
```

**View mode (default):**
A two-column key-value grid:

```
Layout: grid grid-cols-2 gap-x-8 gap-y-3 (desktop), grid-cols-1 (mobile)
Each item: Label (text-xs text-muted-foreground uppercase tracking-wide) above Value (text-sm)
```

Fields:
- Full Name | Date of Birth
- Gender | Marital Status
- Father's Name | Mother's Name
- Blood Group | PAN Number
- Aadhar Number | Address
- Photo (thumbnail 48px if uploaded, "Not uploaded" if missing)

Missing fields show "--" in `text-muted-foreground italic`. This is important: the HR person needs to see at a glance what is still missing so they can follow up with the employee.

**Edit mode (triggered by "Edit" button):**

The view transforms in-place to an editable form. The key-value grid becomes input fields in the same positions.

```
shadcn/ui: Input, Select, Textarea (for address)
```

- Full Name: Input (pre-filled)
- Date of Birth: DatePicker (shadcn Calendar in Popover)
- Gender: Select (Male, Female, Other)
- Marital Status: Select (Single, Married, Divorced, Widowed)
- Father's Name: Input
- Mother's Name: Input
- Blood Group: Select (A+, A-, B+, B-, O+, O-, AB+, AB-)
- PAN Number: Input (with format validation: XXXXX9999X pattern)
- Aadhar Number: Input (with format validation: 12 digits, displayed as XXXX XXXX XXXX)
- Address: Textarea (3 rows)
- Photo: File upload zone (small, inline -- click to browse or drag, preview of current photo beside it)

Footer of edit mode:
- "Cancel" (Button variant="outline") -- reverts to view mode, discards changes
- "Save Changes" (Button variant="default") -- only enabled when something is dirty

**Transition between view/edit:** The section content cross-fades (`animate-in fade-in duration-200`). The edit button text changes to "Cancel" when in edit mode (or shows both Cancel and Save at the bottom -- either approach works; bottom buttons are better because they are near where the user is editing).

**Section C: Banking Details** (default: OPEN)

Same view/edit pattern as Personal Information.

```
Title: "Banking Details" + "Edit" button
```

View mode key-value grid (single column is fine -- only 3 fields):
- Bank Name
- Account Number (partially masked in view mode: "XXXX XXXX 4321" -- show only last 4 digits)
- IFSC Code

Edit mode: Three inputs, vertically stacked.

**Why mask the account number?** This is sensitive financial data. Even HR staff seeing the full number in view mode is unnecessary for most tasks. The "Edit" button reveals the full number for editing. This is a small but meaningful trust signal for the employee.

**Section D: Emergency Contact** (default: OPEN)

```
Title: "Emergency Contact" + "Edit" button
```

View mode:
- Contact Name | Relationship
- Phone Number (font-mono, with copy button and `tel:` link)

Edit mode: Three inputs.

**Section E: Letters** (default: CLOSED, Phase B placeholder)

```
Title: "Letters" + Badge "Coming in Phase B" (text-xs, muted)
```

Content when expanded:
```
Centered placeholder:
HugeIcon: FileTextIcon (size 36, text-muted-foreground)
"Letter management is coming in Phase B"
"You will be able to generate and manage employee letters here."
```

**Section F: Salary** (default: CLOSED, Phase C placeholder)

Same placeholder pattern.

**Section G: Insurance** (default: CLOSED, Phase D placeholder)

Same placeholder pattern.

**Section H: Activity Log** (default: CLOSED)

```
Title: "Activity History"
```

Content:
- Vertical timeline of activity log entries filtered to this employee
- Same visual treatment as the lead detail timeline: left vertical line, dots, timestamps, action descriptions
- Shows: profile creation, onboarding item completions, profile edits, letter generation (Phase B), salary changes (Phase C), etc.
- Load last 20 entries. "Load more" button at bottom for history.
- **Real-time:** New entries animate in with `animate-in fade-in slide-in-from-top-2`.

### Component Map

```
Layout: max-w-4xl mx-auto px-6 py-6
Header: flex items-start gap-6
Sections: Vertical stack of Collapsibles with border-b between each
Section content: py-4 px-2
```

**Back navigation:** Top of page shows Breadcrumb (shadcn Breadcrumb): `HR > Employees > [Employee Name]`. The "Employees" breadcrumb links back to the directory.

### Micro-Interactions

- **Onboarding checkbox toggle:** On click, the checkbox animates to its new state. A Sonner toast confirms: "Item marked as complete" or "Item marked as incomplete". The completion metadata (who completed it, when) appears/disappears beside the item with a brief fade. The progress count in the section title updates immediately.
- **Edit mode transition:** The view-to-edit transition uses `animate-in fade-in duration-200`. Input fields auto-focus on the first empty field (smart focus -- if the HR person is editing because something is missing, jump them to the first blank field).
- **Save confirmation:** On save, inputs transition back to view mode. A Sonner toast confirms: "Profile updated". The saved values appear in their view-mode styling. If the save fails, an error toast appears and the form stays in edit mode with the user's entered data preserved.
- **"Mark Complete" button appearance:** When the 7th checkbox is toggled on, the "Mark Complete" button animates in from below (`animate-in fade-in slide-in-from-bottom-2 duration-300`). This is a satisfying reveal -- you checked everything, now the final action appears.
- **Collapsible open/close:** Content slides in/out with `animate-in fade-in slide-in-from-top-1 duration-200` on open, reverse on close. The chevron rotates smoothly.
- **Photo upload:** On file selection, the photo preview updates immediately (local blob URL) with a brief loading overlay until the Convex upload completes. On success, the preview solidifies. On failure, reverts to the previous photo with an error toast.

### Delight Opportunities

1. **Completeness indicator:** In the header, beside the onboarding status, show a small "Profile completeness" percentage or bar. Count how many profile fields are filled vs. total. Example: "Profile: 8/15 fields". This motivates both HR and the employee to fill in missing data. It is not blocking -- just informational.
2. **Smart section ordering:** If onboarding is incomplete, the Onboarding section is first AND open. If onboarding is complete, the Personal Information section becomes the first open section (since that is now the most relevant). The page adapts its default state based on context.
3. **Sensitive data masking:** The account number masking and PAN/Aadhar display (with copy buttons that copy the full value) signals to employees that HR takes data security seriously. This is trust-building through interaction design.

### Anti-Patterns to Avoid
- Do NOT use tabs to separate profile sections. Tabs hide information. Vertical collapsibles show everything in context with minimal scrolling.
- Do NOT open a Dialog for editing. Inline edit (view transforms to form) is faster and maintains spatial context -- the user sees exactly what they are changing.
- Do NOT show a "Delete Employee" button. Employee profiles are not deletable. Deactivation happens at the user level, not the HR profile level.
- Do NOT show all future-phase sections as fully expanded empty cards. They should be collapsed with a brief "Coming in Phase X" note. Showing large empty areas makes the page feel broken.
- Do NOT require saving the entire profile at once. Each section (Personal, Banking, Emergency) saves independently. This reduces the risk of losing data and matches the incremental nature of HR data collection (bank details might come in on a different day than personal info).

### Mobile Behavior

- **Header:** Avatar + name stack vertically. Role badge and onboarding status move below the name. Metadata (email, phone, etc.) stacks into a single column.
- **Key-value grids:** Switch from 2-column to 1-column on mobile.
- **Edit mode:** Same layout, just single-column inputs. Full-width fields.
- **Collapsible sections:** Unchanged -- the collapsible pattern works well on mobile since each section is a discrete, expandable block.
- **Breadcrumb:** Collapses to `< Employees` back link on mobile (same pattern as leads).

---

## Page 4: Onboarding Queue (`/hr/onboarding`)

### Page Purpose
Track every employee's onboarding progress and ensure nothing falls through the cracks.

### User Arrives With...
**Mindset:** The HR person came here because they saw "X pending onboardings" on the dashboard and want to work through them. Or they are checking: "Did that new hire finish their paperwork?" This is a task queue -- they want to clear it.
**Emotion:** Systematic. They are in "process mode" -- checking items off a list. They want a clear picture of who is done, who is close, and who has not started.
**Goal:** See all onboardings at a glance, prioritize who to follow up with, click through to manage individual checklists.

### The Attention Flow

1. **First 0.5s:** The status filter tabs at the top and the count of pending items. "How many do I need to deal with?"
2. **First 3s:** Scan the table rows. The progress column tells the story at a glance.
3. **First 10s:** Click into the most urgent item (the one with the least progress), or filter to see only pending items.

### Information Hierarchy

**Tier 1 -- Status Tabs + Count (top of page):**

```
shadcn/ui: Tabs (horizontal, above the table)
```

- Tab 1: **All** (default, shows count badge: "12")
- Tab 2: **Pending** (count badge in yellow)
- Tab 3: **In Progress** (count badge in blue)
- Tab 4: **Completed** (count badge in green)

The tabs are the primary way to slice this view. Each tab filters the table below. Count badges on tabs give instant context without needing to read the table.

**Tier 2 -- Onboarding Table:**

```
shadcn/ui: DataTable
Columns: Employee | Role | Status | Progress | Items Remaining | Created | Actions
```

Column details:
- **Employee:** Avatar (24px) + name. `font-medium`. Clickable -- navigates to `/hr/employees/[id]` (scrolled to onboarding section via URL hash `#onboarding`).
- **Role:** Badge (same role colors as directory)
- **Status:** Badge (Pending/In Progress/Completed with onboarding colors)
- **Progress:** Visual progress bar (64px wide, 6px height) + "X/7" text beside it
  - 0/7: Empty bar, muted text
  - 1-6/7: Partial fill with primary color
  - 7/7: Full fill with green color (even before "Mark Complete" -- the bar shows item-level progress)
- **Items Remaining:** Text listing which items are still unchecked. Truncated to first 2 items with "+X more" tooltip. Example: "Submit PAN, Submit Aadhar +3 more". `text-xs text-muted-foreground`. This is the most useful column -- it tells HR exactly what to nag the employee about without clicking in.
- **Created:** Relative time ("5 days ago") with full date in tooltip.
- **Actions:** "View" button (Button variant="ghost", size="sm") that navigates to employee detail.

**Sorting:** Default sort: Pending first (sorted by created date ascending -- oldest pending first, because those are the most overdue), then In Progress (sorted by progress ascending -- least progress first), then Completed (sorted by completed date descending). This is problem-first sorting.

### Component Map

```
Layout: max-w-7xl mx-auto px-6 py-6
Top: Tabs
Below tabs: DataTable
Bottom: Pagination (if needed, but at 50 employees this is unlikely)
```

### Micro-Interactions

- **Tab switch:** Table filters instantly. No loading state needed for client-side filtering of subscribed data.
- **Progress bar animation:** When a checklist item is completed elsewhere (employee or another HR user), the progress bar in the table fills incrementally with a smooth `transition-all duration-500`. The "X/7" text updates. The "Items Remaining" column updates to remove the completed item.
- **Status badge transition:** When status changes (e.g., Pending -> In Progress after first item is completed), the badge color transitions smoothly.
- **Row completion:** When an onboarding is marked complete, the row updates in place. If the user is on the "Pending" or "In Progress" tab, the row fades out (`animate-out fade-out duration-300`) as it moves to a different status group. Satisfying -- "that one is done."
- **New onboarding appears:** When a new user is assigned a non-DSM role (triggering auto-profile + checklist creation), a new row animates into the table with `animate-in fade-in slide-in-from-top-2`. A Sonner toast: "New onboarding created for [Employee Name]".

### Empty States

**All tab, no onboardings at all (post-backfill, everyone is done):**
```
Centered in table area:
HugeIcon: CheckmarkCircle01Icon (size 48, text-green-600)
"All employees are fully onboarded"
"New onboarding checklists are created automatically when users join the system."
```

**Pending/In Progress tab, none in this status:**
```
Centered:
HugeIcon: TaskDone01Icon (size 48, text-muted-foreground)
"No [pending/in-progress] onboardings"
"All current onboardings are either [in progress/completed]."
```

### Delight Opportunities

1. **Remaining items preview:** The "Items Remaining" column is a small touch that saves enormous time. Instead of clicking into every employee to see what is missing, the HR person can scan the column and batch their follow-ups: "I need PAN copies from three people -- I'll send one message to all three."
2. **Batch awareness:** Above the table, a small summary line: "X employees still need PAN copy, Y need bank details, Z need emergency contacts." This aggregates across all onboardings so the HR person can think in terms of document types, not individual people. Rendered in `text-xs text-muted-foreground`, below the tabs but above the table.
3. **Progress momentum:** The progress bars create a visual pattern. When most bars are mostly full, the page radiates a sense of "we are almost there." When bars are mostly empty, it signals "time to push."

### Anti-Patterns to Avoid
- Do NOT show the onboarding queue as a Kanban board (Pending | In Progress | Completed columns). At 50 employees, Kanban becomes unwieldy. A table with tabs is denser and more scannable.
- Do NOT allow editing onboarding items directly from this page. The queue is for overview and navigation. Editing happens on the employee detail page. Mixing overview with editing creates confusion.
- Do NOT hide completed onboardings entirely. Showing them (in the Completed tab) serves as a record and gives the HR person confidence that past onboardings were handled.
- Do NOT auto-mark onboarding as complete when all 7 items are checked. The explicit "Mark Complete" action on the employee detail page is intentional -- it is an HR sign-off, not just a data state.

### Mobile Behavior

- **Tabs:** Horizontal scrollable if they overflow (shadcn Tabs handle this natively).
- **Table -> Card list:** On < 768px, each onboarding becomes a card:
  ```
  | Avatar  Name                Role Badge  Status Badge |
  | Progress bar (full width)             X/7 complete   |
  | Missing: Submit PAN, Submit Aadhar               ... |
  | Created: 5 days ago                                   |
  ```
  Tap card to navigate to employee detail.
- **Items Remaining:** Fully visible on mobile cards (not truncated), since this is the most actionable info.

---

## Page 5: Employee Self-Service -- My HR (`/dashboard/hr` and `/admin/hr`)

### Page Purpose
Give the employee a single place to see their HR data, complete onboarding, and access HR services.

### User Arrives With...
**Mindset:** A salesperson (or admin) clicked "My HR" in the sidebar. They are either (a) responding to the onboarding notification dot they saw, (b) checking their own profile data, or (c) in future phases, downloading a payslip or submitting an HR query. The key emotional context: this is their data. They want to see it, verify it, and feel confident it is correct and handled well.
**Emotion:** Mildly curious to slightly anxious. If they are new, they are thinking: "What do I need to submit? Am I behind?" If they are established, they want to see "is my data correct?"
**Goal:** Complete onboarding if needed. Review personal info. Access HR services.

### The Attention Flow

1. **First 0.5s:** If onboarding is incomplete, the onboarding banner dominates. It is the first thing they see because it is the most urgent thing on the page. If onboarding is complete, the page leads with their profile summary.
2. **First 3s:** Read the banner message -- "You have X of 7 onboarding items remaining" -- and see the CTA button.
3. **First 10s:** Click "Complete Onboarding" to navigate to the onboarding form, OR scroll past to review their profile.

### Information Hierarchy

**Tier 0 -- Onboarding Banner (ONLY if onboarding is incomplete, top of page):**

```
shadcn/ui: Alert (custom-styled for prominence, not the default subtle Alert)
Background: bg-primary/5 (warm red/orange tint, very subtle)
Border: border-l-4 border-primary
```

Content:
- **Title:** "Complete Your Onboarding" (Geist Sans, font-semibold, text-base)
- **Description:** "You have X of 7 items remaining. Please complete your personal information to finish onboarding."
- **Progress bar:** Full-width, 6px height, showing X/7 progress
- **CTA button:** "Complete Onboarding" (Button variant="default", size="sm") -- navigates to `/dashboard/hr/onboarding`
- **Checklist preview:** Below the description, a compact list of remaining items (just the labels, no checkboxes):
  ```
  Remaining:
  - Submit PAN card copy
  - Submit bank account details
  - Submit passport-size photos
  ```
  `text-xs text-muted-foreground`

**Why not a dismissable banner?** Because onboarding IS the job until it is done. This is non-blocking (they can still access their dashboard, work leads, etc.) but persistent. It stays until onboarding is complete. The employee cannot hide it -- they can only resolve it.

**Why a border-left accent instead of a full-color background?** Full-color backgrounds (like a yellow warning) feel alarming. The subtle primary-tint + left border feels like a gentle, firm nudge: "Hey, this needs your attention, but no rush."

**Tier 1 -- Profile Summary (after banner or at top if onboarding is complete):**

```
shadcn/ui: Card
Title: "My Profile" (Geist Sans, font-semibold)
```

A read-only view of their own employee profile data. Uses the same key-value grid as the employee detail page's view mode, but the employee CANNOT edit from here -- edits go through the onboarding form (for initial setup) or through an HR request (for changes after onboarding).

**Why read-only?** Two reasons:
1. Employees should not unilaterally change sensitive data (bank details, PAN) after onboarding. Those changes require an HR query (Phase D).
2. Keeping this view read-only simplifies the page and reduces the risk of accidental data changes.

Fields shown:
- Name (from users table) | Email | Phone
- Date of Birth | Gender | Blood Group
- Department | Designation | Date of Joining
- PAN Number (masked: XXXXX9999X first 5 chars as X, last 4 digits, last char) | Aadhar Number (masked: XXXX XXXX 1234)
- Bank Name | Account Number (masked: XXXX XXXX 4321) | IFSC Code
- Emergency Contact: Name, Phone, Relation

Missing fields show "--" with `text-muted-foreground italic`.

**Tier 2 -- HR Services Grid (below profile):**

```
Layout: grid grid-cols-2 gap-4 (desktop), grid-cols-1 (mobile)
```

A grid of service cards, each one representing an HR self-service feature:

1. **Letters** (Phase B placeholder)
   ```
   shadcn/ui: Card (subtle, outline style)
   Icon: FileTextIcon (size 24)
   Title: "My Letters"
   Description: "View and download your letters"
   Status: "Coming soon" badge (text-xs, muted)
   ```

2. **Payslips** (Phase C placeholder)
   ```
   Same card pattern
   Icon: MoneyBag02Icon
   Title: "My Payslips"
   Description: "View and download salary slips"
   Status: "Coming soon" badge
   ```

3. **Insurance** (Phase D placeholder)
   ```
   Icon: ShieldCheckIcon
   Title: "Insurance"
   Description: "Enrollment and policy details"
   Status: "Coming soon" badge
   ```

4. **HR Queries** (Phase D placeholder)
   ```
   Icon: HelpCircleIcon
   Title: "Submit a Query"
   Description: "Request certificates, changes, and more"
   Status: "Coming soon" badge
   ```

5. **Suggestion Box** (Phase D placeholder)
   ```
   Icon: LightBulb02Icon
   Title: "Suggestion Box"
   Description: "Share ideas anonymously"
   Status: "Coming soon" badge
   ```

**Why show all these placeholders?** The employee sees that the company is investing in a comprehensive HR system. It builds anticipation and trust -- "Oh, I'll be able to download my payslips here soon." The cards are muted but not hidden. Each has a `opacity-60 cursor-not-allowed` treatment and the "Coming soon" badge.

### Component Map

```
Layout: max-w-3xl mx-auto px-6 py-6 (narrower than directory -- this is a personal page, not a data-dense one)
Top: Onboarding banner (conditional)
Middle: Profile summary card
Bottom: HR services grid
```

**Shared component:** `components/hr/self-service/my-hr-page.tsx` is the same component mounted at both `/dashboard/hr` (for salespeople) and `/admin/hr` (for admins). The only difference is the layout wrapper (salesperson shell vs. admin shell). The component uses `useCurrentUser` to fetch the logged-in user's profile and onboarding data.

### Micro-Interactions

- **Onboarding banner progress bar:** When the employee completes onboarding items on the form page and returns here, the progress bar animates to the new value with `transition-all duration-500`. The remaining items list updates.
- **Banner dismissal:** When onboarding is marked complete (by HR), the banner does not just disappear -- it collapses upward with `animate-out fade-out slide-out-to-top duration-300`. Optionally, a brief green success state flashes first: "Onboarding Complete!" with a checkmark, then collapses. This gives the employee a satisfying moment of closure.
- **Profile data real-time update:** If HR updates the employee's data (e.g., adds their date of joining), the value appears in the profile summary in real-time via Convex subscription. A brief highlight (`bg-primary/5` for 1.5s) on the changed field draws attention.
- **Service card hover:** No hover effect on disabled cards (they have `cursor-not-allowed`). When enabled in future phases, cards get `bg-muted/50` background on hover and `cursor-pointer`.

### Delight Opportunities

1. **Profile completeness ring:** Next to "My Profile" title, show a small circular progress indicator (like a miniature donut chart, built with CSS `conic-gradient`) showing what percentage of profile fields are filled. Example: "68% complete". This is subtly different from the onboarding progress -- onboarding is about document submission, profile completeness is about data fields. Both motivate completion.
2. **Personalized welcome:** If this is the employee's first time viewing My HR (no profile data exists yet), show a brief welcome state instead of the empty profile:
   ```
   "Welcome to SA Ventures HR"
   "Complete your onboarding to set up your profile."
   [Complete Onboarding] button
   ```
3. **Masked data with reveal:** When the employee hovers over masked fields (PAN, Aadhar, account number), show the full value in a tooltip. This confirms their data is correct without exposing it by default.

### Anti-Patterns to Avoid
- Do NOT let the employee edit their profile directly from this page (except via the onboarding form for initial setup). Post-onboarding changes go through HR queries.
- Do NOT hide the profile summary behind onboarding. The banner is prominent but does not replace the profile. Scroll past the banner and the profile is right there. The banner is a nudge, not a blocker.
- Do NOT make this page feel like a dead-end. Even with placeholder cards, it should feel like a living, growing hub. The placeholders are promises, not emptiness.
- Do NOT show HR-staff-only information here (like who completed which onboarding item on the HR side). This is the employee's view -- show only what is relevant to them.

### Mobile Behavior

- **Onboarding banner:** Full width, same layout. CTA button becomes full-width on mobile.
- **Profile summary:** Key-value grid switches to single column.
- **HR services grid:** Single column stack. Cards remain the same but take full width.
- **Masked data:** On mobile, tap the masked field to briefly reveal (since hover does not work on touch). Use a brief 3-second reveal, then re-mask.

---

## Page 6: Employee Onboarding Form (`/dashboard/hr/onboarding`)

### Page Purpose
Let the employee fill in all their personal, banking, and emergency contact information in one guided flow.

### User Arrives With...
**Mindset:** The employee clicked "Complete Onboarding" from the My HR banner. They are about to fill out a fairly long form with personal details. They may have their PAN card, bank passbook, and Aadhar card handy -- or they may not. They want to know: how much do I need to fill? Can I save and come back? What is required vs. optional?
**Emotion:** Mildly tedious (forms are never exciting) but motivated (they want to get this done). The key psychological barrier is form length -- if the form looks overwhelming, they will defer. If it looks manageable and progressive, they will start and finish.
**Goal:** Fill in their information, save it, and get onboarding off their plate.

### The Attention Flow

1. **First 0.5s:** The page header and progress indicator. "How much do I need to do?" The progress indicator instantly answers this.
2. **First 3s:** The first section (Personal Information) with its fields. The form is already focused on the first empty field, inviting immediate action.
3. **First 10s:** They are typing their date of birth or selecting their gender. They are IN the flow.
4. **Ongoing:** Work through sections, save each section independently or save all at once at the bottom.
5. **After completion:** See the checklist status update, feel the progress, navigate back to My HR.

### Information Hierarchy

**Page Header:**

```
Layout: max-w-2xl mx-auto (centered, narrower than other pages -- this is a form, not a data page)
```

- **Title:** "Complete Your Onboarding" (Geist Sans, text-xl, font-bold)
- **Subtitle:** "Fill in your personal details. Your information is securely stored and only accessible to HR." (text-sm text-muted-foreground)
- **Progress indicator:** Below the subtitle, a horizontal progress bar showing overall form completion:
  ```
  [========--------] 5 of 15 fields completed
  ```
  - Bar: full width, 6px height, `bg-muted` track, `bg-primary` fill
  - Text: "X of Y fields completed" (text-xs text-muted-foreground, right-aligned above bar)
  - The count includes all form fields across all sections. As the user fills fields and saves, this number increments.

**Form Sections:**

The form is divided into three visually distinct sections. Each section is a Card with a header and fields inside. Sections are stacked vertically with `gap-6` between them.

**Section 1: Personal Information**

```
shadcn/ui: Card
Title: "Personal Information" (Geist Sans, font-semibold)
Subtitle: "Basic details about you"
```

Fields (two-column grid on desktop, single-column on mobile):
- **Full Name** (Input, pre-filled from users table, read-only -- they cannot change their name here. `bg-muted/30` to indicate read-only. Tooltip: "Contact HR to change your name")
- **Date of Birth** (DatePicker -- shadcn Calendar in Popover. Required)
- **Gender** (Select: Male, Female, Other. Required)
- **Father's Name** (Input. Required)
- **Mother's Name** (Input. Required)
- **Marital Status** (Select: Single, Married, Divorced, Widowed. Required)
- **Blood Group** (Select: A+, A-, B+, B-, O+, O-, AB+, AB-. Required)
- **PAN Number** (Input. Required. Placeholder: "ABCDE1234F". Validation: 5 letters + 4 digits + 1 letter. Uppercase auto-transform on input)
- **Aadhar Number** (Input. Required. Placeholder: "1234 5678 9012". Validation: 12 digits. Auto-format with spaces every 4 digits as user types)
- **Address** (Textarea, 3 rows. Required. Placeholder: "Full residential address")
- **Photo** (File upload. Optional. Inline upload zone:
  ```
  Small bordered area (120px x 120px, border-2 border-dashed border-muted-foreground/25)
  If no photo: HugeIcon Camera01Icon + "Upload" text
  If photo exists: Preview thumbnail + "Change" overlay on hover
  Accepted: .jpg, .jpeg, .png (max 5MB)
  ```

**Section 2: Banking Details**

```
shadcn/ui: Card
Title: "Banking Details" (Geist Sans, font-semibold)
Subtitle: "For salary processing"
```

Fields (single column -- 3 fields do not need a grid):
- **Bank Name** (Input. Required. Placeholder: "e.g. State Bank of India")
- **Account Number** (Input. Required. Type="text" with numeric validation. Placeholder: "Savings account number")
- **IFSC Code** (Input. Required. Placeholder: "e.g. SBIN0001234". Validation: 4 letters + 0 + 6 alphanumeric chars. Uppercase auto-transform)

**Section 3: Emergency Contact**

```
shadcn/ui: Card
Title: "Emergency Contact" (Geist Sans, font-semibold)
Subtitle: "In case we need to reach someone on your behalf"
```

Fields (two-column grid, name + phone on one row, relation below):
- **Contact Name** (Input. Required. Placeholder: "Full name of emergency contact")
- **Contact Phone** (Input. Required. Type="tel". Placeholder: "10-digit mobile number". Same validation as DSM form)
- **Relationship** (Select: Parent, Spouse, Sibling, Child, Friend, Other. Required)

**Form Footer (bottom of page, sticky on long scroll):**

```
Layout: flex justify-between, border-t border-border, pt-4, bg-background
Position: sticky bottom-0 with subtle top shadow to indicate it floats above content
```

- Left: "Your progress is auto-saved as you fill each section." (text-xs text-muted-foreground) -- THIS IS A LIE unless we implement auto-save. See implementation note below.
- Right: "Save All" (Button variant="default", size="default")

**Implementation note on save behavior:** There are two viable approaches:

**Option A -- Save All (recommended for Phase A):**
- One "Save All" button at the bottom saves the entire form
- All fields update `employeeProfiles` in a single mutation
- After save, auto-toggle relevant onboarding checklist items: `complete_personal_info` (if all personal fields are filled) and `submit_emergency_contact` (if all emergency contact fields are filled)
- Simpler to implement, but the user must scroll to the bottom to save

**Option B -- Per-section save:**
- Each Card section has its own "Save" button in its footer
- More granular, allows partial completion
- But creates ambiguity: "Did I save that section?"

Recommendation: Option A with one key addition -- if the user tries to navigate away with unsaved changes, show a confirmation: "You have unsaved changes. Save before leaving?" (shadcn AlertDialog with "Save & Leave" / "Leave Without Saving" / "Cancel"). This eliminates the biggest risk of a single-save approach.

**Below the form sections -- Onboarding Checklist (read-only + partial toggle):**

```
shadcn/ui: Card
Title: "Onboarding Checklist" + "X/7 complete"
```

A read-only view of the 7 onboarding items. Shows which items are complete and which are not.

- Items that are auto-completable via this form (complete_personal_info, submit_emergency_contact): Show as toggleable checkboxes that auto-check when the corresponding form section is fully saved. The employee cannot manually check these -- they complete by filling the form.
- Items that require HR action (submit_pan, submit_aadhar, submit_bank_details, submit_photos, sign_offer_letter): Show as read-only checkboxes with a note: "Completed by HR" or "Pending HR verification". These communicate to the employee: "You submitted the form data, but HR needs to verify the physical documents."

**Why show the checklist here?** Because the employee needs to understand what "onboarding" means beyond this form. They might fill the form and think they are done, but HR still needs them to bring physical copies. The checklist provides complete transparency.

### Component Map

```
Layout: max-w-2xl mx-auto px-6 py-6
Header: Title + subtitle + progress bar
Sections: Stack of Cards with gap-6
Footer: Sticky bottom bar
Below footer: Onboarding checklist card
```

**Back navigation:** Breadcrumb at top: `My HR > Onboarding`. The "My HR" link navigates back to `/dashboard/hr`.

### Micro-Interactions

- **Field validation:** Real-time validation as the user types or blurs a field:
  - PAN format: validates on blur. If invalid, red border + error text: "PAN must be in format ABCDE1234F"
  - Aadhar format: validates on blur. Auto-formats with spaces as user types (every 4 digits). If invalid: "Aadhar must be 12 digits"
  - IFSC format: validates on blur. Uppercase auto-transform on input. If invalid: "IFSC must be in format ABCD0123456"
  - Phone: same green checkmark pattern as DSM phone input (shows checkmark when 10 valid digits entered)
  - Required fields: Red border + "This field is required" on blur if left empty after being focused
- **Progress bar increment:** Each time a field is filled (or a saved section's fields are confirmed), the progress bar animates wider with `transition-all duration-500`. The fraction text updates. This creates a gamification-lite feeling of progress.
- **Photo upload:** On file selection:
  1. Preview appears immediately (local blob URL) in the 120x120 zone
  2. A small loading spinner overlays the preview
  3. On Convex upload success: spinner disappears, preview solidifies
  4. On failure: revert to previous state, error toast "Photo upload failed. Please try again."
- **Save button state:**
  - Disabled (muted) when no changes exist
  - Enabled (primary color) when any field is dirty
  - Loading state (spinner + "Saving...") during mutation
  - Brief success state (green flash, "Saved!") then reverts to disabled
- **Unsaved changes guard:** Browser `beforeunload` event + Next.js route change interception. Shows AlertDialog: "You have unsaved changes" with options to save, discard, or cancel navigation.
- **Onboarding checklist auto-update:** After a successful save, if the personal info section is fully filled, the `complete_personal_info` checklist item animates to checked state with a brief delay (300ms after save, to create a cause-and-effect feeling). Same for emergency contact. The X/7 count in the checklist title increments. A subtle `bg-green-50` flash on the checked item.

### Delight Opportunities

1. **Smart field focus:** On page load, the form auto-focuses on the first EMPTY required field, not just the first field. If the employee already filled personal info and comes back to complete banking, the focus jumps to "Bank Name". This respects their progress and saves scrolling.
2. **Format helpers:** For PAN, Aadhar, and IFSC fields, show a small info icon (HugeIcon: `InformationCircleIcon`) that, on hover/click, shows a tooltip with: "Your PAN number is on your PAN card, format: ABCDE1234F" with a tiny visual example. This is especially helpful for employees who are not sure about the exact format.
3. **Section completion checkmarks:** When all required fields in a section are filled and saved, the Card header gains a small green checkmark icon beside the title. Three sections with three checkmarks feels like tangible progress. The checkmark appears with a brief `animate-in fade-in scale-in duration-300` bounce.
4. **Encouraging copy:** The subtitle under the title could change based on progress:
   - 0% complete: "Fill in your personal details to get started."
   - 30-60% complete: "You are making good progress."
   - 60-90% complete: "Almost there -- just a few fields left."
   - 100% complete: "All done! Your information has been saved."

### Anti-Patterns to Avoid
- Do NOT use a multi-step wizard for this form. Wizards are appropriate for the CSV import (which has distinct, dependent phases). For a data-entry form, a single scrollable page with sections is faster -- the employee can see everything at once, fill in whatever order they want, and save once. Wizards add unnecessary navigation for "fill all these fields" tasks.
- Do NOT use a Dialog or Sheet for this form. It is too long and data-dense for a modal. Full page gives the employee space to focus.
- Do NOT auto-save without clear indication. If implementing auto-save, show a persistent "Saved" / "Saving..." indicator. Ambiguity about save state is the #1 source of form anxiety.
- Do NOT make the photo upload required. Not all employees will have a digital photo ready. Make it optional and let HR follow up separately.
- Do NOT validate all fields on submit only. Real-time per-field validation (on blur) prevents the frustrating experience of filling 15 fields, clicking save, and getting a list of errors at the top.
- Do NOT show the entire onboarding checklist as editable to the employee. They can only influence 2 of 7 items (the form-related ones). Showing all 7 as toggleable would be confusing when 5 of them are HR-managed.

### Mobile Behavior

- **Form sections:** All grids collapse to single-column.
- **Photo upload zone:** Remains 120x120 but centers in the column.
- **Sticky footer:** Remains sticky at bottom. "Save All" button becomes full-width.
- **Field validation messages:** Appear below each field (standard mobile form pattern).
- **Date of Birth picker:** Uses the shadcn Calendar popover, which is mobile-friendly by default. Consider full-screen sheet on mobile for better touch interaction.
- **Keyboard handling:** On mobile, ensure numeric inputs (Aadhar, phone, account number) trigger the numeric keyboard via `inputMode="numeric"`.
- **Scroll-to-error:** On save, if any validation errors exist, auto-scroll to the first error field and focus it.

---

## Cross-Cutting HR UX Patterns

### Pattern: Onboarding Notification Dot

The sidebar "My HR" item shows a small red notification dot when the logged-in user has an incomplete onboarding checklist. This dot:
- Is a 6px red circle positioned at the top-right of the nav icon
- Uses `bg-destructive` color (not primary -- this is an action-required indicator)
- Has no animation (a pulsing dot would be too aggressive for a persistent notification)
- Disappears immediately when onboarding is marked complete (via Convex subscription)

This follows the same pattern as the "New leads" badge on the leads nav item for salespeople.

### Pattern: HR Data Sensitivity

Throughout the HR module, sensitive data (PAN, Aadhar, bank account numbers) is handled with consistent treatment:
1. **View mode:** Masked by default (show last 4 digits only). This applies everywhere the data is displayed read-only.
2. **Edit mode:** Full values shown in input fields. The user sees their own data when editing.
3. **Copy action:** Copies the FULL value (not masked) to clipboard. Toast confirms.
4. **Tooltips:** Hovering a masked value reveals the full value in a tooltip (desktop). Tapping reveals briefly on mobile (3 seconds).
5. **Audit trail:** All views and edits of sensitive data are logged to the activity log.

### Pattern: Real-Time Onboarding Updates

The onboarding system is inherently collaborative: the employee fills the form, HR reviews and checks off items, and the overall status progresses. Both parties see real-time updates via Convex subscriptions:

1. **Employee fills form and saves:** HR's employee detail page updates the profile fields live. The onboarding checklist items auto-toggle with animation.
2. **HR checks off a document item:** The employee's My HR page banner updates the progress bar and remaining items list live.
3. **HR marks onboarding complete:** The employee's banner collapses with a success animation. The sidebar notification dot disappears.
4. **Connection status:** Same global pattern -- yellow banner on disconnect, green "Connected" on reconnect.

### Pattern: HR Loading States

1. **HR Dashboard:** Skeleton stat cards (4 rectangular shimmer blocks) + skeleton table rows (5 rows with shimmer).
2. **Employee Directory:** Skeleton filter bar + skeleton table rows.
3. **Employee Detail:** Skeleton header (avatar block + text blocks) + skeleton collapsible sections.
4. **Onboarding Form:** Skeleton card sections with shimmer input blocks.
5. **Self-Service Page:** Skeleton banner + skeleton profile card.

All skeletons match the actual layout dimensions to prevent layout shift when data loads.

### Pattern: HR Empty States

Every HR list/table has a thoughtful empty state. No generic "No data" messages. Each empty state:
1. Tells the user WHY it is empty (contextual)
2. Tells them HOW to make it not empty (action)
3. Uses an appropriate HugeIcon (size 48, text-muted-foreground)

HR-specific examples:
- Empty employee directory: "No employee profiles yet. Employee profiles are created automatically when users are assigned roles in User Management." + "Go to User Management" button
- Empty onboarding queue: "All employees are fully onboarded. New checklists are created automatically when users join." (positive framing)
- Empty activity log: "No HR activity recorded yet."

### Pattern: HR Breadcrumb Navigation

All HR pages use Breadcrumb (shadcn) in the top bar:
- `/hr` -> "HR Dashboard" (no breadcrumb, just page title)
- `/hr/employees` -> "HR Dashboard > Employees"
- `/hr/employees/[id]` -> "HR Dashboard > Employees > [Employee Name]"
- `/hr/onboarding` -> "HR Dashboard > Onboarding"
- `/dashboard/hr` -> "Dashboard > My HR"
- `/dashboard/hr/onboarding` -> "Dashboard > My HR > Onboarding"

On mobile: collapses to `< [Parent]` back link.

### Pattern: Phase Placeholder Consistency

All Phase B/C/D placeholder sections and disabled navigation items follow the same treatment:
- **Disabled nav items:** `text-muted-foreground`, no hover effect, tooltip on hover: "Coming in Phase [X]"
- **Placeholder sections on detail pages:** Collapsed by default, expand to show an icon + one line of text + phase badge
- **Placeholder service cards on self-service:** `opacity-60`, `cursor-not-allowed`, "Coming soon" badge
- **Placeholder stat cards on dashboard:** `opacity-60`, show "0" with "Coming soon" subtitle

This consistency ensures that when each phase ships, the visual treatment simply "activates" -- from muted to normal. No layout changes, no surprises.
