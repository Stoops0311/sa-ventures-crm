# HR Phase B — Documents & Letters

## Overview

Adds document and letter management to the HR module. HR can generate letters from templates (auto-filled with employee data) or upload externally created documents. Employees can view and download their letters from self-service.

**Depends on:** Phase A (employee profiles must exist)

## New Tables

### `letterTemplates`

```ts
letterTemplates: defineTable({
  type: v.string(),        // "appointment" | "warning" | "experience" | "termination" | "salary_certificate" | "increment"
  name: v.string(),
  content: v.string(),     // Template body with {{placeholders}}
  isActive: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("byType", ["type"])
  .index("byIsActive", ["isActive"])
```

### `employeeLetters`

```ts
employeeLetters: defineTable({
  userId: v.id("users"),
  templateType: v.optional(v.string()),       // null if uploaded externally
  title: v.string(),
  storageId: v.id("_storage"),                // PDF in Convex file storage
  fileName: v.string(),
  isGenerated: v.boolean(),                   // true = system-generated, false = uploaded
  generatedBy: v.id("users"),                 // HR user who generated/uploaded
  createdAt: v.number(),
})
  .index("byUserId", ["userId"])
  .index("byUserIdAndType", ["userId", "templateType"])
```

## New Dependency

Add `pdf-lib` to `package.json`:
```
bun add pdf-lib
```

Used in Convex actions for server-side PDF generation. Pure JS, zero native deps, works in any runtime.

## Default Letter Templates

Seeded on first access (or via a seed mutation). Each template uses `{{placeholder}}` syntax:

### 1. Appointment Letter
```
{{companyName}}
Date: {{currentDate}}

APPOINTMENT LETTER

Dear {{employeeName}},

We are pleased to offer you the position of {{designation}} in the {{department}} department at {{companyName}}, effective {{dateOfJoining}}.

Your compensation and benefits details will be provided separately.

We look forward to your valuable contribution to our organization.

Sincerely,
{{companyName}} Management
```

### 2. Warning Letter
```
{{companyName}}
Date: {{currentDate}}

WARNING LETTER

Employee: {{employeeName}}
Designation: {{designation}}
Department: {{department}}
Date of Joining: {{dateOfJoining}}

This letter serves as a formal warning regarding {{warningReason}}.

{{warningDetails}}

We expect immediate improvement in the above-mentioned areas. Failure to comply may result in further disciplinary action.

Authorized Signatory
{{companyName}}
```

### 3. Experience Letter
```
{{companyName}}
Date: {{currentDate}}

EXPERIENCE LETTER

To Whom It May Concern,

This is to certify that {{employeeName}} was employed with {{companyName}} as {{designation}} in the {{department}} department from {{dateOfJoining}} to {{lastWorkingDate}}.

During their tenure, they demonstrated professionalism and dedication. We wish them success in future endeavors.

For {{companyName}}
Authorized Signatory
```

### 4. Termination Letter
```
{{companyName}}
Date: {{currentDate}}

TERMINATION LETTER

Dear {{employeeName}},

This letter is to inform you that your employment with {{companyName}} is terminated effective {{terminationDate}}.

Reason: {{terminationReason}}

Please return all company property and complete the exit formalities by {{lastWorkingDate}}.

For {{companyName}}
Authorized Signatory
```

### 5. Salary Certificate
```
{{companyName}}
Date: {{currentDate}}

SALARY CERTIFICATE

To Whom It May Concern,

This is to certify that {{employeeName}}, {{designation}} at {{companyName}}, draws a monthly gross salary of Rs. {{grossSalary}}/- (Rupees {{grossSalaryWords}} Only).

The salary breakdown is as follows:
{{salaryBreakdown}}

This certificate is issued upon the request of the employee for {{purpose}}.

For {{companyName}}
Authorized Signatory
```

### 6. Increment Letter
```
{{companyName}}
Date: {{currentDate}}

INCREMENT LETTER

Dear {{employeeName}},

We are pleased to inform you that based on your performance, your compensation has been revised effective {{effectiveDate}}.

Previous CTC: Rs. {{previousCtc}}/-
Revised CTC: Rs. {{newCtc}}/-
Increment: {{incrementPercentage}}%

We appreciate your contribution and look forward to your continued excellence.

For {{companyName}}
Authorized Signatory
```

## Available Placeholders

Auto-filled from employee profile + system data:

| Placeholder | Source |
|---|---|
| `{{companyName}}` | Constant: "SA Ventures" |
| `{{currentDate}}` | System date (formatted: "11th March 2026") |
| `{{employeeName}}` | `users.name` |
| `{{designation}}` | `employeeProfiles.designation` |
| `{{department}}` | `employeeProfiles.department` |
| `{{dateOfJoining}}` | `employeeProfiles.dateOfJoining` (formatted) |
| `{{panNumber}}` | `employeeProfiles.panNumber` |
| `{{grossSalary}}` | Calculated from `salaryComponents` (Phase C — shows "N/A" until configured) |

Manual-fill placeholders (HR types these in the editor):

| Placeholder | Used In |
|---|---|
| `{{warningReason}}` | Warning letter |
| `{{warningDetails}}` | Warning letter |
| `{{lastWorkingDate}}` | Experience, Termination |
| `{{terminationDate}}` | Termination |
| `{{terminationReason}}` | Termination |
| `{{grossSalaryWords}}` | Salary certificate |
| `{{salaryBreakdown}}` | Salary certificate |
| `{{purpose}}` | Salary certificate |
| `{{previousCtc}}` | Increment letter |
| `{{newCtc}}` | Increment letter |
| `{{incrementPercentage}}` | Increment letter |
| `{{effectiveDate}}` | Increment letter |

## New Convex Files

### `convex/letterTemplates.ts`

**Queries:**
- `list()` — All active templates. HR/admin only.
- `getById(templateId)` — Single template. HR/admin only.

**Mutations:**
- `upsert(templateId?, fields)` — Create or update template. HR/admin only.
- `seed()` — Internal mutation to create the 6 default templates if none exist. Called on first page load of `/hr/letters`.

### `convex/employeeLetters.ts`

**Queries:**
- `listByUser(userId)` — All letters for an employee. HR/admin: any user. Self-service: own only.
- `getDownloadUrl(letterId)` — Generate signed download URL. HR/admin or letter owner.

**Mutations:**
- `create(userId, title, storageId, fileName, templateType?, isGenerated)` — Create letter record after PDF generation or upload. HR/admin only.
- `remove(letterId)` — Delete a letter and its storage blob. HR/admin only.

**Actions:**
- `generatePdf(content, title)` — Takes filled template text, generates a PDF with:
  - Company header (SA Ventures, bold, centered)
  - Body text (formatted, respecting line breaks)
  - Footer with page number
  - Stores blob in Convex file storage
  - Returns `storageId` and `fileName`

## New Pages

### `/app/hr/letters/page.tsx` — Letter Management

Two sections:

**Section 1: Generate Letter**
- Step 1: Select template from dropdown (shows template type + name)
- Step 2: Select employee from combobox (searchable by name)
- Step 3: Auto-filled preview in a textarea. Auto-filled placeholders are resolved; manual placeholders are highlighted in a different color with placeholder text.
- Step 4: HR edits the text as needed (free-form textarea)
- Step 5: "Generate PDF" button → calls action → shows success toast with download link
- The generated letter appears in the employee's letters list

**Section 2: Templates**
- Table of all templates: Type, Name, Status (active/inactive), Last Updated
- Click template → expands inline to show template content with syntax highlighting for `{{placeholders}}`
- Edit button → opens editable textarea for template content
- No delete (just deactivate via toggle)

### `/app/hr/letters/upload/page.tsx` — Upload Document (or inline dialog on employee detail)
- Select employee from combobox
- Title input
- Drag-and-drop zone for PDF upload (reuse `DragDropZone` pattern from CSV import)
- Upload button → stores file → creates `employeeLetters` record

## Updated Pages

### Employee Detail (`/app/hr/employees/[id]/page.tsx`)
- **Letters section** (previously placeholder): Table of all letters for this employee
  - Columns: Title, Type (badge), Generated/Uploaded (badge), Date, Actions (Download, Delete)
  - "Generate Letter" button → navigates to `/hr/letters` with employee pre-selected
  - "Upload Document" button → opens upload dialog

### Salesperson Self-Service (`/app/dashboard/hr/page.tsx`)
- **My Letters section**: Read-only table of letters addressed to them
  - Columns: Title, Type, Date, Download button
  - Empty state: "No letters yet"

## New Components

### `components/hr/letters/`
- `template-list.tsx` — Table of letter templates with inline expand/edit
- `template-editor.tsx` — Textarea with `{{placeholder}}` syntax highlighting
- `letter-generator.tsx` — Multi-step letter generation flow (select template → select employee → preview/edit → generate)
- `letter-upload-dialog.tsx` — Dialog for uploading external documents
- `employee-letters-list.tsx` — Reusable table of letters for an employee (used in detail page + self-service)
- `placeholder-preview.tsx` — Shows which placeholders are auto-filled vs manual, with visual distinction

## PDF Generation Details

Using `pdf-lib` in a Convex action:

```ts
// Pseudocode for generatePdf action
import { PDFDocument, StandardFonts } from "pdf-lib"

export const generatePdf = action({
  args: { content: v.string(), title: v.string() },
  handler: async (ctx, { content, title }) => {
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

    const page = doc.addPage([595.28, 841.89]) // A4
    const { width, height } = page.getSize()

    // Company header
    page.drawText("SA VENTURES", {
      x: width / 2 - 60, y: height - 50,
      size: 18, font: boldFont,
    })

    // Title
    page.drawText(title.toUpperCase(), {
      x: 50, y: height - 100,
      size: 14, font: boldFont,
    })

    // Body text (line-wrapped)
    // ... wrap and draw content lines ...

    const pdfBytes = await doc.save()
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const storageId = await ctx.storage.store(blob)
    return { storageId, fileName: `${title.replace(/\s+/g, "_")}.pdf` }
  },
})
```

## Verification

1. Navigate to `/hr/letters` → 6 default templates seeded and visible
2. Edit a template's content → save → content persists
3. Select "Appointment Letter" template + select an employee → placeholders auto-fill with employee data
4. Edit the preview text → click "Generate PDF" → PDF stored, letter record created
5. Download the generated PDF → verify content matches preview
6. Upload an external document for an employee → appears in their letters list
7. Employee logs into self-service → sees their letters under "My Letters" → can download
8. Delete a letter from employee detail → removed from storage and DB
9. All operations logged in activity log
