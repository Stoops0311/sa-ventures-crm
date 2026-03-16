// Training constants
export const TOTAL_TRAINING_DAYS = 7

// Attendance constants
export const SESSION_GAP_MS = 5 * 60 * 1000 // 5 minutes — gap before new session starts
export const FULL_DAY_HOURS = 6 // hours threshold for "full day" vs "partial"

export const LEAD_STATUSES = [
  "New",
  "No Response",
  "Not Interested",
  "Follow Up",
  "Other Requirement",
  "Visit Scheduled",
  "Visit Done",
  "Booking Done",
  "Closed Won",
  "Closed Lost",
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_SOURCES = [
  "99acres",
  "magicbricks",
  "social_media",
  "dsm",
  "manual",
  "website",
  "referral",
  "other",
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]

export function isValidLeadStatus(status: string): status is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(status)
}

export function isValidLeadSource(source: string): source is LeadSource {
  return (LEAD_SOURCES as readonly string[]).includes(source)
}

export const CLOSED_STATUSES: LeadStatus[] = ["Closed Won", "Closed Lost"]

// HR Module Constants
export const ONBOARDING_CHECKLIST_ITEMS = [
  { key: "submit_pan", label: "Submit PAN card copy" },
  { key: "submit_aadhar", label: "Submit Aadhar card copy" },
  { key: "submit_bank_details", label: "Submit bank account details" },
  { key: "submit_photos", label: "Submit passport-size photos" },
  { key: "sign_offer_letter", label: "Sign offer letter" },
  { key: "complete_personal_info", label: "Complete personal information form" },
  { key: "submit_emergency_contact", label: "Provide emergency contact details" },
] as const

export const UPLOADABLE_CHECKLIST_ITEMS = [
  "submit_pan",
  "submit_aadhar",
  "submit_bank_details",
  "submit_photos",
  "sign_offer_letter",
] as const

export const ONBOARDING_STATUSES = ["pending", "in_progress", "completed"] as const
export type OnboardingStatus = (typeof ONBOARDING_STATUSES)[number]

export const GENDERS = ["male", "female", "other"] as const
export type Gender = (typeof GENDERS)[number]

export const MARITAL_STATUSES = ["single", "married", "divorced", "widowed"] as const
export type MaritalStatus = (typeof MARITAL_STATUSES)[number]

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const
export type BloodGroup = (typeof BLOOD_GROUPS)[number]

export const HR_DEPARTMENTS = [
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "HR",
  "IT",
  "Management",
] as const

export const EMERGENCY_CONTACT_RELATIONS = [
  "Parent",
  "Spouse",
  "Sibling",
  "Child",
  "Friend",
  "Other",
] as const

export const ACTIVE_STATUSES: LeadStatus[] = [
  "New",
  "No Response",
  "Follow Up",
  "Other Requirement",
  "Visit Scheduled",
  "Visit Done",
  "Booking Done",
]

// Letter Template Constants
export const LETTER_TEMPLATE_TYPES = [
  "appointment", "warning", "experience", "termination", "salary_certificate", "increment",
] as const
export type LetterTemplateType = (typeof LETTER_TEMPLATE_TYPES)[number]

export const COMPANY_NAME = "SA Ventures"

export const AUTO_FILL_PLACEHOLDERS = [
  "companyName", "currentDate", "employeeName", "designation",
  "department", "dateOfJoining", "panNumber",
] as const

export const MANUAL_PLACEHOLDERS: Record<LetterTemplateType, string[]> = {
  appointment: [],
  warning: ["warningReason", "warningDetails"],
  experience: ["lastWorkingDate"],
  termination: ["terminationDate", "terminationReason", "lastWorkingDate"],
  salary_certificate: ["grossSalary", "grossSalaryWords", "salaryBreakdown", "purpose"],
  increment: ["previousCtc", "newCtc", "incrementPercentage", "effectiveDate"],
}

// Payroll Constants
export const DEFAULT_SALARY_COMPONENTS = [
  { name: "Basic", type: "earning", order: 1, isCustom: false },
  { name: "HRA", type: "earning", order: 2, isCustom: false },
  { name: "DA", type: "earning", order: 3, isCustom: false },
  { name: "Conveyance Allowance", type: "earning", order: 4, isCustom: false },
  { name: "Medical Allowance", type: "earning", order: 5, isCustom: false },
  { name: "Special Allowance", type: "earning", order: 6, isCustom: false },
  { name: "PF", type: "deduction", order: 7, isCustom: false },
  { name: "ESI", type: "deduction", order: 8, isCustom: false },
  { name: "Professional Tax", type: "deduction", order: 9, isCustom: false },
  { name: "TDS", type: "deduction", order: 10, isCustom: false },
] as const

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const

// HR Query Constants
export const HR_QUERY_TYPES = [
  { value: "salary_certificate", label: "Salary Certificate" },
  { value: "experience_letter", label: "Experience Letter" },
  { value: "leave_encashment", label: "Leave Encashment" },
  { value: "salary_advance", label: "Salary Advance" },
  { value: "address_change", label: "Address Change" },
  { value: "bank_detail_change", label: "Bank Detail Change" },
  { value: "other", label: "Other" },
] as const

export const HR_QUERY_STATUSES = ["open", "in_progress", "resolved", "rejected"] as const
export type HrQueryStatus = (typeof HR_QUERY_STATUSES)[number]

export type HrQueryType = (typeof HR_QUERY_TYPES)[number]["value"]

export function isValidHrQueryType(type: string): type is HrQueryType {
  return HR_QUERY_TYPES.some((t) => t.value === type)
}

export function isValidHrQueryStatus(status: string): status is HrQueryStatus {
  return (HR_QUERY_STATUSES as readonly string[]).includes(status)
}

// Suggestion Constants
export const SUGGESTION_CATEGORIES = [
  { value: "workplace", label: "Workplace" },
  { value: "policy", label: "Policy" },
  { value: "process", label: "Process" },
  { value: "other", label: "Other" },
] as const

export const SUGGESTION_STATUSES = ["new", "reviewed", "implemented", "dismissed"] as const
export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number]

export type SuggestionCategory = (typeof SUGGESTION_CATEGORIES)[number]["value"]

export function isValidSuggestionStatus(status: string): status is SuggestionStatus {
  return (SUGGESTION_STATUSES as readonly string[]).includes(status)
}

export function isValidSuggestionCategory(category: string): category is SuggestionCategory {
  return SUGGESTION_CATEGORIES.some((c) => c.value === category)
}

// Vehicle Module Constants
export const VEHICLE_TYPES = [
  "car", "bike", "van", "suv", "auto_rickshaw", "other",
] as const
export type VehicleType = (typeof VEHICLE_TYPES)[number]

export const FUEL_TYPES = [
  "petrol", "diesel", "cng", "electric", "hybrid",
] as const
export type FuelType = (typeof FUEL_TYPES)[number]

export const VEHICLE_STATUSES = ["active", "inactive", "maintenance"] as const
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]

export const TRIP_STATUSES = ["planned", "in_progress", "completed"] as const
export type TripStatus = (typeof TRIP_STATUSES)[number]

export function isValidVehicleType(type: string): type is VehicleType {
  return (VEHICLE_TYPES as readonly string[]).includes(type)
}

export function isValidFuelType(type: string): type is FuelType {
  return (FUEL_TYPES as readonly string[]).includes(type)
}

export function isValidVehicleStatus(status: string): status is VehicleStatus {
  return (VEHICLE_STATUSES as readonly string[]).includes(status)
}

export function isValidTripStatus(status: string): status is TripStatus {
  return (TRIP_STATUSES as readonly string[]).includes(status)
}

// Messaging Constants
export const MESSAGE_CHANNELS = ["both", "whatsapp", "sms"] as const
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number]

export const MESSAGE_STATUSES = ["pending", "sending", "sent", "failed", "skipped", "cancelled"] as const
export type MessageStatus = (typeof MESSAGE_STATUSES)[number]

export const TRIGGER_TYPES = ["manual", "auto_schedule", "auto_suggest"] as const
export type TriggerType = (typeof TRIGGER_TYPES)[number]

export const AUTO_SCHEDULE_STATUSES: Record<string, { slug: string; delayMs: number }[]> = {
  "Visit Done": [{ slug: "thank_you_visit", delayMs: 3600000 }],
  "Booking Done": [{ slug: "booking_confirmation", delayMs: 0 }],
}

export const AUTO_SUGGEST_STATUSES: string[] = [
  "Follow Up",
  "Visit Scheduled",
  "No Response",
]

export const TEMPLATE_PLACEHOLDERS = [
  "leadName", "leadPhone", "projectName", "projectLocation",
  "projectPriceRange", "salespersonName", "companyName",
] as const

export function isValidMessageChannel(channel: string): channel is MessageChannel {
  return (MESSAGE_CHANNELS as readonly string[]).includes(channel)
}

export function isValidMessageStatus(status: string): status is MessageStatus {
  return (MESSAGE_STATUSES as readonly string[]).includes(status)
}

export function isValidTriggerType(type: string): type is TriggerType {
  return (TRIGGER_TYPES as readonly string[]).includes(type)
}

// Insurance Constants
export const INSURANCE_STATUSES = ["pending", "enrolled", "expired", "renewed"] as const
export type InsuranceStatus = (typeof INSURANCE_STATUSES)[number]

export function isValidInsuranceStatus(status: string): status is InsuranceStatus {
  return (INSURANCE_STATUSES as readonly string[]).includes(status)
}

export const NOMINEE_RELATIONS = ["Spouse", "Parent", "Child", "Sibling", "Other"] as const

export const DEFAULT_LETTER_TEMPLATES: Record<LetterTemplateType, { name: string; content: string }> = {
  appointment: {
    name: "Appointment Letter",
    content: `{{companyName}}
Date: {{currentDate}}

APPOINTMENT LETTER

Dear {{employeeName}},

We are pleased to offer you the position of {{designation}} in the {{department}} department at {{companyName}}, effective {{dateOfJoining}}.

Your compensation and benefits details will be provided separately.

We look forward to your valuable contribution to our organization.

Sincerely,
{{companyName}} Management`,
  },
  warning: {
    name: "Warning Letter",
    content: `{{companyName}}
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
{{companyName}}`,
  },
  experience: {
    name: "Experience Letter",
    content: `{{companyName}}
Date: {{currentDate}}

EXPERIENCE LETTER

To Whom It May Concern,

This is to certify that {{employeeName}} was employed with {{companyName}} as {{designation}} in the {{department}} department from {{dateOfJoining}} to {{lastWorkingDate}}.

During their tenure, they demonstrated professionalism and dedication. We wish them success in future endeavors.

For {{companyName}}
Authorized Signatory`,
  },
  termination: {
    name: "Termination Letter",
    content: `{{companyName}}
Date: {{currentDate}}

TERMINATION LETTER

Dear {{employeeName}},

This letter is to inform you that your employment with {{companyName}} is terminated effective {{terminationDate}}.

Reason: {{terminationReason}}

Please return all company property and complete the exit formalities by {{lastWorkingDate}}.

For {{companyName}}
Authorized Signatory`,
  },
  salary_certificate: {
    name: "Salary Certificate",
    content: `{{companyName}}
Date: {{currentDate}}

SALARY CERTIFICATE

To Whom It May Concern,

This is to certify that {{employeeName}}, {{designation}} at {{companyName}}, draws a monthly gross salary of Rs. {{grossSalary}}/- (Rupees {{grossSalaryWords}} Only).

The salary breakdown is as follows:
{{salaryBreakdown}}

This certificate is issued upon the request of the employee for {{purpose}}.

For {{companyName}}
Authorized Signatory`,
  },
  increment: {
    name: "Increment Letter",
    content: `{{companyName}}
Date: {{currentDate}}

INCREMENT LETTER

Dear {{employeeName}},

We are pleased to inform you that based on your performance, your compensation has been revised effective {{effectiveDate}}.

Previous CTC: Rs. {{previousCtc}}/-
Revised CTC: Rs. {{newCtc}}/-
Increment: {{incrementPercentage}}%

We appreciate your contribution and look forward to your continued excellence.

For {{companyName}}
Authorized Signatory`,
  },
}
