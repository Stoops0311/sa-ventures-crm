# SA CRM UX Architecture Memory

## Design System
- Light theme ONLY. White bg, near-black fg, warm red/orange primary `oklch(0.514 0.222 16.935)`
- Zero border-radius everywhere (`--radius: 0`)
- Body font: JetBrains Mono (mono). Headings: Geist Sans
- Icons: HugeIcons (`@hugeicons/react` + `@hugeicons/core-free-icons`)
- Components: shadcn/ui exclusively. Animation: tw-animate-css
- The monospace + sharp corners = "precision instrument" aesthetic (spreadsheet replacement feel)

## Navigation Architecture
- Sidebar (shadcn Sidebar, collapsible) + sticky top bar (48px)
- Admin: 7 sidebar items. Salesperson: 3. DSM: 2
- Sidebar footer: user avatar + name + role badge + sign out popover
- Mobile: sidebar becomes Sheet (side="left")
- Global search via Cmd+K CommandDialog

## Key Interaction Patterns
- Lead detail opens as Sheet (side="right") from tables, NOT full page nav
- Quick-update flow for salesperson: Popover/inline expansion, NOT Dialog
- Confirmations only for destructive actions; use undo toasts for frequent actions
- Real-time updates: row highlight flash, new items slide-in-from-top, removed items fade-out
- Status badges use consistent color scheme (10 statuses, each with bg/text/border combo)
- Toasts via Sonner at bottom-right. Success: 4s, Error: 6s, Undo: 8s

## Page Priorities (build order)
1. Login/Auth 2. Shell Layout 3. Salesperson Dashboard 4. Lead Detail
5. Admin Dashboard 6. Lead Management 7. CSV Import 8. Projects 9. Users 10. DSM

## Key Files
- Design spec: `docs/superpowers/specs/2026-03-10-sa-crm-phase1-design.md`
- UX stories: `docs/superpowers/specs/2026-03-10-sa-crm-ux-stories.md`
- CSS tokens: `app/globals.css` (light + dark vars, --radius: 0)
- Layout: `app/layout.tsx` (Geist + JetBrains Mono fonts, font-mono default)

## Roles
- Admin: full access, CSV import, project/user management, all leads + full HR access
- Salesperson: own leads only, dashboard with follow-ups, quick-update workflow + My HR self-service
- DSM: submit leads + view own submission statuses only (excluded from HR)
- HR: new role, manages employee profiles, onboarding, payroll, letters, insurance, queries, suggestions

## HR Module Structure
- 4 phases: A (Foundation/Onboarding), B (Documents/Letters), C (Payroll), D (Insurance/Queries/Suggestions)
- HR dashboard at `/hr`, self-service at `/dashboard/hr` and `/admin/hr`
- HR sidebar: 9 items (Dashboard, Employees, Onboarding, Letters, Payroll, separator, Insurance, Queries, Suggestions)

## HR Phase B Patterns (Documents & Letters)
- Letter generation is inline flow (NOT multi-page wizard) -- select template + employee, preview/edit, generate
- Template editing uses inline expand within table rows, NOT Dialog or separate page
- Document upload uses Dialog (quick focused task)
- Placeholder visual language: `text-primary font-medium` in previews, status pills (green=filled, orange=needs input)
- Employee letters list is a shared component used in HR detail view AND self-service
- Self-service letters view is read-only: title, type, date, download only
- Template type badge colors: Appointment=green, Warning=red, Experience=blue, Termination=gray, Salary Cert=purple, Increment=emerald
- PDF generation via pdf-lib (pure JS, runs in Convex actions)

## HR Phase C Patterns (Payroll)
- Currency: Indian format always (₹1,25,000 via Intl.NumberFormat("en-IN"), maximumFractionDigits: 0)
- All amounts right-aligned, tabular-nums, font-mono in tables
- Payroll status: Draft=yellow, Confirmed=green, Overridden=amber badge palette
- Override uses Popover (NOT Dialog) for quick amount edits on draft runs, 360px wide
- Salary Config opens as Dialog (max-w-2xl) from employee detail page
- Payslip Detail as Sheet (side="right"), width 420-560px
- Amount-in-words on payslips (Indian legal/cultural tradition)
- PDF generation is async after confirm; download buttons cascade in as PDFs complete
- Self-service shows only confirmed payslips, last 12 months default
- Review table renders all rows (no pagination) up to ~100 employees
- PF/ESI helpers show percentage calculations but store final rupee amounts (no percentage inputs)

## HR Phase A Patterns (Foundation & Onboarding)
- Employee detail is FULL PAGE (not Sheet) -- HR dives deep into one person at a time
- Detail page uses vertically stacked Collapsibles (not tabs) for profile sections
- Profile editing is inline (view transforms to form within same section), NOT Dialog
- Each section (Personal, Banking, Emergency) saves independently
- Bank account numbers masked in view mode (show last 4 only), revealed on edit/hover
- Onboarding checklist items: each checkbox is an atomic Convex mutation (no batch save)
- "Mark Complete" is an explicit HR sign-off action requiring AlertDialog confirmation
- Onboarding form for employees: single scrollable page with 3 Card sections, NOT a wizard
- Self-service profile is read-only; post-onboarding changes require HR query (Phase D)
- Onboarding banner on My HR: non-dismissable, border-l-4 border-primary, collapses on completion
- Sidebar notification dot (bg-destructive, 6px) on "My HR" when onboarding incomplete
- Problem-first sorting: onboarding queue sorts Pending first, then In Progress, then Completed
- Phase placeholder treatment: disabled nav items + collapsed sections + opacity-60 cards

## Key HR Files
- HR master design: `docs/superpowers/specs/2026-03-11-sa-crm-hr-design.md`
- Phase A spec: `docs/superpowers/specs/2026-03-11-hr-phase-a-foundation-onboarding.md`
- Phase A UX stories: `docs/superpowers/specs/2026-03-11-hr-phase-a-ux-stories.md`
- Phase B spec: `docs/superpowers/specs/2026-03-11-hr-phase-b-documents-letters.md`
- Phase B UX stories: `docs/superpowers/specs/2026-03-11-hr-phase-b-ux-stories.md`
- Phase C spec: `docs/superpowers/specs/2026-03-11-hr-phase-c-payroll.md`
- Phase C UX stories: `docs/superpowers/specs/2026-03-11-hr-phase-c-ux-stories.md`
- Phase D spec: `docs/superpowers/specs/2026-03-11-hr-phase-d-insurance-queries-suggestions.md`
- Phase D UX stories: `docs/superpowers/specs/2026-03-11-hr-phase-d-ux-stories.md`

## HR Phase D Patterns (Insurance, Queries & Suggestions)
- Insurance tracker: Alert card (top, urgency-colored) + DataTable below. Alert has 3 states: urgent (red, <=7d), warning (yellow, <=30d), all-clear (green)
- Insurance detail opens as Sheet (side="right"), tracker fields directly editable (no edit-mode toggle)
- Enrollment form: required fields visible + optional in Collapsible. Switch for existing conditions (not Yes/No Select)
- Query queue: stat pills bar (open/in-progress/resolved-today) + filtered DataTable. Default sort: open first, then by date
- Query detail Sheet: sticky header + content + sticky action bar at BOTTOM (after reading, not before)
- Resolution/rejection uses Popover (NOT Dialog) anchored to action button -- lightweight for 1-2 sentence notes
- "Mark In Progress" is one-click (no note required) -- triage action should be instant
- Suggestion viewer: Card-based (NOT table) -- text-heavy content needs reading space
- Suggestion review: inline card expansion, NOT Sheet/Dialog -- read card, review, next card flow
- Anonymous toggle: FIRST field in suggestion form, with visual feedback (bg tint + lock icon). Default OFF. No confirmation on toggle
- Anonymous suggestions stripped server-side in listAll query. NOT shown in employee's "My Suggestions" list
- Self-service tabs: Insurance + Queries + Suggestions share same Card + button + list pattern
- HR dashboard Phase D: adds "Open Queries" + "Upcoming Renewals" stat cards (positions 3-4) + "Recent Queries" preview
- Status color semantics: blue=initial, yellow=transitional, green=positive-terminal, red/gray=negative-terminal
