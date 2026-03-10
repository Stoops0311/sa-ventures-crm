# SA CRM -- Phase 1 UX Stories

## Design System Reference

Before diving into page stories, here are the constraints every page must honor:

- **Theme:** Light only. White background (`oklch(1 0 0)`), near-black foreground (`oklch(0.145 0 0)`)
- **Primary color:** Warm red/orange (`oklch(0.514 0.222 16.935)`) -- used for primary buttons, active states, key accents
- **Border radius:** Zero everywhere. `--radius: 0`. Every card, button, input, badge is a sharp rectangle
- **Body font:** JetBrains Mono (monospace) -- gives the entire app a technical, data-dense, spreadsheet-replacement feel. This is intentional and powerful: salespeople coming from Excel will feel at home with monospace data
- **Heading font:** Geist Sans -- used sparingly for page titles and section headers to create contrast against the monospace body
- **Icons:** HugeIcons (already installed via `@hugeicons/react` and `@hugeicons/core-free-icons`)
- **Components:** shadcn/ui exclusively. All components already use `rounded-none` via the zero radius token
- **Animations:** tw-animate-css is available. Use `animate-in`, `fade-in`, `slide-in-from-bottom` etc. for micro-interactions

### The Aesthetic Identity

This CRM looks like a **professional instrument panel**, not a friendly SaaS app. The monospace font + sharp corners + warm red accent creates an aesthetic that says: "This is a precision tool built by people who respect your time." The Excel-to-CRM migration path is eased by the monospace data density -- it will feel familiar, but better organized.

---

## Global Navigation Architecture

### The Shell: Sidebar + Top Bar

Every authenticated page lives inside a shell layout. The navigation approach differs by role, but the structural pattern is consistent.

**Layout:** Fixed left sidebar (collapsed on mobile) + sticky top bar.

**Why a sidebar and not top nav?** Three reasons:
1. Salespeople will have 5-8 navigation items. A sidebar accommodates growth without crowding.
2. The sidebar provides persistent context -- presence indicators, quick stats -- without stealing content space.
3. On the data-heavy pages (lead tables, dashboards), horizontal space is more precious than vertical space.

#### Sidebar Structure

```
shadcn/ui: Sidebar component (collapsible)
Width: 240px expanded, 48px collapsed (icon-only)
Position: fixed left
```

**Admin sidebar items:**
1. Dashboard (HugeIcon: `Home01Icon`)
2. Leads (HugeIcon: `UserMultipleIcon`) -- with count badge showing "New" leads
3. Projects (HugeIcon: `Building06Icon`)
4. Users (HugeIcon: `UserGroupIcon`)
5. Import (HugeIcon: `FileUploadIcon`)
6. --- separator ---
7. Activity Log (HugeIcon: `Clock01Icon`)

**Salesperson sidebar items:**
1. Dashboard (HugeIcon: `Home01Icon`)
2. My Leads (HugeIcon: `UserMultipleIcon`) -- with count badge showing today's follow-ups
3. --- separator ---
4. Activity Log (HugeIcon: `Clock01Icon`)

**DSM sidebar items:**
1. Dashboard (HugeIcon: `Home01Icon`) -- this IS their only real page
2. My Submissions (HugeIcon: `TaskDone01Icon`)

**Sidebar footer:** User avatar + name + role badge. Click to open a Popover with "Sign Out" and account info.

#### Top Bar Structure

```
shadcn/ui: No specific component -- custom flex bar
Height: 48px
Position: sticky top
```

**Contents (left to right):**
1. Sidebar toggle button (mobile: hamburger, desktop: collapse/expand chevron)
2. Page title (Geist Sans, font-semibold, text-lg)
3. Breadcrumbs (on nested pages like Lead Detail) using shadcn Breadcrumb
4. --- spacer ---
5. Global search (shadcn CommandDialog, triggered by `Cmd+K` or search icon) -- searches leads by name/phone across all accessible leads
6. Presence indicator dot (green/gray) next to user's name -- confirms "the system sees you as online"

#### Real-Time Presence in Navigation

The sidebar shows a small "Team Online" section (Admin only) at the bottom, above the user footer:
- List of salesperson avatars with green/gray dots
- Collapsed sidebar: just dots stacked vertically
- This is powered by Convex presence -- updates in real-time without polling

### Mobile Navigation

On screens < 768px:
- Sidebar becomes a Sheet (shadcn Sheet, side="left") triggered by hamburger
- Top bar remains sticky
- Lead tables switch to card-based layouts (covered per-page below)

---

## Page 1: Login

### Page Purpose
Authenticate the user and route them to their role-specific workspace.

### User Arrives With...
**Mindset:** Task-oriented. They are starting their workday (morning login) or resuming after a break. They want to get to their leads immediately. No patience for friction.
**Emotion:** Neutral to slightly impatient. A login page is a gate, not a destination.
**Goal:** Get in. Now.

### The Attention Flow

1. **First 0.5s:** The SA Ventures logo + app name, centered. Confirms "I'm in the right place."
2. **First 1s:** The Clerk sign-in component, immediately below. No explanation needed.
3. **First 3s:** User is already typing their email or clicking Google/SSO.

### Component Map

```
Layout: Single centered column, max-w-sm, vertically centered on the page
Background: bg-background (white) with a subtle muted left panel (optional: 50/50 split on desktop)
```

**Option A -- Minimal (recommended):**
- Full white page
- SA Ventures logo (top center, 48px height)
- "SA CRM" text below logo (Geist Sans, text-2xl, font-bold)
- Clerk `<SignIn />` component directly below, no wrapper Card
- Role descriptor text below: `font-mono text-xs text-muted-foreground` -- "Sales Pipeline Management"

**Option B -- Split screen (if branding is important):**
- Left 50%: `bg-primary` panel with white SA Ventures logo, a one-line tagline, and a subtle pattern/texture
- Right 50%: Login form centered
- On mobile: left panel collapses to a small banner at top

**Recommendation:** Option A. This is an internal tool. Salespeople use it daily. They don't need to be sold on it. Get out of the way.

### Micro-Interactions

- **After successful auth:** Clerk handles redirect. Use Next.js middleware to route by role:
  - Admin -> `/admin`
  - Salesperson -> `/dashboard`
  - DSM -> `/dsm`
- **Loading state during auth:** The Clerk component handles its own loading. No additional skeleton needed.
- **Error state:** Clerk's built-in error messages are sufficient. Style them to match the design system via Clerk's `appearance` prop -- ensure `borderRadius: '0px'` and font overrides.

### Anti-Patterns to Avoid
- Do NOT add a "Welcome back!" message. It wastes vertical space on repeat visits.
- Do NOT show role selection. The role is determined by their Clerk account, not a UI choice.
- Do NOT add decorative illustrations. This is a tool login, not an onboarding page.

---

## Page 2: Admin Dashboard

### Page Purpose
Give the admin a 10-second pulse check on the entire sales operation, then get out of the way.

### User Arrives With...
**Mindset:** The admin is the operations manager. They open this page first thing in the morning asking: "Is everything running? Who's working? Are leads being followed up? Any problems?"
**Emotion:** Monitoring mode -- calm but scanning for anomalies. Like a pilot checking instruments before takeoff.
**Goal:** Spot problems fast. Then dive into whatever needs attention.

### The Attention Flow

1. **First 0.5s:** The stat cards at the very top -- four key numbers that answer "how's the machine running?"
2. **First 3s:** Eyes scan left-to-right across stat cards, then drop to the salesperson performance section
3. **First 10s:** Scan the presence indicators (who's online), glance at recent activity
4. **After that:** Use quick action buttons or navigate to specific sections

### Information Hierarchy

**Tier 1 -- The Numbers (top of page):**
Four stat cards in a horizontal row (grid cols-4, responsive to cols-2 on mobile).

```
shadcn/ui: Card component
Each card contains:
  - Label (text-xs text-muted-foreground uppercase tracking-wide)
  - Number (Geist Sans, text-3xl font-bold tabular-nums)
  - Trend indicator or sub-stat (text-xs, inline)
```

The four cards:
1. **Total Active Leads** -- number, with "+X today" in primary color
2. **Today's Follow-ups** -- number across all salespeople, with "X overdue" in destructive color if > 0
3. **Visits Scheduled** -- upcoming site visits (this week)
4. **Bookings This Month** -- conversions, the money number

**Why these four?** The admin's morning questions in order: "How much pipeline do we have?" "Are follow-ups being done?" "Are visits happening?" "Are we closing?"

**Tier 2 -- Salesperson Performance (middle of page):**

```
shadcn/ui: Card wrapping a custom grid of smaller cards (one per salesperson)
Layout: grid cols-3 (desktop), cols-2 (tablet), cols-1 (mobile)
```

Each salesperson card shows:
- **Name + avatar** (left aligned)
- **Presence dot** (green = online now, gray = offline, with "Last seen: 2h ago" tooltip)
- **Stat row:** Assigned | Contacted | Follow-ups Due | Conversions (this month)
- **Mini progress bar** showing contacted/assigned ratio (visual gut-check of who's working their leads)
- Click the card -> navigates to filtered lead view for that salesperson

**Why cards not a table?** At 5-10 salespeople, cards are scannable in a glance. A table forces line-by-line reading. Cards let the admin pattern-match visually -- the card with the red overdue count or the low progress bar jumps out.

**Tier 3 -- Recent Activity Feed + Quick Actions (bottom, two-column):**

Left column (wider, ~60%):
```
shadcn/ui: Card with ScrollArea inside
Title: "Recent Activity"
```
- Chronological feed of system-wide activity
- Each entry: `[Timestamp] [User avatar+name] [action verb] [entity link]`
- Example: `9:42 AM  Priya S.  changed status  Ramesh Kumar  New -> Follow Up`
- The entity name is a link (Button variant="link") that opens the lead detail
- Show last 20 entries, with "View All" link to full activity log page
- **Real-time:** New entries animate in from top with `animate-in fade-in slide-in-from-top-2 duration-300`

Right column (~40%):
```
shadcn/ui: Card
Title: "Quick Actions"
```
- **Import Leads** (Button, variant="default", full width, primary color) -- most common admin action
- **Create Project** (Button, variant="outline", full width)
- **Manage Users** (Button, variant="outline", full width)
- **Add Lead Manually** (Button, variant="outline", full width)

Each button has a HugeIcon on the left. The import button is primary because it is the most frequent admin action -- this is a CSV-driven workflow.

Below quick actions:
```
shadcn/ui: Card
Title: "Who's Online" (visible here AND in sidebar, but sidebar is compact)
```
- Simple list: avatar + name + green dot or "Offline -- last seen X"
- Online users sorted to top
- This doubles as attendance monitoring

### Micro-Interactions

- **Stat card hover:** Subtle `bg-muted` background transition. Cursor changes to pointer if clickable (leads card -> leads page, follow-ups card -> filtered follow-ups view).
- **Presence dots:** CSS animation -- green dots have a subtle `animate-pulse` (very slow, 3s cycle). This creates a "living" feel for the presence system.
- **Activity feed real-time update:** When a new activity arrives via Convex subscription, the new entry slides in from top. The feed doesn't jump -- the new entry pushes others down with a smooth `transition-transform`.
- **Stat number changes:** When a stat updates in real-time (e.g., a lead status changes), the number should briefly highlight -- apply primary color for 1 second, then fade back. Use `transition-colors duration-1000`.

### Delight Opportunities

1. **"Good morning, [Name]"** header text that changes based on time of day ("Good afternoon" after 12pm, "Good evening" after 6pm). Subtle, but signals the system is aware of you. Rendered in Geist Sans, text-lg, text-muted-foreground, above the stat cards.
2. **Zero-state stat cards:** If there are truly zero follow-ups overdue, show a checkmark icon and "All clear" instead of "0". Positive reinforcement.
3. **Salesperson card sort:** Default sort by "follow-ups overdue" descending -- the person who needs attention floats to the top. This is not alphabetical. Alphabetical is lazy. Problem-first sorting is useful.

### Anti-Patterns to Avoid
- Do NOT use a Kanban board for the admin dashboard. Kanban boards are for hands-on lead working, not overview monitoring.
- Do NOT show charts/graphs in Phase 1. Four numbers and a progress bar per salesperson communicate more than a chart at this scale.
- Do NOT make the activity feed the largest section. The admin checks activity for anomalies, not to read every entry.

---

## Page 3: Lead Management (Admin View)

### Page Purpose
Find, filter, and act on any lead in the system.

### User Arrives With...
**Mindset:** The admin is either (a) looking for a specific lead by name/phone, (b) reviewing a segment of leads (e.g., all "No Response" leads for a specific project), or (c) performing bulk operations (reassign, change status).
**Emotion:** Purposeful. They came here with a question or a task.
**Goal:** Find leads fast, understand their status at a glance, take action without navigating away.

### The Attention Flow

1. **First 0.5s:** The filter bar at the top -- immediately communicates "this is a searchable, filterable list"
2. **First 3s:** Eyes scan the table headers, then the first few rows of data
3. **First 10s:** Apply a filter or start searching, or click into a lead

### Component Map

**Top section -- Filter Bar:**

```
Layout: Horizontal flex bar, gap-2, flex-wrap on mobile
Sticky: yes, sticks below the top bar on scroll
Background: bg-background with bottom border, creates visual separation from table
```

Components (left to right):
1. **Search input** (shadcn Input, with HugeIcon `Search01Icon` as prefix) -- placeholder: "Search name or phone..." -- `w-64`
2. **Project filter** (shadcn Select or Combobox) -- "All Projects" default
3. **Status filter** (shadcn Select, multi-select via Popover + checkboxes) -- "All Statuses" default
4. **Salesperson filter** (shadcn Select) -- "All Salespeople" default
5. **Date range** (shadcn DatePicker with range mode) -- for filtering by created date or follow-up date
6. --- spacer ---
7. **Bulk actions dropdown** (shadcn DropdownMenu on a Button variant="outline") -- "Actions" label, appears when rows are selected. Contains: Reassign, Change Status, Export
8. **Column visibility toggle** (shadcn DropdownMenu, icon-only button with `ViewIcon`)

**Why this filter arrangement?** The most common filter is by project (the admin often thinks in project terms: "show me all leads for Project X"). Status is the second most common filter. Search is always visible because "find this one person" is a constant need.

**Main section -- Data Table:**

```
shadcn/ui: DataTable (built on TanStack Table)
Columns: Checkbox | Name | Phone | Project | Status | Assigned To | Follow-up | Last Remark | Updated
```

Column details:
- **Checkbox:** For bulk selection. Header checkbox for select-all (on current page)
- **Name:** `font-medium`. Clickable -- opens lead detail in a Sheet (slide-over panel, NOT a new page)
- **Phone:** `text-muted-foreground font-mono` (already mono, but explicitly styled for number legibility). Click to copy (toast confirmation)
- **Project:** Badge-style display using shadcn Badge variant="outline"
- **Status:** shadcn Badge with color coding:
  - New: `bg-blue-50 text-blue-700 border-blue-200`
  - No Response: `bg-yellow-50 text-yellow-700 border-yellow-200`
  - Follow Up: `bg-orange-50 text-orange-700 border-orange-200`
  - Visit Scheduled: `bg-purple-50 text-purple-700 border-purple-200`
  - Visit Done: `bg-indigo-50 text-indigo-700 border-indigo-200`
  - Booking Done: `bg-emerald-50 text-emerald-700 border-emerald-200`
  - Closed Won: `bg-green-50 text-green-700 border-green-200`
  - Closed Lost: `bg-red-50 text-red-700 border-red-200`
  - Not Interested: `bg-gray-50 text-gray-700 border-gray-200`
  - Other Requirement: `bg-amber-50 text-amber-700 border-amber-200`
- **Assigned To:** Salesperson name, truncated with tooltip
- **Follow-up:** Date, with visual treatment:
  - Overdue: `text-destructive font-medium` (red)
  - Today: `text-primary font-medium` (warm red/orange, draws eye)
  - Future: `text-muted-foreground` (low visual priority)
  - None: em dash `--`
- **Last Remark:** Truncated to ~40 chars, tooltip shows full text. `text-muted-foreground text-xs`
- **Updated:** Relative time ("2h ago", "yesterday"). `text-muted-foreground text-xs`

**Row interaction:**
- Hover: `bg-muted/50` background
- Click anywhere on row (except checkbox and phone): Opens lead detail Sheet
- Right-click: Context menu (shadcn ContextMenu) with Quick Status Change, Reassign, Copy Phone

**Pagination:**
```
shadcn/ui: Pagination component
Position: Bottom of table, sticky to bottom of viewport on long tables
Show: "Showing 1-25 of 342 leads" + page controls
Page size selector: 25 | 50 | 100
```

### Lead Detail as Sheet (Slide-Over Panel)

```
shadcn/ui: Sheet, side="right", width ~50% of viewport (min 480px, max 640px)
```

This is the critical design decision for lead management: **lead detail opens as a Sheet, not a full page navigation.** Why:
1. The admin often needs to check a lead, update it, and return to the table. Full page navigation breaks flow.
2. The table remains visible behind the sheet (dimmed), maintaining spatial context.
3. Multiple leads can be checked in sequence -- close sheet, click next row, new sheet opens.

The Sheet content is the same as the Lead Detail View (Page 8 below), but in a narrower layout.

### Micro-Interactions

- **Search:** Debounced at 300ms. Shows inline "Searching..." indicator. Results filter the table in real-time (Convex query re-runs).
- **Filter changes:** Instant table update. No "Apply Filters" button -- every filter change immediately queries. Show a subtle loading bar at top of table during re-query.
- **Bulk selection:** When 1+ rows are selected, a floating action bar appears at the bottom of the screen (above pagination). Shows: "X leads selected" + action buttons (Reassign, Change Status). This pattern avoids hiding actions in a dropdown that users might miss.
- **Column sorting:** Click header to sort. Active sort column gets a chevron icon. Sortable columns: Name, Status, Follow-up date, Updated.
- **Phone click-to-copy:** On click, phone number copies to clipboard. A shadcn Sonner toast appears: "Phone number copied". Brief, non-blocking.
- **Real-time updates:** If another user changes a lead's status while the admin is viewing the table, the row's status badge updates live. A brief highlight animation (background flash) draws attention to the changed row.

### Empty State

If filters return zero results:
```
Centered in table area:
HugeIcon: Search01Icon (size 48, text-muted-foreground)
"No leads match your filters"
"Try adjusting your search or filters"
Button: "Clear all filters" (variant="outline", size="sm")
```

### Anti-Patterns to Avoid
- Do NOT use infinite scroll. Salespeople need to know "how many total leads match this filter." Pagination gives that context.
- Do NOT hide the search behind a button click. It must be always visible.
- Do NOT open lead details as a new page. The Sheet pattern keeps context.
- Do NOT show every possible column by default. Start with the essential 9 columns listed above. Let users toggle others via column visibility.

---

## Page 4: CSV Import Flow

### Page Purpose
Turn a raw CSV file into allocated, assigned leads in under 2 minutes.

### User Arrives With...
**Mindset:** The admin just received a CSV export from 99acres (or a similar portal). They want to get these leads into the system and distributed to salespeople NOW. This is time-sensitive -- fresh leads convert better.
**Emotion:** Urgency mixed with mild anxiety. "Will the system parse this correctly? Will the allocation be fair?"
**Goal:** Upload -> verify it looks right -> confirm allocation -> done. Minimal thinking.

### The Attention Flow

This is a **multi-step wizard**, not a single page. The user should always know: where am I in the process, what just happened, and what's next.

```
shadcn/ui: Stepper pattern (custom, using a horizontal step indicator at top)
Steps: 1. Upload  ->  2. Preview & Map  ->  3. Allocate  ->  4. Confirm
```

The step indicator is a horizontal bar at the top of the content area:
- Each step: number + label
- Completed steps: primary color background, white text, checkmark replaces number
- Current step: primary color border, primary color text
- Future steps: muted border, muted text
- Steps are connected by a horizontal line that fills with primary color as progress advances

#### Step 1: Upload

```
Layout: Centered card, max-w-lg
```

**Component:** A drag-and-drop zone.
- Large dashed border area (border-2 border-dashed border-muted-foreground/25)
- HugeIcon: `FileUploadIcon` centered, size 48
- "Drag and drop your CSV or Excel file" (text-muted-foreground)
- "or" divider
- Button: "Browse Files" (variant="outline")
- Below: "Supports .csv and .xlsx files from 99acres, MagicBricks, and manual exports" (text-xs text-muted-foreground)

**Project selection:** Below the upload zone:
```
shadcn/ui: Select component
Label: "Assign to Project"
Required before proceeding
```

The project must be selected BEFORE upload so the system knows the context.

**Micro-interaction:** On file drop, the border animates to `border-primary`, the icon changes to a spinning loader, and text changes to "Parsing [filename]..." Then auto-advances to Step 2.

#### Step 2: Preview and Column Mapping

```
Layout: Full width card
```

**Top section:** File summary
- "Found X rows in [filename]" (Geist Sans, font-semibold)
- If any rows had parsing errors: yellow Alert component (shadcn Alert, variant implied by yellow styling with custom classes) -- "X rows could not be parsed and will be skipped"

**Column mapping table:**
```
shadcn/ui: Table (simple, not DataTable -- this is a mapping UI, not data browsing)
```

| CSV Column Header | Sample Data (first row) | Maps To |
|---|---|---|
| "Contact Person" | "Ramesh Kumar" | [Select: Name] |
| "Mobile" | "9876543210" | [Select: Phone] |
| "Email" | "r.kumar@..." | [Select: Email] |
| "Budget" | "40-50 Lakhs" | [Select: Budget] |

- Each "Maps To" cell is a shadcn Select with options: Name, Phone, Email, Budget, Source, Notes, -- Skip --
- **Auto-detection:** For known formats (99acres), the system pre-fills mappings. The admin just confirms.
- Unmapped columns default to "-- Skip --" in muted text
- Required fields (Name, Phone) have a red asterisk. If unmapped, the "Next" button is disabled with a tooltip explaining why.

**Preview rows:** Below the mapping table, show a preview of the first 5 parsed leads as they will appear in the system. This gives confidence that the mapping is correct.

```
shadcn/ui: Table
Columns match the lead schema: Name | Phone | Email | Budget | Source
5 rows of preview data
```

**Footer:** "Back" button (variant="outline") | "Next: Allocate" button (variant="default")

#### Step 3: Allocate (Round-Robin)

This is the most important step. The admin needs to see and control how leads are distributed.

```
Layout: Two-panel -- left panel (salesperson list), right panel (allocation preview)
On mobile: stacked vertically
```

**Left panel -- Salesperson Availability:**
```
shadcn/ui: Card with a list of salesperson rows
Title: "Available Salespeople"
```

Each row:
- Checkbox (shadcn Checkbox) -- checked = included in round-robin
- Avatar + Name
- Presence dot (online/offline)
- Current lead count: "42 leads" (text-muted-foreground) -- so the admin can see if someone is already overloaded
- Toggle is ON by default for all available salespeople. Admin unchecks to exclude.

**Right panel -- Allocation Preview:**
```
shadcn/ui: Card
Title: "Allocation Preview"
Subtitle: "X leads will be distributed across Y salespeople"
```

A summary showing:
| Salesperson | Current Leads | New Leads | Total After Import |
|---|---|---|---|
| Priya S. | 42 | 8 | 50 |
| Rahul M. | 38 | 8 | 46 |
| Amit K. | 45 | 7 | 52 |

The "New Leads" column is editable -- the admin can manually override the count. When they change one, others auto-adjust to maintain the total (or a warning appears if the total doesn't match).

Below the summary:
- "Round-robin distributes leads evenly. Adjust manually if needed." (text-xs text-muted-foreground)

**Override capability:** The admin can also click "View Individual Assignments" to expand a full list where each lead row shows its assigned salesperson, with a Select to change it. This is a Collapsible section (shadcn Collapsible) -- hidden by default because most imports don't need per-lead adjustment.

**Footer:** "Back" button | "Next: Confirm" button

#### Step 4: Confirm

```
Layout: Centered card, max-w-lg
```

**Summary:**
- "Ready to import X leads into [Project Name]"
- "Distributed across Y salespeople"
- Brief breakdown: "Priya S.: 8, Rahul M.: 8, Amit K.: 7"

**Big confirm button:**
```
shadcn/ui: Button variant="default" size="lg", full width
Label: "Import X Leads"
```

**After clicking:** Button enters loading state (spinner + "Importing..."). This is NOT instant -- the Convex mutation creates all leads, activity logs, etc. Show a progress indicator if possible, or at minimum a loading state.

**Success state:** The card transforms to a success message:
- HugeIcon: `CheckmarkCircle01Icon` in green (size 48)
- "X leads imported successfully"
- "Assigned to Y salespeople in [Project Name]"
- Two buttons: "View Leads" (variant="default") | "Import More" (variant="outline")

### Delight Opportunities

1. **Auto-detect format:** If the CSV headers match 99acres format exactly, show a green badge: "99acres format detected -- columns mapped automatically". This saves the admin from manually mapping every time.
2. **Running total in stepper:** As the admin progresses, the step indicator subtitle updates: Step 1 shows file name, Step 2 shows "42 leads mapped", Step 3 shows "distributed to 3 salespeople".
3. **Confetti is wrong here. But a checkmark animation is right.** On the success screen, the checkmark icon draws itself (SVG path animation) rather than popping in. Subtle motion that says "done, properly."

### Anti-Patterns to Avoid
- Do NOT allow import without project selection. Every lead must belong to a project.
- Do NOT hide the allocation step. Even if round-robin is automatic, the admin MUST see and approve the distribution.
- Do NOT use a generic file upload component that shows the file in a list after upload. The file should be parsed immediately and the user advanced to preview.
- Do NOT show all rows in preview. Five rows is enough for validation. Showing 500 rows overwhelms and slows the page.

---

## Page 5: Project Management

### Page Purpose
Create and configure the real estate projects that leads are organized around.

### User Arrives With...
**Mindset:** The admin is either (a) setting up a new project that just launched, or (b) updating an existing project's details or creatives. This is administrative housekeeping, not daily work.
**Emotion:** Methodical. This is setup work, done occasionally.
**Goal:** Create a project with all necessary info, upload marketing materials so salespeople can access them.

### The Attention Flow

1. **First 0.5s:** The project list/grid. "Here are my projects."
2. **First 3s:** Scan project names, see which are active, spot the "New Project" button
3. **First 10s:** Click into a project to edit, or click "New Project"

### Component Map

**Project List View:**

```
Layout: Grid of Cards (cols-3 desktop, cols-2 tablet, cols-1 mobile)
```

Each project card (shadcn Card):
- **Project name** (font-semibold, text-base, Geist Sans)
- **Location** (text-sm text-muted-foreground)
- **Price range** (font-mono, text-sm)
- **Status badge** (shadcn Badge): Active (green-tinted) or Archived (gray)
- **Lead count:** "X leads" (text-xs text-muted-foreground)
- **Thumbnail:** If creatives are uploaded, show first image as card header (aspect-video, object-cover). If none, show a placeholder with the project's first letter in a large muted style.

Top of page:
- **"New Project" button** (variant="default") in the top-right corner of the page (within the top bar area, right-aligned)
- **Toggle:** "Show archived" switch (shadcn Switch) to include/exclude archived projects

**Project Create/Edit Form:**

Opens as a Dialog (shadcn Dialog) for creation, or navigates to a detail page for editing (because editing includes the creatives gallery which needs more space).

```
shadcn/ui: Dialog for create, full page for edit
```

**Create Dialog fields:**
- Project Name (Input, required)
- Description (Textarea, optional)
- Location (Input, required)
- Price Range (Input, placeholder: "40L - 60L")
- Status (Select: Active / Archived, default Active)
- Footer: "Cancel" | "Create Project"

**Edit Page layout:**

Two sections, stacked:

**Section 1: Project Details**
```
shadcn/ui: Card
```
- Same fields as create, pre-filled
- "Save Changes" button (variant="default") -- only enabled when something changed (track dirty state)

**Section 2: Creatives Gallery**
```
shadcn/ui: Card
Title: "Marketing Materials"
Subtitle: "Images and brochures that salespeople can browse and share with clients"
```

- **Upload zone:** Drag-and-drop area (same pattern as CSV import, but for images/PDFs)
- **Gallery grid:** `grid cols-4 gap-4` (desktop)
  - Images: thumbnail with aspect-square, object-cover
  - PDFs/brochures: file icon + filename
  - Each item has a hover overlay with: "Preview" (eye icon) | "Delete" (trash icon, with confirmation Dialog)
- **Image preview:** Clicking an image opens it in a Dialog with a larger view
- File types accepted: .jpg, .jpeg, .png, .webp, .pdf
- Max file size note: "Max 10MB per file" (text-xs text-muted-foreground)

### Micro-Interactions

- **Card hover:** Shadow increases subtly (`shadow-sm` -> `shadow-md`), border gains slight primary tint
- **Archive toggle:** When archiving a project, show a confirmation Dialog: "Archive [Project Name]? Leads in this project will remain accessible but no new leads can be imported."
- **Creative upload:** On drop, show upload progress bar per file. Files appear in gallery immediately with a loading overlay until upload completes.
- **Reorder creatives:** Drag-to-reorder in the gallery (nice-to-have for Phase 1, not critical)

### Anti-Patterns to Avoid
- Do NOT make projects overly complex. In real estate, a project is basically: name, location, price range, and marketing materials. Don't over-engineer the entity.
- Do NOT use tabs for project details vs. creatives. Vertical stacking is simpler and the page isn't long enough to warrant tabs.

---

## Page 6: User Management

### Page Purpose
Control who can access the system and what they can do.

### User Arrives With...
**Mindset:** The admin is either onboarding a new team member, adjusting someone's availability (e.g., marking someone as unavailable for round-robin because they're on leave), or reviewing the team roster.
**Emotion:** Administrative. This is maintenance work.
**Goal:** Add user / toggle availability / review the team.

### The Attention Flow

1. **First 0.5s:** The user list. "Here's my team."
2. **First 3s:** Scan names, roles, availability status
3. **First 10s:** Find the person they need to modify, or click "Add User"

### Component Map

**Layout:** Simple table view. Users are not numerous enough (typically 5-20) to need complex filtering.

```
shadcn/ui: DataTable (lightweight, no pagination needed at this scale)
```

**Top bar:**
- **"Add User" button** (variant="default")
- **Role filter** (shadcn Select): All | Admin | Salesperson | DSM

**Table columns:**
| Name | Email | Phone | Role | Available | Online | Actions |
|---|---|---|---|---|---|---|
| Avatar + Name | email | phone | Badge (color-coded by role) | Switch | Presence dot + "Last seen X" | DropdownMenu |

Column details:
- **Role badge colors:** Admin = primary/red-tinted, Salesperson = blue-tinted, DSM = gray
- **Available switch** (shadcn Switch): Only shown for Salespeople. Toggles whether they receive round-robin assignments. Inline -- no confirmation needed. Immediate Convex mutation.
- **Online:** Green dot = online now. Gray dot + relative timestamp = offline.
- **Actions:** shadcn DropdownMenu with: Edit User, Deactivate (soft delete -- not actual deletion)

**Add/Edit User Dialog:**

```
shadcn/ui: Dialog
```

Fields:
- Name (Input, required)
- Email (Input, required, used for Clerk invite)
- Phone (Input, required)
- Role (Select: Admin / Salesperson / DSM, required)
- Note: "An invitation email will be sent to this address" (text-xs text-muted-foreground)

Footer: "Cancel" | "Create User" (variant="default")

For editing: same Dialog, fields pre-filled. Footer: "Cancel" | "Save Changes"

### Micro-Interactions

- **Availability toggle:** On toggle, the switch animates. If turning OFF, the salesperson's row gets a subtle muted background (`bg-muted/30`) to visually communicate "this person is inactive for allocation." No confirmation dialog -- this is a frequent, low-risk action.
- **Presence updates:** Dots update in real-time via Convex presence subscriptions. When someone comes online, the dot transitions from gray to green with a brief scale animation.

### Anti-Patterns to Avoid
- Do NOT use a grid/card layout for users. A table is more efficient for scanning a roster.
- Do NOT require email verification before the user appears in the system. Create them immediately and let Clerk handle the invitation flow.
- Do NOT show delete buttons prominently. User deletion should be a deactivation buried in the actions menu, with a confirmation dialog that explains consequences.

---

## Page 7: Salesperson Dashboard

### Page Purpose
Show the salesperson exactly what they need to do RIGHT NOW, then make it effortless to do it.

### User Arrives With...
**Mindset:** This is a salesperson starting their day. They open the CRM and think: "Who do I need to call today?" They may also check this page mid-day between calls to plan their next action.
**Emotion:** Task-oriented with a hint of pressure. They have targets. They want to feel on top of things, not overwhelmed.
**Goal:** See today's follow-ups, work through them one by one, update lead statuses as they make calls.

### The Attention Flow

This is the most important page in the entire CRM. Everything about it must serve the workflow: **see lead -> call -> update -> next lead**.

1. **First 0.5s:** Today's Follow-ups count -- a large, prominent number or section header that instantly tells them "you have X calls to make today"
2. **First 3s:** The follow-up cards/list below that count, showing the actual leads they need to call
3. **First 10s:** They click the first follow-up, make the call, update the status
4. **Ongoing:** They work through follow-ups, then switch to "My Leads" tab for broader pipeline work

### Information Hierarchy

**Tier 1 -- Today's Follow-Ups (TOP of page, 50%+ of initial viewport):**

This is THE section. It occupies the top half of the screen. Everything else is secondary.

```
Section header (Geist Sans):
"Today's Follow-Ups" + count badge (shadcn Badge, variant="default", showing "5")
Below: "X overdue" in text-destructive if any exist
```

**Follow-up cards layout:**
```
Layout: Vertical stack of cards (NOT a table -- cards allow more action density per row)
shadcn/ui: Card for each follow-up lead
```

Each follow-up card:
```
| [Status Badge]  Lead Name                    Phone: 98765 43210  [Call button] |
|  Project Name  |  Last remark: "Interested in 2BHK, asked for..."             |
|  Follow-up: Today 2:00 PM (or "OVERDUE - 2 days" in red)    [Quick Actions v] |
```

Detailed card anatomy:
- **Left edge:** 3px left border colored by urgency:
  - Overdue: `border-l-destructive` (red)
  - Due today: `border-l-primary` (warm red/orange)
  - Scheduled for later today: `border-l-yellow-500`
- **Top row:** Status badge (small, outline) | Lead name (font-medium) | Phone number (font-mono text-muted-foreground) | "Copy" icon button (ghost, tiny)
- **Middle row:** Project name (text-xs Badge outline) | Last remark preview (text-xs text-muted-foreground, truncated)
- **Bottom row:** Follow-up time | Quick action buttons:
  - **"Mark Called"** (Button, variant="outline", size="xs") -- opens a compact inline form: status select + remark textarea + next follow-up date. This is the #1 action.
  - **"Reschedule"** (Button, variant="ghost", size="xs") -- opens DatePicker popover to change follow-up date
  - **"View Details"** (Button, variant="ghost", size="xs") -- opens lead detail Sheet

**Sorting:** Overdue first (sorted by how many days overdue, descending), then today's sorted by follow-up time ascending. This ensures the most urgent lead is always at the top.

**Zero-state:** If no follow-ups today:
```
Centered in the section:
HugeIcon: CheckmarkCircle01Icon (size 48, text-green-600)
"All caught up for today"
"No follow-ups scheduled. Check your leads below for pipeline activity."
```

**Tier 2 -- Quick Stats Bar (between follow-ups and leads table):**

```
Layout: Horizontal flex bar with 4 stat pills (inline, not cards)
Background: bg-muted, py-3, px-4
```

Four stats, horizontally:
- **My Active Leads:** [number]
- **New (Uncontacted):** [number] -- if > 0, shown in primary color to signal "these need first contact"
- **Visits This Week:** [number]
- **Conversions (Month):** [number]

These are NOT clickable cards. They are context -- ambient awareness of your pipeline. Small, compact, data-dense. The monospace font makes these numbers feel precise and trustworthy.

**Tier 3 -- My Leads Table (below stats):**

```
shadcn/ui: Tabs (above the table) for quick filtering:
  Tab 1: "All" (default)
  Tab 2: "New" (uncontacted leads needing first call)
  Tab 3: "Follow-ups" (all leads with upcoming follow-ups)
  Tab 4: "Active" (visit scheduled, visit done, booking stages)
  Tab 5: "Closed"
```

```
shadcn/ui: DataTable
Columns: Name | Phone | Project | Status | Follow-up | Last Remark | Updated
```

Same column treatment as the Admin lead table, minus the "Assigned To" column (all leads are theirs) and minus the checkbox column (no bulk actions for salespeople).

**Row click:** Opens lead detail as a Sheet (same as admin view).

**Search:** Input above the table, same debounced search pattern.

### Key Interaction: The "Quick Update" Flow

This is the most repeated interaction in the entire CRM. A salesperson makes a call, then needs to log the outcome. This MUST be fast -- under 10 seconds from "I just hung up" to "status updated, remark saved, next follow-up set."

**Trigger:** "Mark Called" button on follow-up card, OR status badge click in the table, OR a keyboard shortcut (nice-to-have).

**UI:** A Popover (shadcn Popover) or inline expansion on the follow-up card. NOT a Dialog -- dialogs feel heavy for a 10-second interaction.

```
The card expands downward (animate-in, slide-in-from-top, duration-200) to reveal:

| New Status: [Select: No Response / Follow Up / Visit Scheduled / ...]  |
| Remark:    [Textarea, 2 rows, placeholder "What happened on the call?"] |
| Next Follow-up: [DatePicker, only shown if status = "Follow Up"]       |
| [Cancel] [Save]                                                         |
```

**After save:** The card animates:
- If status changed to a non-follow-up status (e.g., Visit Scheduled), the card shrinks and fades out of the follow-up list with `animate-out fade-out slide-out-to-right duration-300`. The list re-stacks. Satisfying -- "I handled that one."
- If rescheduled, the card updates in place (new date appears, brief highlight).
- A Sonner toast confirms: "Lead updated" with an "Undo" link (undo reverts the status change for 5 seconds).

### Micro-Interactions

- **Follow-up card urgency animation:** Overdue cards have a very subtle, slow pulse on their left border color. Not aggressive -- just enough to keep them feeling "active" compared to the calm on-time cards.
- **Progress feeling:** As the salesperson works through follow-ups, the count in the section header decrements in real-time. Going from "5" to "0" should feel like clearing a to-do list. Consider a subtle progress bar under the section header showing X/total completed today.
- **Phone number interaction:** On the follow-up card, tapping/clicking the phone number copies it and shows a brief toast. On mobile, it could open the phone dialer via `tel:` link.
- **Real-time lead updates:** If the admin reassigns a lead or changes something, it appears/disappears from the salesperson's view with smooth animation. A Sonner toast explains: "Lead [Name] was reassigned to you by [Admin]" or "Lead [Name] was reassigned to another salesperson."

### Delight Opportunities

1. **"X leads worked today" counter** in the stats bar that increments as the salesperson updates statuses. Gamification-lite -- not a leaderboard, just personal progress tracking.
2. **Keyboard navigation:** Power users should be able to press `j`/`k` to navigate follow-up cards, `Enter` to expand the quick update form, `Tab` through fields, `Enter` to save. This turns the CRM into a keyboard-driven instrument.
3. **Time-aware greeting + context:** The header says "Good morning, Priya" and underneath: "You have 5 follow-ups today and 3 new leads to contact." One sentence that tells the full story.

### Anti-Patterns to Avoid
- Do NOT show a Kanban board as the default view. Kanban implies drag-and-drop status management which is slower than the quick-update popover for phone-call-driven workflows.
- Do NOT bury follow-ups in a table. Follow-ups are the primary job -- they deserve card-level prominence.
- Do NOT require navigating to a separate page to update a lead status. The quick-update flow must be inline.
- Do NOT show other salespeople's stats or leads. This is a personal workspace.

---

## Page 8: Lead Detail View

### Page Purpose
Show everything about one lead and make it easy to take the next action on that lead.

### User Arrives With...
**Mindset:** The user (salesperson or admin) just clicked a lead from a table or follow-up card. They need context before (or right after) a call: Who is this person? What happened last time? What's their project interest? What should I do next?
**Emotion:** Focused on this one person. They may have the phone ringing or just hung up.
**Goal:** Understand lead context quickly, update status/remarks, schedule next step, maybe send marketing materials.

### The Attention Flow

1. **First 0.5s:** Lead name + current status at the top. "Who is this and where are they in the pipeline?"
2. **First 2s:** Phone number, project, follow-up date -- the actionable info
3. **First 5s:** Scan recent remarks -- "what was our last interaction?"
4. **After that:** Update status, add remark, schedule follow-up, browse creatives

### Component Map

**Container:** shadcn Sheet (side="right") when opened from a table, OR a full page at `/leads/[id]` when accessed via direct link or deep navigation. The content is identical; only the container changes.

**Layout inside the Sheet/Page:**

```
Vertical stack of sections, separated by borders (border-b border-border)
No tabs at this level -- everything scrolls vertically
The Sheet has a ScrollArea wrapping all content
```

**Section 1: Lead Header (sticky at top of Sheet)**

```
Height: auto, but compact
Background: bg-background, border-b, sticky top-0 z-10
```

- **Lead name** (Geist Sans, text-xl, font-bold)
- **Status badge** (large size, colored as defined in lead management) -- clickable to change status (opens a Select Popover inline)
- **Phone number** (font-mono, text-lg) with copy button and `tel:` link icon
- **Email** (if exists, text-sm text-muted-foreground) with copy button
- **Project name** badge (outline)
- **Assigned to:** [Salesperson name] (admin sees this; salesperson doesn't since it's always them)
- **Source:** "99acres" / "DSM: [name]" / "Manual" (text-xs text-muted-foreground)

The header is sticky so that the lead's identity and status are always visible while scrolling through remarks.

**Section 2: Quick Actions Bar**

```
Layout: Horizontal flex bar, gap-2
Background: bg-muted/50, py-3, px-4
```

Buttons:
1. **"Update Status"** (Button, variant="default", size="sm") -- opens status change Dialog with remark + follow-up fields
2. **"Add Remark"** (Button, variant="outline", size="sm") -- focuses the remark input in Section 3
3. **"Schedule Follow-up"** (Button, variant="outline", size="sm") -- opens DatePicker
4. **"Schedule WhatsApp"** (Button, variant="outline", size="sm") -- opens the WhatsApp scheduling Dialog (Phase 1 mock)
5. **"View Creatives"** (Button, variant="ghost", size="sm") -- scrolls to creatives section or opens a sub-Sheet

**Why a dedicated action bar?** Because after every call, the salesperson needs to take one of these 4 actions. Putting them in a toolbar that's always visible (just below the sticky header) means zero hunting.

**Section 3: Remarks Timeline**

This is the heart of the lead detail. Every interaction is recorded here.

```
Layout: Vertical timeline
```

**Add remark input (top of timeline, always visible):**
```
shadcn/ui: Textarea (2 rows, auto-expand to 5)
Placeholder: "Add a remark about this lead..."
Below: Button "Save Remark" (variant="default", size="sm") + keyboard hint "Cmd+Enter" (text-xs text-muted-foreground)
```

**Timeline entries:**
Each remark/activity is a timeline node:

```
[Timestamp]  [User name]
[Content/Description]
---
```

Visual treatment:
- Left side: vertical line (border-l-2 border-muted) connecting all entries
- Each entry has a small dot on the line:
  - Remark entries: filled dot (bg-foreground)
  - Status change entries: colored dot matching the new status
  - System entries (assignment, import): hollow dot (border only)
- **Remark content:** Normal text, preserving line breaks
- **Status changes:** "[User] changed status from [Old] to [New]" with both statuses shown as inline badges
- **Follow-up changes:** "[User] scheduled follow-up for [Date]"
- Timestamps: relative ("2 hours ago") with full date/time in tooltip

**Sorting:** Newest first. The most recent interaction is at the top, right below the input.

**Section 4: Lead Details (collapsible)**

```
shadcn/ui: Collapsible, default open
Title: "Details"
```

A simple key-value list:
- Budget: [value]
- Source: [value]
- Created: [date]
- Last Updated: [date]
- Follow-up Date: [date or "None"]
- Submitted By: [DSM name, if applicable]

This section is less important than remarks -- hence collapsible and placed lower.

**Section 5: Project Creatives (collapsible)**

```
shadcn/ui: Collapsible, default collapsed
Title: "Marketing Materials for [Project Name]"
```

- Grid of creative thumbnails (same as project management gallery, but read-only for salespeople)
- Click to preview in Dialog
- "Share" button concept (Phase 1: copies a link or opens WhatsApp compose concept)
- This exists so salespeople can quickly pull up brochures/images during a call without navigating away

**Section 6: WhatsApp Scheduling (Phase 1 Mock)**

```
shadcn/ui: Dialog triggered from Quick Actions bar
Title: "Schedule WhatsApp Message"
```

Fields:
- **To:** Pre-filled with lead's phone number (read-only)
- **Message:** Textarea with template suggestions (e.g., "Hi [Name], following up on your interest in [Project]...")
- **Schedule for:** DatePicker + TimePicker
- **Note:** Alert component -- "WhatsApp integration is coming soon. Messages will be queued and sent once the integration is active."
- Footer: "Cancel" | "Schedule Message" (saves to scheduledMessages table in "pending" status)

Below the dialog trigger in the actions bar, if there are pending messages, show: "1 message queued" (text-xs text-muted-foreground with a clock icon)

### Micro-Interactions

- **Status change:** When the status badge is clicked and a new status is selected, the badge color transitions smoothly. If the status requires a follow-up date (Follow Up status), a DatePicker appears inline immediately -- no extra click needed.
- **Remark save:** On save, the new remark entry appears at the top of the timeline with `animate-in fade-in slide-in-from-top-2`. The textarea clears and blurs. Sonner toast: "Remark saved."
- **Cmd+Enter to save remark:** Power user shortcut. The keyboard hint below the textarea teaches this.
- **Timeline lazy loading:** If a lead has 50+ remarks, load the first 20 and show "Load earlier activity" button at the bottom.
- **Sticky header scroll behavior:** As the user scrolls down through remarks, the header compresses slightly (name stays, but secondary info like email hides) to maximize content space.

### Anti-Patterns to Avoid
- Do NOT use tabs to separate remarks from activity log from details. Tabs hide information and add clicks. A vertical scroll with collapsible sections shows everything in context.
- Do NOT put the remark input at the bottom of the timeline. The user should not have to scroll past 30 remarks to add a new one.
- Do NOT require a Dialog to add a simple remark. The textarea is inline, always visible, always ready.
- Do NOT show the full activity log interleaved with remarks by default. Remarks are the human context; activity logs are system context. Show remarks prominently; interleave activity entries in the timeline with muted styling so they're distinguishable.

---

## Page 9: DSM Dashboard

### Page Purpose
Let a third-party agent submit a lead and check its status. Nothing more.

### User Arrives With...
**Mindset:** The DSM (Direct Sales Manager / third-party agent) has encountered a potential buyer. They want to log this lead and move on. They might also check back later to see if their submitted leads are progressing (which affects their commission in future phases).
**Emotion:** Transactional. This is a quick in-and-out task. They are not living in this CRM all day.
**Goal:** Add a lead in under 30 seconds. Optionally check status of previous submissions.

### The Attention Flow

1. **First 0.5s:** The "Add Lead" form, prominently placed
2. **First 3s:** They're already filling in the name field
3. **After submission:** They see the confirmation, maybe glance at their submissions list

### Component Map

**Layout:** Single column, centered, max-w-2xl. This is the simplest page in the entire CRM. It should feel fast and minimal.

No sidebar needed. Use a minimal top bar with logo + user name + sign out. The DSM has so few pages that a sidebar is overhead.

Actually -- for consistency, use the same sidebar shell but with only 2 items (Dashboard, My Submissions). It keeps the architectural pattern consistent and is zero extra effort in implementation.

**Section 1: Add Lead Form (top, primary)**

```
shadcn/ui: Card (border, prominent)
Title: "Submit a New Lead" (Geist Sans, text-lg, font-semibold)
```

Fields (vertical stack):
1. **Name** (Input, required, autofocus on page load)
2. **Mobile Number** (Input, required, type="tel", pattern validation for 10-digit Indian mobile)
3. **Project Interest** (Select, required, lists all active projects)
4. **Notes** (Textarea, optional, 2 rows, placeholder: "Any additional details about the lead...")

Footer:
- "Submit Lead" (Button, variant="default", size="lg", full width)

**Validation:**
- Name: required, min 2 characters
- Mobile: required, 10 digits, numeric only. Show error inline: "Enter a valid 10-digit mobile number"
- Project: required

**After submit:**
- Button enters loading state briefly
- On success: Form fields clear. A success banner appears above the form (shadcn Alert with green styling):
  - "Lead submitted successfully! [Name] has been added to [Project Name]."
  - The banner auto-dismisses after 5 seconds, or can be closed manually
- Form is immediately ready for the next submission (autofocus returns to Name field)

**Why not a toast for success?** Because the DSM might submit several leads in a row. A toast disappears. An inline banner above the form confirms the last submission while the DSM fills in the next one. They can see at a glance: "yes, that last one went through."

**Section 2: My Submissions (below form)**

```
shadcn/ui: Card
Title: "My Submissions" + count badge
```

**Table (shadcn DataTable, simple):**
| Lead Name | Phone | Project | Status | Submitted |
|---|---|---|---|---|
| Ramesh Kumar | 98765 43210 | Sunrise Heights | Follow Up | 2 days ago |
| Priya Mehta | 87654 32109 | Green Valley | New | 5 hours ago |

- Status column uses the same color-coded badges as everywhere else
- Sorted by submitted date, newest first
- No row click action (DSM cannot view lead details beyond this)
- Pagination only if > 25 submissions

**The DSM sees status but NOT:**
- Who the lead is assigned to
- Remarks or activity history
- The ability to modify anything about the lead

### Micro-Interactions

- **Form submission:** The submit button shows a brief spinner (200-300ms), then the success banner slides in from top with `animate-in fade-in slide-in-from-top-2`.
- **Status updates in table:** If a lead's status changes while the DSM is viewing the page, the badge updates with a brief color transition. The DSM sees their leads progressing through the pipeline in real-time -- this builds trust.
- **Phone validation:** As the user types the phone number, show a green checkmark icon inside the input when 10 valid digits are entered. Immediate feedback.

### Delight Opportunities

1. **Submission counter:** Above the submissions table, show "You've submitted X leads this month." Simple recognition that their contribution is tracked.
2. **Status progress indication:** Next to each submission's status badge, show a tiny progress indicator (like breadcrumbs) showing how far along the pipeline the lead is: `[New] -> [Follow Up] -> [Visit] -> [Booked]`. The current status is highlighted. This gives the DSM pipeline context without exposing internal details.

### Anti-Patterns to Avoid
- Do NOT make the DSM navigate to a separate page to add a lead. The form IS the dashboard.
- Do NOT show the form in a Dialog. It should be always visible, always ready.
- Do NOT show too much information about each submission. The DSM doesn't need (and shouldn't see) internal pipeline details.
- Do NOT require the DSM to select a salesperson. Allocation is internal.

---

## Cross-Cutting UX Patterns

### Pattern: Real-Time Updates (Convex)

Every page that shows data from Convex uses real-time subscriptions. The UX treatment for live updates should be consistent everywhere:

1. **Data changes in tables:** Row updates in place. A brief background highlight (`bg-primary/5` for 1.5s, then fading) draws attention to the changed row.
2. **Data changes in stat cards:** Number changes with a brief color flash (primary color text for 1s).
3. **New data arriving:** New rows/cards animate in from top with `animate-in fade-in slide-in-from-top-2`.
4. **Data removed from view:** (e.g., lead reassigned away from a salesperson) Row/card fades out with `animate-out fade-out duration-300`, then the list re-stacks smoothly.
5. **Connection status:** If the Convex connection drops, show a persistent non-blocking banner at the top of the page: "Reconnecting..." in `bg-yellow-50 text-yellow-800`. When reconnected: "Connected" in green, auto-dismiss after 2s.

### Pattern: Loading States

1. **Initial page load:** Skeleton screens that match the actual layout. For dashboards: skeleton stat cards (rectangular gray shimmer blocks) + skeleton table rows. Never show a spinner for the initial load of a page.
2. **Mutation loading (save, update, create):** Button loading state -- spinner icon replaces button text or appears alongside it. Button becomes disabled.
3. **Filter/search loading:** A thin progress bar at the very top of the data area (like YouTube's red bar). Not a full-page spinner.
4. **Sheet/Dialog loading:** Skeleton content inside the Sheet/Dialog, not blocking the parent page.

### Pattern: Empty States

Every list/table must have a thoughtful empty state. Generic "No data" is banned. Each empty state must:
1. Tell the user WHY it's empty (contextual)
2. Tell them HOW to make it not empty (action)
3. Use an appropriate HugeIcon (size 48, text-muted-foreground)

Examples:
- Empty leads table: "No leads yet. Import a CSV or add leads manually." + "Import CSV" button
- Empty follow-ups: "All caught up! No follow-ups scheduled for today." (positive framing)
- Empty project creatives: "No marketing materials uploaded yet." + "Upload Files" button
- Empty submissions (DSM): "You haven't submitted any leads yet. Use the form above to get started."

### Pattern: Confirmation Dialogs

Reserve confirmation dialogs for destructive or irreversible actions ONLY:
- Archiving a project: YES, confirm
- Deleting a creative: YES, confirm
- Deactivating a user: YES, confirm
- Changing a lead status: NO -- this is a frequent action, use undo (Sonner toast with undo button) instead
- Adding a remark: NO -- just save it

Confirmation dialogs use shadcn AlertDialog:
```
Title: Specific action description ("Archive Sunrise Heights?")
Description: Consequence explanation ("Leads in this project will remain but no new leads can be imported.")
Cancel button (variant="outline") | Confirm button (variant="destructive" for deletes, variant="default" for non-destructive confirms)
```

### Pattern: Toasts (Sonner)

All non-blocking feedback uses Sonner toasts positioned at bottom-right:
- **Success:** "Lead updated" / "Remark saved" / "CSV imported" -- brief, no icon needed
- **With undo:** "Lead status changed to Follow Up" + "Undo" button (available for 5 seconds)
- **Error:** Red-tinted. Specific message: "Couldn't save remark. Please try again." + "Retry" button
- **Info:** "Lead [Name] was reassigned to you" (pushed by admin action, received via real-time subscription)

Toast duration: 4 seconds for success, 6 seconds for errors, 8 seconds for toasts with undo actions.

### Pattern: Keyboard Shortcuts (Power User Layer)

Not required for Phase 1 launch, but the architecture should support it. Key shortcuts to scaffold:
- `Cmd+K`: Global search (opens CommandDialog from shadcn)
- `Cmd+Enter`: Save current form/remark
- `Escape`: Close Sheet/Dialog
- `j`/`k`: Navigate list items (follow-up cards, table rows) -- when no input is focused

The CommandDialog (`Cmd+K`) is the most impactful. It should search:
- Leads by name or phone number
- Projects by name
- Users by name (admin only)

Results are grouped by type. Selecting a result navigates to that entity.

### Pattern: Mobile Responsiveness

The CRM will be used on phones (salespeople in the field checking lead info before a site visit). Key adaptations:

1. **Tables -> Card lists:** On < 768px, DataTables transform into stacked cards showing the essential columns only (Name, Status, Follow-up, Phone). Use `<Table>` on desktop, card layout on mobile with a shared data source.
2. **Sidebar -> Sheet:** The sidebar becomes a Sheet triggered by hamburger icon.
3. **Sheets -> Full pages:** The lead detail Sheet becomes a full-page on mobile (no room for slide-over).
4. **Stat cards:** From 4-column to 2-column grid on mobile.
5. **Filter bars:** Wrap to multiple lines, or collapse into a "Filters" button that opens a Sheet with all filter controls stacked vertically.
6. **Phone number tap:** On mobile, tapping a phone number opens the native dialer (`tel:` link). On desktop, it copies to clipboard.

### Pattern: Consistent Date/Time Display

- **Relative time** for recent events: "2 hours ago", "yesterday", "3 days ago"
- **Absolute date** for scheduled future events: "Mar 15, 2026 at 2:00 PM"
- **Both** available: relative time displayed, full date/time in tooltip on hover
- **Overdue highlighting:** Any date in the past that represents a missed follow-up: `text-destructive font-medium`
- **Today highlighting:** `text-primary font-medium` -- visually distinct from past and future

### Pattern: Status Badge Colors (Definitive Reference)

Consistent across every page where lead status appears:

| Status | Background | Text | Border |
|--------|-----------|------|--------|
| New | `bg-blue-50` | `text-blue-700` | `border-blue-200` |
| No Response | `bg-yellow-50` | `text-yellow-700` | `border-yellow-200` |
| Not Interested | `bg-gray-100` | `text-gray-600` | `border-gray-200` |
| Follow Up | `bg-orange-50` | `text-orange-700` | `border-orange-200` |
| Other Requirement | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| Visit Scheduled | `bg-purple-50` | `text-purple-700` | `border-purple-200` |
| Visit Done | `bg-indigo-50` | `text-indigo-700` | `border-indigo-200` |
| Booking Done | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` |
| Closed Won | `bg-green-50` | `text-green-700` | `border-green-200` |
| Closed Lost | `bg-red-50` | `text-red-600` | `border-red-200` |

These badges always use shadcn Badge with custom className overrides. They always have a border (border variant + custom border color). The zero border-radius from the design system makes them look like sharp, precise labels -- which matches the monospace aesthetic.

---

## Page Flow Map

This is how users move through the application:

```
LOGIN
  |
  +--[Admin]--------> ADMIN DASHBOARD
  |                     |
  |                     +---> Lead Management (table, Sheet detail)
  |                     +---> CSV Import (wizard)
  |                     +---> Project Management (list, edit page)
  |                     +---> User Management (table, Dialog CRUD)
  |                     +---> Activity Log (full log page)
  |
  +--[Salesperson]---> SALESPERSON DASHBOARD
  |                     |
  |                     +---> Lead Detail (Sheet or page)
  |                     +---> Activity Log (own activity)
  |
  +--[DSM]-----------> DSM DASHBOARD
                        |
                        +---> (Submissions list is on the same page)
```

Navigation is flat. No deep nesting. The admin has 5 main sections accessible from the sidebar. The salesperson has 2. The DSM has 1. This flatness is intentional -- it means any destination is 1 click from any starting point.

---

## Route Structure (Next.js App Router)

```
/                           -> Redirect based on auth state
/sign-in                    -> Clerk SignIn (login page)
/admin                      -> Admin Dashboard
/admin/leads                -> Lead Management
/admin/leads/[id]           -> Lead Detail (full page, for direct links)
/admin/import               -> CSV Import Wizard
/admin/projects             -> Project List
/admin/projects/[id]        -> Project Edit (with creatives)
/admin/users                -> User Management
/admin/activity             -> Full Activity Log
/dashboard                  -> Salesperson Dashboard
/dashboard/leads/[id]       -> Lead Detail (full page)
/dsm                        -> DSM Dashboard (form + submissions)
```

Middleware protects routes by role. An admin accessing `/dashboard` is redirected to `/admin`. A salesperson accessing `/admin` gets a 403 or redirect.

---

## Implementation Priority Order

If building incrementally, this is the order that unlocks value fastest:

1. **Login + Auth + Middleware** -- gate to everything
2. **Sidebar Shell Layout** -- shared across all pages
3. **Salesperson Dashboard** -- the primary user. Their workflow is the core value prop
4. **Lead Detail View (Sheet)** -- the salesperson needs this to work leads
5. **Admin Dashboard** -- the admin needs to monitor
6. **Lead Management (Admin)** -- the admin needs to find and manage leads
7. **CSV Import** -- the admin needs to add leads at scale
8. **Project Management** -- needed for CSV import (projects must exist first)
9. **User Management** -- needed for allocation (users must exist first)
10. **DSM Dashboard** -- the simplest page, lowest priority

Note: Items 8 and 9 (Projects and Users) need to be built as data models/APIs early even if their UIs come later. The admin can seed initial data via Convex dashboard during early development.

---

## Design Tokens Quick Reference

For developers implementing these pages:

```css
/* Typography scale (using existing Tailwind classes) */
Page title:       font-sans text-xl font-bold        /* Geist Sans */
Section header:   font-sans text-lg font-semibold     /* Geist Sans */
Stat number:      font-sans text-3xl font-bold tabular-nums  /* Geist Sans, numbers align */
Body text:        font-mono text-sm                    /* JetBrains Mono (default) */
Data/table:       font-mono text-sm                    /* JetBrains Mono */
Label:            font-mono text-xs text-muted-foreground uppercase tracking-wide
Caption:          font-mono text-xs text-muted-foreground
Code/phone:       font-mono text-sm                    /* Already mono by default */

/* Spacing conventions */
Page padding:     p-6 (desktop), p-4 (mobile)
Section gap:      space-y-6
Card padding:     p-4 or p-6
Table cell:       px-4 py-3

/* The primary color */
Warm red/orange:  oklch(0.514 0.222 16.935) -- var(--primary)
Used for:         Primary buttons, active states, today's follow-up highlights,
                  count badges, accent borders, key stat numbers

/* Animation classes (tw-animate-css) */
Enter:            animate-in fade-in slide-in-from-top-2 duration-200
Exit:             animate-out fade-out slide-out-to-right duration-300
Highlight:        transition-colors duration-1000 (apply primary color, then remove)
Pulse:            animate-pulse (for presence dots, very subtle)
```
