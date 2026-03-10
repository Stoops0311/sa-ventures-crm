# SA CRM — Phase 1 Design Spec

## Overview

A real estate sales CRM for SA Ventures. The company sells multiple residential projects simultaneously. Currently all lead tracking, follow-ups, and sales pipeline management is done via Excel spreadsheets. This CRM replaces that workflow.

**Phase 1 scope:** Admin panel, Lead/Sales CRM (full pipeline), Attendance (presence-based), DSM portal.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack) + Tailwind CSS v4 + shadcn/ui
- **Backend:** Convex (database, real-time queries, server functions)
- **Auth:** Clerk (role-based access control)
- **Attendance:** Convex Presence component (online/offline tracking)
- **WhatsApp/SMS:** Scaffolded as mock in Phase 1 (external API later)
- **Fonts:** Geist (sans), JetBrains Mono (mono — used as default body font)
- **Theme:** Light only. Existing shadcn color tokens (warm red/orange primary). Zero border-radius (sharp corners).
- **Icons:** HugeIcons (already installed)

## User Roles

| Role | Description |
|------|-------------|
| **Admin** | Full system access. Creates projects, imports leads, manages users, views all data and performance stats. Can also work leads directly. |
| **Salesperson** | Works their assigned leads. Sees only their own leads and their own performance stats. Dashboard with today's follow-ups. |
| **DSM** | Third-party agent. Can only add individual leads and view the status of leads they submitted. Fire-and-forget — internal team works the lead. |

### Permissions Matrix

| Capability | Admin | Salesperson | DSM |
|---|:---:|:---:|:---:|
| Import leads (CSV/Excel) | Yes | No | No |
| Add individual lead | Yes | Yes | Yes (only) |
| Work leads | Yes (any) | Yes (own) | No |
| View leads | All | Own assigned | Own submitted |
| Manage projects | Yes | No | No |
| Manage users | Yes | No | No |
| View performance stats | All salespeople | Own stats | No |
| Toggle salesperson availability | Yes | No | No |

## Core Entities

### Users
- Managed via Clerk
- Role stored in Convex (synced from Clerk metadata)
- Fields: name, email, phone, role, isAvailable (for round-robin), createdAt

### Projects
- Created by Admin
- Fields: name, description, location, priceRange, status (active/archived), createdAt
- **Creatives:** Images, brochures, marketing materials attached to a project. Stored as file references (Convex file storage). Salespeople can browse and share these with clients.

### Leads
- Belongs to one project at a time (can be moved between projects)
- Assigned to one salesperson
- Fields: name, mobileNumber, email (optional), budget, projectId, assignedTo, status, source (99acres, social media, DSM, manual, etc.), submittedBy (for DSM leads), followUpDate (nullable), createdAt, updatedAt

### Remarks
- Separate from leads — a lead can have multiple remarks over time
- Fields: leadId, content, createdBy, createdAt
- Each remark addition is also captured in the activity log

### Activity Logs (System-wide)
- Attached to any entity (lead, project, user, etc.)
- Fields: entityType, entityId, action, details (JSON), performedBy, timestamp
- Captures: lead creation, status changes, remark additions, project moves, assignment changes, CSV imports, login/logout events
- Future: WhatsApp messages sent, scheduled messages, etc.
- Immutable — logs are never edited or deleted

### Presence / Attendance
- Uses Convex Presence component
- Tracks: userId, isOnline, lastSeen
- Admin can view who's currently online and historical presence data
- This IS the attendance system — time on CRM = working hours

## Lead Pipeline

### Statuses

| Status | Description |
|--------|-------------|
| **New** | Just imported/added, not yet contacted |
| **No Response** | Called but didn't pick up |
| **Not Interested** | Contacted, declined |
| **Follow Up** | Interested, has a scheduled follow-up date |
| **Other Requirement** | Interested but in a different project — can be moved |
| **Visit Scheduled** | Site visit appointment set |
| **Visit Done** | Completed site visit |
| **Booking Done** | Client has committed/booked |
| **Closed Won** | Deal completed |
| **Closed Lost** | Deal fell through |

- Statuses are NOT strictly linear — a salesperson can move a lead to any status
- **Follow Up** requires a follow-up date to be set
- Every status change is logged in the activity log
- **Other Requirement** is a signal to potentially move the lead to a different project

### Lead Lifecycle

1. **Import:** Admin uploads CSV from 99acres (or other source). System parses and creates leads.
2. **Allocation:** Round-robin with override. System auto-distributes across available salespeople. Admin can toggle salespeople off (absent/unavailable) and reassign before confirming.
3. **Working:** Salesperson calls, updates status, adds remarks, sets follow-ups.
4. **Follow-ups:** Dashboard shows "Today's Follow-ups" section — all leads with follow-up date = today (and overdue highlighted).
5. **Resolution:** Lead ends at Closed Won, Closed Lost, or stays in pipeline.

## CSV Import Flow

1. Admin uploads a CSV/Excel file
2. System parses and shows a preview (column mapping if needed — 99acres has a known format)
3. Admin selects which project these leads belong to
4. System runs round-robin allocation across available salespeople
5. Admin reviews the allocation — can reassign individual leads or toggle salespeople off
6. Admin confirms — leads are created, activity logs generated

## DSM Flow

1. DSM logs in via Clerk (separate DSM role)
2. Sees a simple dashboard: "Add Lead" form + list of their submitted leads with current statuses
3. Adds a lead: name, mobile number, project interest, any notes
4. Lead enters the system as "New" and goes through normal allocation
5. DSM can view status updates on their leads but cannot modify them
6. Payment/commission tracking is out of scope for Phase 1

## Dashboards

### Admin Dashboard
- **Overview stats:** Total leads, leads by status (pipeline breakdown), leads by project
- **Salesperson performance:** Cards or table showing each salesperson's stats — leads assigned, calls made (status changes from New/No Response), conversion rate, active leads
- **Presence:** Who's online right now
- **Recent activity:** System-wide activity log feed
- **Quick actions:** Import CSV, create project, manage users

### Salesperson Dashboard
- **Today's Follow-ups:** Priority section — leads with follow-up date = today, overdue highlighted
- **My Leads:** Table/list of all assigned leads, filterable by status, searchable
- **My Stats:** Personal performance metrics — leads assigned, contacted, follow-ups due, conversions
- **Lead Detail View:** Full lead info, remarks history, activity log, status change controls, follow-up scheduling
- **Project Creatives:** Browse creatives for the lead's project (for sharing with clients)

### DSM Dashboard
- **Add Lead:** Simple form
- **My Submissions:** List of leads they've submitted with current status

## Notification System (Phase 1)

- Dashboard-only — no external notifications
- "Today's Follow-ups" section on salesperson dashboard
- Overdue follow-ups highlighted (past their follow-up date)
- Future phases: WhatsApp reminders, SMS, browser push

## WhatsApp Scaffold (Phase 1 Mock)

- Data model includes a `scheduledMessages` table: leadId, message, scheduledAt, status (pending/sent/failed), sentAt
- UI has a "Schedule WhatsApp Message" button on the lead detail view
- In Phase 1, messages are created in "pending" status but never actually sent
- When the external WhatsApp API is connected in a future phase, a Convex cron job will pick up pending messages and send them

## Future Phases (Out of Scope)

- HR software (payroll, documents, recruitment)
- Accounts
- Vehicle management (simple log table with special role)
- After-sales process + possession tracking
- Training material (PDFs, video learning)
- Productivity tables
- WhatsApp API integration (real messages)
- SMS integration
- Website integration
- Android app
