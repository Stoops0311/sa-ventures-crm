# HR Phase B -- Documents & Letters UX Stories

## Design System Reference

Same constraints as all SA CRM pages:

- **Theme:** Light only. White background (`oklch(1 0 0)`), near-black foreground (`oklch(0.145 0 0)`)
- **Primary color:** Warm red/orange (`oklch(0.514 0.222 16.935)`) -- used for primary buttons, active states, key accents
- **Border radius:** Zero everywhere. `--radius: 0`. Every card, button, input, badge is a sharp rectangle
- **Body font:** JetBrains Mono (monospace) -- the precision instrument feel
- **Heading font:** Geist Sans -- page titles and section headers only
- **Icons:** HugeIcons (`@hugeicons/react` + `@hugeicons/core-free-icons`)
- **Components:** shadcn/ui exclusively
- **Animations:** tw-animate-css (`animate-in`, `fade-in`, `slide-in-from-bottom`, etc.)

### Phase B Aesthetic Notes

Letters and documents are formal HR artifacts. The monospace font + sharp rectangles make this section feel authoritative -- like an office that takes paperwork seriously. The placeholder syntax (`{{employeeName}}`) will feel natural in monospace. The template editor should lean into this code-like quality rather than fighting it.

---

## Page 1: Letter Management (`/hr/letters`)

### Page Purpose
Generate employee letters from templates and manage the template library -- the HR team's document production center.

### User Arrives With...
**Mindset:** The HR staff member has been asked to generate a letter for an employee -- an appointment letter for a new hire, a warning letter that management requested, an experience certificate for someone leaving. They know what type of letter they need and for whom. Alternatively, they are here to update a template that needs a wording change.
**Emotion:** Administrative but attentive. Letters are formal documents that carry legal weight. The user wants to get it right without it taking forever. There is a mild anxiety: "Will the auto-fill be correct? Do I need to review the content carefully?"
**Goal:** Generate a letter for a specific employee in under 60 seconds, or edit a template in under 30 seconds.

### The Attention Flow

1. **First 0.5s:** The "Generate Letter" section dominates the top -- a large Card with the first step of the generation flow already visible. The user immediately sees: "This is where I make letters."
2. **First 3s:** Eyes scan the template selector dropdown and the employee combobox. The two most important inputs are on the same horizontal line. Below that, they notice the "Templates" section heading.
3. **First 10s:** The user selects a template type from the dropdown. Depending on their task, they either continue the generation flow or scroll down to the template management section.
4. **After that:** Progressive disclosure -- the generation flow reveals steps as the user progresses. The template list below is a reference tool, not the primary interaction.

### Information Hierarchy

**Tier 1 -- Letter Generation Flow (top 60% of initial viewport):**

```
shadcn/ui: Card (border, prominent)
Title: "Generate Letter" (Geist Sans, text-lg, font-semibold)
Subtitle: "Select a template and employee to create a letter" (text-xs text-muted-foreground)
```

The generation flow is a compact inline stepper within this Card. NOT a multi-page wizard -- the entire flow is visible within one scrollable Card. Steps reveal progressively as the user makes selections.

**Step 1: Select Template + Employee (always visible)**

```
Layout: Two-column flex row (gap-4), single row on mobile
```

- **Left:** Template selector (shadcn Select)
  - Label: "Template" (`text-xs text-muted-foreground uppercase tracking-wide`)
  - Options grouped by type: Appointment, Warning, Experience, Termination, Salary Certificate, Increment
  - Each option shows: Template name + small `text-muted-foreground` description
  - Placeholder: "Choose a letter template..."

- **Right:** Employee selector (shadcn Combobox -- Input + Popover with searchable list)
  - Label: "Employee"
  - Searchable by name -- as the user types, results filter in real-time
  - Each result shows: Name + Designation + Department (text-xs text-muted-foreground)
  - Placeholder: "Search employee by name..."

When BOTH are selected, Step 2 reveals below with `animate-in fade-in slide-in-from-bottom-2 duration-200`.

**Step 2: Preview + Edit (reveals after Step 1 selections)**

```
Layout: Full-width within the Card, below Step 1
Border-top: border-t border-border, with pt-4 spacing
```

- **Preview header:** A compact bar showing what was auto-filled:
  - "Generating **Appointment Letter** for **Priya Sharma**" (Geist Sans, text-sm, font-medium)
  - Below: A row of small pills showing auto-filled placeholders: `companyName: SA Ventures` | `designation: Sales Executive` | `department: Sales` | `dateOfJoining: 15th Jan 2026` -- each pill is a `Badge variant="secondary"` with monospace text

- **Placeholder status bar:** A horizontal bar showing which placeholders need manual input:
  - Auto-filled placeholders: green-tinted `Badge` with checkmark icon -- `{{employeeName}} filled`
  - Manual placeholders still needed: orange-tinted `Badge` with edit icon -- `{{warningReason}} needs input`
  - This bar is ONLY shown if there are manual placeholders. For templates that are fully auto-filled (like Appointment), this bar does not appear.

- **Content editor:** A `Textarea` containing the fully resolved letter text
  - Height: auto-expanding, minimum 12 rows, maximum 24 rows before scroll
  - Font: `font-mono text-sm` (already the default, but explicitly set for consistency)
  - The auto-filled values appear as normal text -- they are already resolved into the content
  - Manual placeholders that have NOT been filled appear as highlighted spans: `{{warningReason}}` rendered with `bg-orange-50 text-orange-700 border border-orange-200 px-1` styling inline within the textarea text. Since this is a plain textarea, the visual distinction is achieved by keeping the `{{...}}` syntax visible in the text -- the placeholder status bar above tells the user which ones still need manual replacement.
  - The user can freely edit ANY part of the text -- auto-filled values, manual placeholders, or add new content. Full creative control.

- **Below the textarea:**
  - Text: "Review the content above. Auto-filled values can be edited. Replace any remaining {{placeholders}} with the correct information." (`text-xs text-muted-foreground`)

**Step 3: Generate (footer of the Card)**

```
Layout: Flex row, justify-between, border-t, pt-4
```

- **Left:** "Reset" button (`Button variant="ghost" size="sm"`) -- clears all selections and returns to Step 1
- **Right:** "Generate PDF" button (`Button variant="default" size="lg"`)
  - Disabled if the textarea still contains any `{{...}}` placeholder syntax (unfilled manual placeholders)
  - Tooltip on disabled state: "Replace all {{placeholders}} in the letter before generating"
  - On click: enters loading state (see Micro-Interactions below)

**Tier 2 -- Template Management (below the generation flow):**

```
Section header (Geist Sans, text-lg, font-semibold):
"Templates" + count badge (shadcn Badge, showing "6")
Subtitle: "Manage letter template content and availability"
```

```
shadcn/ui: DataTable (simple)
Columns: Type | Name | Status | Last Updated | Actions
```

Column details:
- **Type:** Badge with color coding per template type:
  - Appointment: `bg-green-50 text-green-700 border-green-200`
  - Warning: `bg-red-50 text-red-700 border-red-200`
  - Experience: `bg-blue-50 text-blue-700 border-blue-200`
  - Termination: `bg-gray-100 text-gray-600 border-gray-200`
  - Salary Certificate: `bg-purple-50 text-purple-700 border-purple-200`
  - Increment: `bg-emerald-50 text-emerald-700 border-emerald-200`
- **Name:** `font-medium` -- the template's display name
- **Status:** Toggle-style display. Active: green dot + "Active" (`text-green-700`). Inactive: gray dot + "Inactive" (`text-muted-foreground`)
- **Last Updated:** Relative time ("2 days ago") with full date in tooltip
- **Actions:** Two icon buttons:
  - Expand/collapse chevron (HugeIcon: `ArrowDown01Icon` / `ArrowUp01Icon`) -- toggles inline template preview
  - Active/Inactive toggle (shadcn Switch, inline)

**Row expansion (template preview):**

When the expand chevron is clicked, the row expands downward to reveal the template content. Uses shadcn Collapsible within the table row.

```
Expanded area (below the row, full table width):
  Background: bg-muted/30
  Padding: p-4
  Contains: Template content preview + Edit button
```

- **Template content preview:** A read-only `pre` block (`font-mono text-sm whitespace-pre-wrap`) showing the template body. Placeholders (`{{employeeName}}`, etc.) are visually distinct: rendered with `text-primary font-medium` styling within the monospace text. This is NOT a textarea -- it is a styled preview.
- **Footer of expanded area:**
  - "Edit Template" button (`Button variant="outline" size="sm"`) -- transforms the preview into an editable textarea (see Template Editor interaction below)
  - "Placeholders used:" followed by a row of `Badge variant="secondary"` listing all `{{...}}` tokens found in the template

**Tier 3 -- Page Actions (top-right of page, within the top bar area):**

- "Upload Document" button (`Button variant="outline"`) -- opens the document upload dialog
  - HugeIcon: `FileUploadIcon` prefix

### Component Map

```
Page layout:
  padding: p-6 (desktop), p-4 (mobile)
  max-width: none (full content width)
  space-y-8 between sections

Section 1: Letter Generation Card
  shadcn Card (border)
  Internal layout: space-y-4
  Step 1: grid grid-cols-2 gap-4 (desktop), grid-cols-1 (mobile)
  Step 2: conditional render, animate-in
  Step 3: flex justify-between, border-t pt-4

Section 2: Template Management
  Section header + DataTable
  Expandable rows with Collapsible

Top-right action: Upload Document button
```

**Responsive behavior:**
- On < 768px: Template + Employee selectors stack vertically (grid-cols-1)
- Template table columns reduce: hide "Last Updated" column, "Actions" become a DropdownMenu
- Expanded template preview gains horizontal scroll if content is wide

### Micro-Interactions

- **Template selection:** When a template is selected, if an employee is already chosen, the preview area appears with a brief `animate-in fade-in slide-in-from-bottom-2 duration-200`. The textarea content populates with the resolved template. If an employee is selected first, the same reveal happens when the template is chosen.

- **Employee selection in combobox:** As the user types, results filter with debounce at 200ms. Each result row shows the employee's name prominently with designation and department in muted text below. Selected employee shows as a chip-style display in the input.

- **Placeholder resolution animation:** When both template and employee are selected and the preview generates, the auto-filled placeholder pills in the status bar appear one by one with a staggered `animate-in fade-in` (50ms delay between each). This creates a satisfying "data filling in" visual moment.

- **Generate PDF button loading state:**
  1. Button text changes to "Generating..." with a spinner icon
  2. Button becomes disabled
  3. A thin progress bar appears below the button (indeterminate, `bg-primary` sliding left-to-right)
  4. Duration: typically 2-4 seconds for PDF generation

- **Generate PDF success state:**
  1. The progress bar completes (fills to 100%)
  2. The button transforms: green background, checkmark icon, text changes to "Letter Generated"
  3. Below the button, two new action links appear with `animate-in fade-in slide-in-from-bottom-2`:
     - "Download PDF" (Button variant="outline" size="sm", with HugeIcon `Download04Icon`)
     - "Generate Another" (Button variant="ghost" size="sm") -- resets the form
  4. A Sonner toast appears: "Appointment Letter for Priya Sharma generated successfully" with a "Download" action link
  5. The button reverts to default state after 5 seconds, or when "Generate Another" is clicked

- **Template expand/collapse:** Row content expands with `animate-in fade-in slide-in-from-top-1 duration-150`. Collapse is instant (no exit animation needed -- feels snappier).

- **Template active/inactive toggle:** On toggle to inactive, the entire row gains `opacity-60` with `transition-opacity duration-300`. A Sonner toast: "Warning Letter template deactivated" with an "Undo" link (8 seconds). The template disappears from the generation flow's Select dropdown immediately.

- **Auto-seed on first load:** If the templates table is empty (first visit to this page), the 6 default templates are seeded automatically. The user sees a brief skeleton state (3 skeleton rows in the table) for ~500ms, then the templates appear with `animate-in fade-in`. A subtle Sonner info toast: "Default letter templates have been set up."

### Delight Opportunities

1. **Smart template suggestion:** If the user selects an employee FIRST, and that employee has a pending onboarding checklist with "Sign offer letter" unchecked, suggest the Appointment Letter template by showing a small hint above the template selector: "Suggested: Appointment Letter -- this employee's offer letter hasn't been signed yet." This proactive intelligence makes the HR person feel like the system understands their workflow.

2. **Placeholder count in template selector:** Each option in the template Select shows a small count: "Appointment Letter -- 2 manual fields" or "Experience Letter -- 1 manual field". This sets expectations before the user even selects the template -- fewer manual fields means faster generation.

3. **Recently generated indicator:** In the template table, if a template was used to generate a letter in the last 24 hours, show a tiny `text-primary` dot next to the type badge. Hovering shows: "Last used 2 hours ago for Priya Sharma." This ambient awareness helps HR track their recent work.

### Anti-Patterns to Avoid
- Do NOT use a multi-page wizard for letter generation. The CSV import wizard has 4 steps because each step involves significant data (file upload, column mapping, allocation). Letter generation has 3 lightweight inputs -- it should all be visible in one Card.
- Do NOT use a rich text editor (WYSIWYG) for the template content. These letters are plain text documents rendered as PDFs. A rich text editor adds complexity without value. The monospace textarea IS the editor.
- Do NOT open templates in a Dialog for editing. The inline expand pattern keeps context -- the user can see the template list and the template content simultaneously.
- Do NOT require the user to manually fill in auto-fillable placeholders. If the system has the data (`employeeName`, `designation`, etc.), it MUST auto-fill. The user should only type values the system genuinely cannot know (`warningReason`, `terminationDate`, etc.).
- Do NOT hide the template management section behind a tab or separate page. HR needs quick access to both generation and template editing from the same surface.

### Mobile Behavior
- Template + Employee selectors stack vertically
- The preview textarea becomes full-width with increased min-height (16 rows) for comfortable editing
- Template table switches to a card-based layout: each template is a Card showing Type badge + Name + Status toggle + Expand button
- Expanded template content fills the full card width with horizontal scroll if needed
- "Generate PDF" button becomes full-width at the bottom of the generation Card
- The placeholder status bar scrolls horizontally if pills overflow

---

## Page 2: Letter Generation Flow (Detailed Interaction Sequence)

This is not a separate page -- it is the detailed interaction choreography within the Letter Management page's generation Card. Documenting it separately because it is the most complex multi-step interaction in Phase B.

### Page Purpose
Walk HR through selecting a template, selecting an employee, reviewing auto-filled content, editing manual placeholders, and generating a PDF -- all within a single Card.

### User Arrives With...
**Mindset:** "I need to generate a [specific type] letter for [specific employee]." The user knows both pieces of information before they start. The flow should match their mental model: pick type, pick person, check content, produce document.
**Emotion:** Focused efficiency. This is a task with a clear end state (PDF in hand). Any unnecessary step feels like friction.
**Goal:** PDF generated and either downloaded or stored against the employee's profile within 60 seconds.

### The Attention Flow

1. **First 0.5s:** Two side-by-side dropdowns. The user's eyes go to the template selector first (it is on the left, reading order).
2. **First 3s:** Template selected. Eyes move right to the employee combobox. Start typing the name.
3. **First 5s:** Employee selected. The preview area reveals below. Eyes jump to the resolved content.
4. **First 15s:** Scanning the preview. Auto-filled values look correct. If there are manual placeholders, the orange status pills above the textarea draw attention. The user clicks into the textarea and starts replacing `{{warningReason}}` with the actual text.
5. **First 30s:** Content is complete. The user's eyes move to the bottom-right: the "Generate PDF" button. It is now active (no more `{{...}}` tokens in the text).
6. **First 45s:** Button clicked. Loading state. Brief wait.
7. **60 seconds:** PDF generated. Download link appears. Task complete.

### Information Hierarchy

**The flow has three cognitive phases:**

**Phase A: Selection (0-5 seconds)**
Two inputs, side by side. Nothing else visible below them except a subtle placeholder message: "Select a template and employee to preview the letter" (`text-sm text-muted-foreground`, centered below the inputs). This placeholder disappears when both inputs are filled.

**Phase B: Review & Edit (5-30 seconds)**

The preview area appears. The information hierarchy within this area:

1. **Generation header** (top): "Generating **Appointment Letter** for **Priya Sharma**" -- confirms the selection in plain language
2. **Placeholder status** (below header, only if manual placeholders exist): Orange pills for unfilled, green pills for auto-filled. The unfilled ones are the user's checklist.
3. **Textarea** (main content): The letter body. This is where the user spends 80% of their time in this phase.
4. **Help text** (below textarea): Guidance on editing

**Phase C: Generate (30-60 seconds)**

The "Generate PDF" button is the only thing that matters. It should be visually prominent:
- `Button variant="default" size="lg"` -- larger than typical action buttons
- HugeIcon: `FilePdfIcon` as prefix icon
- If disabled (unfilled placeholders), show a muted state with tooltip

### Detailed Interaction: Auto-Fill Resolution

When both template and employee are selected, the system runs the following resolution:

1. Fetch the template's `content` string
2. Fetch the employee's profile data (name from `users`, profile from `employeeProfiles`)
3. Replace all auto-fillable placeholders:
   - `{{companyName}}` -> "SA Ventures"
   - `{{currentDate}}` -> Today's formatted date ("11th March 2026")
   - `{{employeeName}}` -> User's full name
   - `{{designation}}` -> From employee profile (or `"[designation not set]"` in muted style if missing)
   - `{{department}}` -> From employee profile (or `"[department not set]"` if missing)
   - `{{dateOfJoining}}` -> From employee profile, formatted (or `"[date of joining not set]"` if missing)
   - `{{panNumber}}` -> From employee profile (or `"[PAN not set]"` if missing)
   - `{{grossSalary}}` -> Calculated from salary components if Phase C is deployed, otherwise `"[salary not configured]"`
4. Leave manual placeholders as-is: `{{warningReason}}`, `{{lastWorkingDate}}`, etc.

**Missing auto-fill data handling:** If an auto-fillable placeholder cannot be resolved (e.g., the employee profile is missing `designation`), the resolved text shows a visually distinct fallback: `[designation not set]`. This text is wrapped in square brackets and rendered in the textarea. The placeholder status bar shows this as an orange pill: `{{designation}} -- profile incomplete`. This prevents the user from generating a letter with missing data without realizing it.

### Detailed Interaction: Manual Placeholder Replacement

The user needs to replace `{{warningReason}}` with actual text. The flow:

1. The user sees `{{warningReason}}` in the textarea content
2. The orange status pill above says `{{warningReason}} needs input`
3. The user clicks into the textarea, selects `{{warningReason}}`, and types the replacement text
4. As the user types, the system monitors the textarea content in real-time (debounced at 500ms). When `{{warningReason}}` is no longer found in the text, the corresponding orange pill transitions to green with `transition-colors duration-300` and the text changes to `warningReason filled`
5. When ALL `{{...}}` patterns are resolved, the "Generate PDF" button becomes enabled with a subtle `animate-in fade-in duration-200`

### Detailed Interaction: PDF Generation

1. User clicks "Generate PDF"
2. **Optimistic UI:** Button enters loading state immediately
3. **Client calls Convex action:** `employeeLetters.generatePdf({ content, title })` where `content` is the textarea value and `title` is derived from the template type + employee name (e.g., "Appointment Letter - Priya Sharma")
4. **Server-side (Convex action):**
   - Creates a PDF using `pdf-lib` (A4 page, company header, title, body text)
   - Stores the PDF blob in Convex file storage
   - Returns `{ storageId, fileName }`
5. **Client calls Convex mutation:** `employeeLetters.create(...)` to create the letter record linked to the employee
6. **Success state:** Button transforms to success, download link appears (see Micro-Interactions above)
7. **Error state:** Button reverts to default. Sonner toast in red: "Failed to generate PDF. Please try again." with a "Retry" button.

### Detailed Interaction: Pre-Selection from Employee Detail

When the user navigates to `/hr/letters` from an employee detail page (via the "Generate Letter" button), the URL includes a query parameter: `/hr/letters?employee=[userId]`. On page load:
- The employee combobox auto-selects the specified employee
- The template selector receives focus, ready for the user to choose
- The placeholder text below the inputs changes to: "Choose a template for **Priya Sharma**" -- confirming the pre-selection

This saves one step for the most common flow: viewing an employee's profile and deciding to generate a letter for them.

### Anti-Patterns to Avoid
- Do NOT show a preview in a separate panel or Dialog. The preview IS the editor. What the user sees in the textarea is exactly what gets rendered as PDF (with formatting applied).
- Do NOT auto-generate the PDF without user confirmation. The user MUST review the content before generation. The explicit "Generate PDF" button click is the confirmation.
- Do NOT clear the form after successful generation. The user might want to download the PDF or generate another letter for the same employee. "Generate Another" is an explicit action.
- Do NOT show a "Step 1, Step 2, Step 3" stepper bar. The CSV import wizard needs a stepper because it has 4 distinct screens. This flow has 3 lightweight inputs that reveal progressively -- a visual stepper would add ceremony to what should feel fast and fluid.

---

## Page 3: Template Editor (Inline Interaction)

### Page Purpose
Edit a letter template's content without leaving the template list -- a quick in-place editing experience.

### User Arrives With...
**Mindset:** The HR user noticed a wording issue in a template, or management asked for a change to the standard letter format. They want to update the template text and get back to their primary task.
**Emotion:** Quick-fix mode. This is a 30-second task. If the editing experience is slow or cumbersome, they will be frustrated.
**Goal:** Edit template text, save, confirm it looks right, done.

### The Attention Flow

1. **First 0.5s:** The user has already expanded a template row. They see the template content preview in the collapsible area. Their eyes scan the content.
2. **First 1s:** They click "Edit Template". The preview transforms into an editable textarea.
3. **First 10s:** They make their edit (change a word, add a line, adjust a placeholder name).
4. **First 20s:** They click "Save". The textarea transforms back to a preview. Done.

### The Edit Transformation

When "Edit Template" is clicked, the following transformation happens within the expanded row area:

**Before (read-only preview):**
```
[Template content in pre block, monospace, read-only]
[Placeholders used: {{employeeName}} {{designation}} ...]
[Edit Template button]
```

**After click (edit mode) -- transition: crossfade, duration-200:**
```
[Template name input -- Input, pre-filled, label "Template Name"]
[Template content textarea -- Textarea, pre-filled, monospace, min 16 rows]
[Placeholder reference bar]
[Cancel] [Save Changes]
```

**Edit mode details:**

- **Template name input:** `shadcn Input`, pre-filled with the current name. `w-full max-w-sm`. Most template names are fine as-is, so this is a secondary edit.

- **Content textarea:** `shadcn Textarea`, pre-filled with the template's content string including all `{{placeholder}}` syntax.
  - Font: `font-mono text-sm` (matches the preview exactly)
  - Placeholder syntax is visible as literal `{{text}}` -- the user sees and edits these directly
  - Min height: 16 rows. Max height: 32 rows before internal scroll.
  - The textarea has a subtle left border accent: `border-l-4 border-l-primary` to visually distinguish edit mode from preview mode

- **Placeholder reference bar:** Below the textarea, a horizontal row showing all valid placeholder tokens for this template type:
  - Each placeholder displayed as a `Badge variant="outline"` with monospace text: `{{employeeName}}`
  - Clicking a placeholder badge inserts it at the cursor position in the textarea (or appends if no cursor position)
  - Label above: "Available placeholders (click to insert):" (`text-xs text-muted-foreground`)
  - This bar is the "syntax reference" -- HR staff do not need to memorize placeholder names

- **Action buttons:**
  - "Cancel" (`Button variant="ghost" size="sm"`) -- discards changes, returns to preview mode
  - "Save Changes" (`Button variant="default" size="sm"`) -- saves and returns to preview mode

### Micro-Interactions

- **Edit mode enter:** The preview `pre` block crossfades into the textarea. The `border-l-4 border-l-primary` accent slides in from the left. The textarea receives focus with the cursor at the end of the content.

- **Placeholder badge click-to-insert:** When a placeholder badge is clicked:
  1. The placeholder text (e.g., `{{employeeName}}`) is inserted at the textarea's current cursor position
  2. The badge briefly flashes with `bg-primary/10` for 300ms (visual confirmation of the click)
  3. The textarea regains focus with the cursor positioned after the inserted placeholder
  4. Sonner toast is NOT needed for this -- the visual insertion in the textarea is sufficient feedback

- **Save interaction:**
  1. Button enters loading state (spinner, 200-300ms)
  2. Convex mutation `letterTemplates.upsert(...)` runs
  3. On success: textarea crossfades back to preview `pre` block. The content now reflects the saved changes. Sonner toast: "Template updated." (4 seconds)
  4. On error: Sonner toast: "Couldn't save template. Please try again." (6 seconds, with "Retry" link)

- **Unsaved changes warning:** If the user clicks "Cancel" while the textarea content differs from the original, show a brief inline warning above the buttons: "You have unsaved changes. Are you sure?" with "Discard" and "Keep Editing" links. NOT a full AlertDialog -- that is too heavy for this interaction. Just an inline text warning with action links.

- **Dirty state indicator:** While editing, if the content has changed from the original, the "Save Changes" button gains a small primary-colored dot indicator (like an unsaved tab in a code editor). This dot disappears when saved.

### Placeholder Syntax Highlighting (in Preview Mode)

In the read-only preview, `{{placeholder}}` tokens are not plain text -- they are visually distinct:

```
Placeholder text styling in preview:
  color: text-primary (warm red/orange)
  font-weight: font-medium
  This makes them pop against the regular monospace text
```

Implementation: The preview is not a plain `pre` tag. It is a `div` with `whitespace-pre-wrap font-mono text-sm` where the content is rendered by splitting on `{{...}}` regex and wrapping matches in `<span className="text-primary font-medium">`. This achieves syntax highlighting without a full code editor library.

### Anti-Patterns to Avoid
- Do NOT use a code editor component (Monaco, CodeMirror, etc.) for template editing. These templates are simple text with `{{placeholder}}` tokens -- a textarea with click-to-insert placeholders is the right tool. A full code editor is overkill and adds bundle size for no user benefit.
- Do NOT open the template editor in a Dialog or Sheet. The inline expand-to-edit pattern maintains context with the template list.
- Do NOT allow HTML in templates. These are plain text documents rendered as PDFs. HTML would complicate rendering and create security concerns.
- Do NOT allow template deletion. Deactivation (via the Switch toggle) is the safe pattern. Templates might have been used to generate letters -- deleting the template would orphan those historical records.

### Mobile Behavior
- The expanded template area takes full width below the template card
- The placeholder reference bar scrolls horizontally
- The textarea gains extra vertical height (20 rows minimum) for comfortable editing on small screens
- "Save Changes" button becomes full-width below the textarea

---

## Page 4: Document Upload Flow

### Page Purpose
Upload an externally created document (PDF) and attach it to an employee's profile -- for documents that do not originate from templates.

### User Arrives With...
**Mindset:** The HR user has a PDF file on their computer -- maybe a signed physical letter that was scanned, a document from a third-party agency, or a manually created letter from Word/Google Docs. They want to attach it to the correct employee's record.
**Emotion:** Task-oriented. They have the file ready. The interaction should be: pick employee, pick file, give it a title, done.
**Goal:** Upload a document and link it to an employee in under 20 seconds.

### The Attention Flow

1. **First 0.5s:** The Dialog opens. The user sees three fields stacked vertically: Employee, Title, File upload zone. The simplicity is immediately clear.
2. **First 3s:** The employee combobox has focus (autofocus). If pre-selected (opened from an employee's detail page), the user skips to the title field.
3. **First 10s:** All three fields filled. The user clicks "Upload."
4. **First 15s:** Upload completes. Dialog closes. Done.

### Component Map

**Container:** shadcn Dialog (NOT a separate page)

```
shadcn/ui: Dialog
Title: "Upload Document" (Geist Sans, font-semibold)
Description: "Attach a PDF document to an employee's profile" (text-sm text-muted-foreground)
Width: max-w-md
```

**This Dialog is triggered from two places:**
1. The "Upload Document" button on the Letter Management page (`/hr/letters`)
2. The "Upload Document" button on an Employee Detail page (`/hr/employees/[id]`)

When triggered from an Employee Detail page, the employee combobox is pre-selected and disabled (read-only display of the employee name). The Dialog title changes to: "Upload Document for **Priya Sharma**".

**Dialog fields (vertical stack, space-y-4):**

1. **Employee selector** (shadcn Combobox)
   - Label: "Employee"
   - Same searchable combobox as the letter generation flow
   - Pre-selected when opened from an employee's page
   - Autofocus when NOT pre-selected

2. **Document title** (shadcn Input)
   - Label: "Title"
   - Placeholder: "e.g., Signed Offer Letter, Reference Check..."
   - Required
   - Autofocus when employee IS pre-selected

3. **File upload zone**
   - Reuses the same DragDropZone pattern from the CSV import (Phase 1):
     - Dashed border area (`border-2 border-dashed border-muted-foreground/25`)
     - HugeIcon: `FileUploadIcon` centered, size 32 (smaller than CSV import -- this is a Dialog, not a full page)
     - "Drag and drop a PDF or click to browse" (`text-sm text-muted-foreground`)
     - Accepted types: `.pdf` only
     - Max size: "Max 10MB" (`text-xs text-muted-foreground`)
   - After file selection: the upload zone transforms to show the file info:
     - HugeIcon: `FilePdfIcon` (size 24) + file name + file size
     - "Remove" link (text-destructive, text-xs) to clear and re-select

**Dialog footer:**
- "Cancel" (`Button variant="outline"`)
- "Upload" (`Button variant="default"`) -- disabled until all fields are filled + file is selected

### Micro-Interactions

- **File drop on zone:** The dashed border transitions to `border-primary` with `transition-colors duration-150`. The upload icon briefly scales up with `scale-110 transition-transform`. The file info replaces the drop zone content with a crossfade.

- **Upload progress:** After clicking "Upload":
  1. Button text changes to "Uploading..." with spinner
  2. A progress bar appears below the file info showing upload percentage (if Convex provides upload progress; otherwise, indeterminate bar)
  3. On completion: Dialog closes automatically. Sonner toast: "Document uploaded for Priya Sharma" (4 seconds)

- **File validation error:** If the user drops a non-PDF file:
  - The dashed border flashes `border-destructive` for 500ms
  - Inline error below the zone: "Only PDF files are accepted" (`text-xs text-destructive`)
  - The zone returns to its default state after 2 seconds

- **File size error:** If the file exceeds 10MB:
  - Same red border flash
  - Inline error: "File is too large. Maximum size is 10MB." (`text-xs text-destructive`)

### Anti-Patterns to Avoid
- Do NOT use a separate page for document upload. A Dialog is the right container -- it is a quick, focused task.
- Do NOT allow multiple file upload in a single submission. One file, one title, one employee. If HR needs to upload multiple documents, they repeat the flow. Simplicity over power.
- Do NOT accept file types other than PDF. Letters and documents should be in PDF format for consistency. If the user has an image of a scanned document, they should convert it to PDF first (this is a reasonable expectation in an HR context).
- Do NOT auto-generate the title from the filename. Filenames like `scan_2026_03_11.pdf` are useless. The title must be human-entered and descriptive.

### Mobile Behavior
- Dialog becomes nearly full-screen (max-w-full with padding) on mobile
- The drag-and-drop zone shows "Tap to browse files" instead of "Drag and drop" (no drag on mobile)
- File input opens the system file picker on tap
- "Upload" button becomes full-width at the bottom of the Dialog

---

## Page 5: Employee Letters Section (on Employee Detail Page)

### Page Purpose
Show all letters associated with a specific employee and provide quick actions to generate new letters or upload documents -- the employee's document drawer within their profile.

### User Arrives With...
**Mindset:** The HR user is viewing an employee's full profile (Phase A's employee detail page at `/hr/employees/[id]`). They have scrolled to or clicked into the "Letters" section. They want to see what letters this employee has received, download one, or generate/upload a new one.
**Emotion:** Reference mode. They may be looking for a specific document ("Did we issue a warning letter for this person?") or preparing to generate one.
**Goal:** Find a specific letter fast, or start the process of creating a new one.

### The Attention Flow

1. **First 0.5s:** The section header "Letters" with a count badge. Instant answer: "This employee has X letters on file."
2. **First 2s:** Scan the table. Each row shows a letter title, type badge, and date. The most recent letter is at the top.
3. **First 5s:** Either click "Download" on a specific letter, or click one of the action buttons to add a new letter.
4. **After that:** Delete a letter if needed (rare action, requires confirmation).

### Component Map

```
This section lives within the Employee Detail page layout.
It is one of several sections (Profile, Onboarding, Letters, Salary, Insurance).
It may be implemented as a Tab panel or a scrollable section.
```

**Section header:**

```
Layout: flex justify-between items-center, mb-4
Left: "Letters" (Geist Sans, text-lg, font-semibold) + Badge showing count
Right: Two buttons (gap-2)
```

- "Generate Letter" button (`Button variant="default" size="sm"`, HugeIcon: `FilePdfIcon`)
  - Navigates to `/hr/letters?employee=[userId]` -- the letter management page with this employee pre-selected
- "Upload Document" button (`Button variant="outline" size="sm"`, HugeIcon: `FileUploadIcon`)
  - Opens the Document Upload Dialog with this employee pre-selected

**Letters table:**

```
shadcn/ui: Table (simple, not full DataTable -- the list will typically have 1-10 items)
```

| Title | Type | Source | Date | Actions |
|---|---|---|---|---|
| Appointment Letter - Priya Sharma | `Appointment` badge | `Generated` badge | 11 Mar 2026 | Download, Delete |
| Signed Offer Letter | -- | `Uploaded` badge | 10 Mar 2026 | Download, Delete |

Column details:
- **Title:** `font-medium` -- the letter's descriptive title
- **Type:** Badge with the template type color scheme (same as Template Management table). Only shown for generated letters. Uploaded documents show an em dash.
- **Source:** Badge indicating origin:
  - Generated: `bg-blue-50 text-blue-700 border-blue-200` with "Generated" text
  - Uploaded: `bg-gray-100 text-gray-600 border-gray-200` with "Uploaded" text
- **Date:** Formatted date ("11 Mar 2026"). Relative time in tooltip.
- **Actions:** Two icon buttons:
  - Download (HugeIcon: `Download04Icon`, `Button variant="ghost" size="icon"`)
  - Delete (HugeIcon: `Delete02Icon`, `Button variant="ghost" size="icon"`, `text-muted-foreground hover:text-destructive`)

**Sorting:** Newest first (by `createdAt`).

### Micro-Interactions

- **Download click:** The download button briefly shows a spinner (200ms), then the browser's native download dialog appears. Sonner toast: "Downloading Appointment Letter..." If the download URL generation fails: toast in red: "Couldn't generate download link. Please try again."

- **Delete click:** Opens a shadcn AlertDialog:
  - Title: "Delete Appointment Letter - Priya Sharma?"
  - Description: "This will permanently remove this letter and its PDF file. This action cannot be undone."
  - Cancel button (`variant="outline"`) | Delete button (`variant="destructive"`)
  - On confirm: Row fades out with `animate-out fade-out duration-300`. Table re-renders. Sonner toast: "Letter deleted." No undo for deletions -- the AlertDialog IS the safety net.

- **New letter appears:** When a letter is generated or uploaded (from the Letter Management page or the Upload Dialog), and the employee detail page is still open, the new letter row appears at the top of the table with `animate-in fade-in slide-in-from-top-2 duration-200`. The count badge increments.

- **Real-time update:** If another HR user generates a letter for this employee while this page is open, the new row slides in with the same animation. Convex real-time subscription handles this automatically.

### Empty State

If the employee has no letters:

```
Centered in the section area:
HugeIcon: FileBlankIcon (size 48, text-muted-foreground)
"No letters on file"
"Generate a letter from a template or upload an existing document."
Two buttons: "Generate Letter" (variant="default") | "Upload Document" (variant="outline")
```

The empty state buttons duplicate the section header buttons. Redundancy is intentional -- in the empty state, the header buttons might be visually disconnected from the empty state message. Having action buttons right where the user's eyes are (below the empty state message) reduces the distance between recognizing the empty state and taking action.

### Anti-Patterns to Avoid
- Do NOT show a preview/thumbnail of the PDF in the table. PDF thumbnails are expensive to generate and add visual noise. The title and type badge provide sufficient identification. The user will download the PDF to view it.
- Do NOT paginate this table. An employee will typically have 1-10 letters. Pagination at this scale adds friction without value.
- Do NOT show the "Generated by" field in the table. It is metadata that matters for audit trails (stored in the database), not for the HR user scanning the list. It can be shown in a tooltip on the "Generated" badge if needed.

### Mobile Behavior
- Table switches to a card layout: each letter is a Card showing Title (font-medium), Type + Source badges on a row, Date, and Download/Delete buttons
- Action buttons in the section header stack vertically or collapse into a single "+" DropdownMenu
- Empty state buttons stack vertically

---

## Page 6: Self-Service My Letters (Employee View)

### Page Purpose
Let an employee view and download all letters that HR has issued to them -- a read-only document archive.

### User Arrives With...
**Mindset:** The employee (salesperson or admin in self-service mode) is on their "My HR" page and has navigated to the letters section. They want to find and download a specific letter -- perhaps their appointment letter for a bank loan application, or a salary certificate for a visa.
**Emotion:** Purposeful with a tinge of urgency. People usually need letters for external purposes (banks, embassies, other companies). They want to find the document quickly, download it, and get back to what they were doing.
**Goal:** Find the letter. Download it. Under 15 seconds.

### The Attention Flow

1. **First 0.5s:** "My Letters" section header with a count. Instant context: "I have X letters."
2. **First 2s:** Scan the table for the letter they need. Title and Type are the primary identifiers.
3. **First 5s:** Click "Download" on the correct letter. Done.

### Component Map

This section lives within the "My HR" self-service page (`/dashboard/hr` for salespeople, `/admin/hr` for admins). It is one of several self-service sections (Onboarding, Letters, Payslips, Insurance, Queries, Suggestions). The `employee-letters-list.tsx` component is shared between the HR employee detail view and this self-service view -- the only difference is:
- Self-service: no Delete button, no "Generate Letter" or "Upload Document" actions
- Self-service: the employee selector is not needed (always shows the current user's letters)

**Section header:**

```
Layout: flex justify-between items-center, mb-4
Left: "My Letters" (Geist Sans, text-lg, font-semibold) + Badge showing count
Right: (empty -- no actions for employees)
```

**Letters table:**

```
shadcn/ui: Table (simple)
```

| Title | Type | Date | |
|---|---|---|---|
| Appointment Letter - Priya Sharma | `Appointment` badge | 11 Mar 2026 | Download |

Column details:
- **Title:** `font-medium`
- **Type:** Badge with template type color scheme. Uploaded documents show "Document" in gray badge.
- **Date:** Formatted date with relative time in tooltip
- **Download:** Button (`variant="outline" size="sm"`, HugeIcon: `Download04Icon`) -- the ONLY action available

No "Source" column (the employee does not need to know if a letter was generated from a template or uploaded). No "Delete" action. No editing. Pure read + download.

**Sorting:** Newest first.

### Micro-Interactions

- **Download click:** Same behavior as HR view -- brief spinner, then native browser download. Sonner toast: "Downloading Appointment Letter..."

- **New letter notification:** When HR generates or uploads a letter for this employee, the self-service view updates in real-time (Convex subscription). The new row appears at the top with `animate-in fade-in slide-in-from-top-2`. A Sonner info toast: "New letter available: Appointment Letter" -- this is a moment of delight. The employee sees their document appear without refreshing.

- **Table row hover:** `bg-muted/50` background on hover. The download button in the hovered row gains slightly more visual prominence (`opacity transition from 70% to 100%`).

### Empty State

```
Centered in the section area:
HugeIcon: FileBlankIcon (size 48, text-muted-foreground)
"No letters yet"
"Letters issued by HR will appear here. You can download them anytime."
```

No action buttons in the empty state -- the employee cannot create letters. The message sets the expectation that letters come from HR.

### Delight Opportunities

1. **"New" indicator:** Letters issued in the last 7 days show a small "New" badge (primary color, tiny, next to the title). This helps returning users spot what has been added since their last visit. The badge disappears after the user downloads the letter (tracked via a `lastViewed` concept, or simply after 7 days).

2. **Quick letter count in My HR sidebar/tab:** The "My Letters" tab or section in the self-service navigation shows a count badge. When a new letter is added, the count increments in real-time. If the user is on a different section, they see the count update -- a subtle signal that something new is waiting for them.

3. **Download feedback:** After a successful download, the download button briefly shows a checkmark (replacing the download icon) for 1.5 seconds before reverting. This micro-confirmation eliminates the "did that work?" doubt that users feel when clicking download buttons.

### Anti-Patterns to Avoid
- Do NOT show any editing, deletion, or generation capabilities to the employee. This is a read-only view. Buttons that the user cannot use create confusion and erode trust.
- Do NOT show metadata the employee does not care about (generated by, storage ID, internal template type). Keep it simple: title, type, date, download.
- Do NOT require the employee to navigate to a separate page for their letters. The letters section should be part of the self-service hub page alongside onboarding, payslips, etc.
- Do NOT use infinite scroll or complex filtering. An employee will have at most 5-15 letters in their career at this company. A simple table is sufficient.

### Mobile Behavior
- Table switches to card layout: each letter is a compact Card with Title, Type badge, Date on one row, and a full-width "Download" button
- Cards are stacked vertically with `space-y-2`
- The empty state is centered with reduced icon size (32px)

---

## Cross-Cutting UX Patterns for Phase B

### Pattern: Placeholder Visual Language

Throughout Phase B, the `{{placeholder}}` syntax appears in multiple contexts. The visual treatment must be consistent:

| Context | Placeholder Appearance |
|---|---|
| Template preview (read-only) | `text-primary font-medium` within monospace text |
| Template editor (textarea) | Plain monospace text -- no styling possible in a textarea, the `{{...}}` syntax is self-documenting |
| Placeholder status bar (generation flow) | `Badge variant="secondary"` with green (filled) or orange (needs input) tinting |
| Placeholder reference bar (template editor) | `Badge variant="outline"` with monospace text, clickable |
| Missing auto-fill fallback | `[field not set]` in the resolved text, orange status pill in the bar |

### Pattern: PDF Generation Loading State

PDF generation takes 2-4 seconds. The loading pattern is consistent everywhere it occurs:

1. Trigger button enters loading state (spinner + "Generating..." text)
2. Thin indeterminate progress bar appears below the button (`h-1 bg-primary`, animated left-to-right shimmer)
3. On success: progress bar fills to 100%, button transforms to success state (green bg, checkmark icon), download link appears with animate-in
4. On error: progress bar disappears, button reverts to default, error toast with retry

### Pattern: Document Type Badges

Letter types have consistent color badges across all surfaces:

| Type | Background | Text | Border |
|---|---|---|---|
| Appointment | `bg-green-50` | `text-green-700` | `border-green-200` |
| Warning | `bg-red-50` | `text-red-700` | `border-red-200` |
| Experience | `bg-blue-50` | `text-blue-700` | `border-blue-200` |
| Termination | `bg-gray-100` | `text-gray-600` | `border-gray-200` |
| Salary Certificate | `bg-purple-50` | `text-purple-700` | `border-purple-200` |
| Increment | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` |
| Uploaded (external) | `bg-gray-100` | `text-gray-600` | `border-gray-200` |

These badges always use `shadcn Badge` with custom className overrides. Zero border-radius. Monospace text for the label.

### Pattern: Employee Combobox (Shared Component)

The employee selector appears in two places: letter generation and document upload. It should be a single shared component (`components/hr/shared/employee-combobox.tsx`):

```
shadcn/ui: Popover + Command (Combobox pattern)
Trigger: Input-like display showing selected employee name or placeholder
Popover content: Command with search input + scrollable list
Each item: Employee name (font-medium) + Designation + Department (text-xs text-muted-foreground)
Empty state: "No employees found"
```

The combobox supports a `defaultValue` prop for pre-selection (used when navigating from an employee's detail page).

### Pattern: Activity Logging for Phase B

All Phase B mutations log to the existing `activityLogs` table:

| Action | Log Entry |
|---|---|
| Letter generated | "[HR User] generated Appointment Letter for [Employee]" |
| Letter uploaded | "[HR User] uploaded document 'Signed Offer Letter' for [Employee]" |
| Letter deleted | "[HR User] deleted Appointment Letter for [Employee]" |
| Template updated | "[HR User] updated Warning Letter template" |
| Template deactivated | "[HR User] deactivated Salary Certificate template" |

These entries appear in:
- The global activity log (admin/HR view)
- The employee's activity history (on their detail page)

---

## Page Flow Map for Phase B

```
/hr/letters (Letter Management)
  |
  +---> Generate Letter flow (inline, within the page)
  |       |
  |       +---> Select template + employee
  |       +---> Preview/edit content
  |       +---> Generate PDF -> success + download
  |       +---> Letter appears in employee's profile
  |
  +---> Template Management (inline, below generation)
  |       |
  |       +---> Expand template -> preview
  |       +---> Edit template -> save
  |       +---> Toggle active/inactive
  |
  +---> Upload Document (Dialog)
          |
          +---> Select employee + title + file
          +---> Upload -> letter record created

/hr/employees/[id] (Employee Detail -- updated)
  |
  +---> Letters section
          |
          +---> View letters table
          +---> Download letter
          +---> Delete letter (confirmation)
          +---> "Generate Letter" -> navigates to /hr/letters?employee=[id]
          +---> "Upload Document" -> opens upload Dialog

/dashboard/hr (Salesperson Self-Service -- My Letters section)
  |
  +---> View own letters (read-only)
  +---> Download letter

/admin/hr (Admin Self-Service -- My Letters section)
  |
  +---> Same as salesperson self-service
```

---

## Design Tokens Quick Reference for Phase B

```css
/* Phase B-specific tokens (all within the existing design system) */

/* Template type badge colors */
Appointment:          bg-green-50 text-green-700 border-green-200
Warning:              bg-red-50 text-red-700 border-red-200
Experience:           bg-blue-50 text-blue-700 border-blue-200
Termination:          bg-gray-100 text-gray-600 border-gray-200
Salary Certificate:   bg-purple-50 text-purple-700 border-purple-200
Increment:            bg-emerald-50 text-emerald-700 border-emerald-200

/* Source badges */
Generated:            bg-blue-50 text-blue-700 border-blue-200
Uploaded:             bg-gray-100 text-gray-600 border-gray-200

/* Placeholder styling */
Preview (read-only):  text-primary font-medium          /* Warm red/orange, bold */
Status pill (filled): bg-green-50 text-green-700 border-green-200
Status pill (manual):  bg-orange-50 text-orange-700 border-orange-200
Missing auto-fill:    bg-orange-50 text-orange-700 border-orange-200

/* Template editor accent */
Edit mode indicator:  border-l-4 border-l-primary

/* Animation sequences */
Step reveal:          animate-in fade-in slide-in-from-bottom-2 duration-200
Row expand:           animate-in fade-in slide-in-from-top-1 duration-150
New letter row:       animate-in fade-in slide-in-from-top-2 duration-200
Delete row:           animate-out fade-out duration-300
Success button:       transition-colors duration-300 (to green)
Placeholder fill:     transition-colors duration-300 (orange to green)

/* Spacing */
Page padding:         p-6 (desktop), p-4 (mobile)
Section gap:          space-y-8 (between major sections)
Card internal:        p-4 or p-6, space-y-4 between elements
Table cell:           px-4 py-3
```

---

## Implementation Priority Order for Phase B

1. **Letter Templates schema + seed mutation** -- foundation for everything
2. **Employee Letters schema + CRUD** -- the data layer
3. **PDF generation action** (`pdf-lib`) -- the core capability
4. **Template list + inline expand/preview** -- template management surface
5. **Template inline editor** -- editing capability
6. **Letter generation flow** (template select + employee select + preview/edit + generate) -- the primary user flow
7. **Document upload Dialog** -- secondary flow
8. **Employee letters section on detail page** -- HR consumption surface
9. **Self-service My Letters section** -- employee consumption surface
10. **Activity logging integration** -- audit trail

Items 1-3 are backend/API work. Items 4-7 are the HR-facing UI. Items 8-9 are consumption surfaces that reuse the `employee-letters-list.tsx` component. Item 10 extends the existing activity log system.
