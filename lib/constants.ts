// Project Constants
export const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "plot", label: "Plot" },
  { value: "penthouse", label: "Penthouse" },
  { value: "row_house", label: "Row House" },
  { value: "commercial", label: "Commercial" },
  { value: "studio", label: "Studio" },
  { value: "duplex", label: "Duplex" },
] as const

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number]["value"]

export const CONSTRUCTION_STATUSES = [
  { value: "new_launch", label: "New Launch", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "under_construction", label: "Under Construction", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "ready_to_move", label: "Ready to Move", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
] as const

export type ConstructionStatusValue = (typeof CONSTRUCTION_STATUSES)[number]["value"]

export function getConstructionStatusStyle(status: string) {
  return (
    CONSTRUCTION_STATUSES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    }
  )
}

export const TRANSACTION_TYPES = [
  { value: "new_property", label: "New Property" },
  { value: "resale", label: "Resale" },
] as const

export type TransactionTypeValue = (typeof TRANSACTION_TYPES)[number]["value"]

export const OWNERSHIP_TYPES = [
  { value: "freehold", label: "Freehold" },
  { value: "leasehold", label: "Leasehold" },
  { value: "cooperative", label: "Co-operative Society" },
  { value: "power_of_attorney", label: "Power of Attorney" },
] as const

export type OwnershipTypeValue = (typeof OWNERSHIP_TYPES)[number]["value"]

export const FURNISHING_STATUSES = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi_furnished", label: "Semi-Furnished" },
  { value: "furnished", label: "Furnished" },
] as const

export type FurnishingStatusValue = (typeof FURNISHING_STATUSES)[number]["value"]

export const POWER_BACKUP_OPTIONS = [
  { value: "full", label: "Full" },
  { value: "partial", label: "Partial" },
  { value: "none", label: "None" },
  { value: "generator", label: "Generator" },
] as const

export type PowerBackupValue = (typeof POWER_BACKUP_OPTIONS)[number]["value"]

export const FACING_OPTIONS = [
  { value: "north", label: "North" },
  { value: "south", label: "South" },
  { value: "east", label: "East" },
  { value: "west", label: "West" },
  { value: "north_east", label: "North-East" },
  { value: "north_west", label: "North-West" },
  { value: "south_east", label: "South-East" },
  { value: "south_west", label: "South-West" },
] as const

export type FacingValue = (typeof FACING_OPTIONS)[number]["value"]

export const OVERLOOKING_OPTIONS = [
  { value: "garden", label: "Garden" },
  { value: "pool", label: "Pool" },
  { value: "main_road", label: "Main Road" },
  { value: "park", label: "Park" },
  { value: "open_area", label: "Open Area" },
  { value: "hills", label: "Hills" },
  { value: "sea", label: "Sea" },
  { value: "lake", label: "Lake" },
  { value: "city_view", label: "City View" },
] as const

export type OverlookingValue = (typeof OVERLOOKING_OPTIONS)[number]["value"]

export const LANDMARK_TYPES = [
  { value: "school", label: "School" },
  { value: "hospital", label: "Hospital" },
  { value: "metro", label: "Metro Station" },
  { value: "railway", label: "Railway Station" },
  { value: "bus_stop", label: "Bus Stop" },
  { value: "mall", label: "Shopping Mall" },
  { value: "atm", label: "ATM / Bank" },
  { value: "restaurant", label: "Restaurant" },
  { value: "airport", label: "Airport" },
  { value: "park", label: "Park" },
] as const

export type LandmarkTypeValue = (typeof LANDMARK_TYPES)[number]["value"]

export const LEAD_STATUSES = [
  {
    value: "New",
    label: "New",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    borderLeft: "border-l-blue-500",
  },
  {
    value: "No Response",
    label: "No Response",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    borderLeft: "border-l-yellow-500",
  },
  {
    value: "Not Interested",
    label: "Not Interested",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    borderLeft: "border-l-gray-400",
  },
  {
    value: "Follow Up",
    label: "Follow Up",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    borderLeft: "border-l-orange-500",
  },
  {
    value: "Other Requirement",
    label: "Other Requirement",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    borderLeft: "border-l-amber-500",
  },
  {
    value: "Visit Scheduled",
    label: "Visit Scheduled",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    borderLeft: "border-l-purple-500",
  },
  {
    value: "Visit Done",
    label: "Visit Done",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    borderLeft: "border-l-indigo-500",
  },
  {
    value: "Booking Done",
    label: "Booking Done",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    borderLeft: "border-l-emerald-500",
  },
  {
    value: "Closed Won",
    label: "Closed Won",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    borderLeft: "border-l-green-500",
  },
  {
    value: "Closed Lost",
    label: "Closed Lost",
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-200",
    borderLeft: "border-l-red-500",
  },
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]["value"]

export const LEAD_SOURCES = [
  { value: "99acres", label: "99acres" },
  { value: "magicbricks", label: "MagicBricks" },
  { value: "social_media", label: "Social Media" },
  { value: "dsm", label: "DSM" },
  { value: "manual", label: "Manual" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "other", label: "Other" },
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]["value"]

export const USER_ROLES = [
  {
    value: "admin",
    label: "Admin",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  {
    value: "salesperson",
    label: "Salesperson",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  {
    value: "dsm",
    label: "DSM",
    bg: "bg-gray-100",
    text: "text-gray-700",
    border: "border-gray-200",
  },
  {
    value: "hr",
    label: "HR",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
  },
  {
    value: "vehicle",
    label: "Vehicle",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    border: "border-cyan-200",
  },
  {
    value: "receptionist",
    label: "Receptionist",
    bg: "bg-pink-50",
    text: "text-pink-700",
    border: "border-pink-200",
  },
] as const

export type UserRole = (typeof USER_ROLES)[number]["value"]

export function getStatusStyle(status: string) {
  return (
    LEAD_STATUSES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
      borderLeft: "border-l-gray-400",
    }
  )
}

export const ONBOARDING_STATUSES = [
  {
    value: "pending",
    label: "Pending",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  {
    value: "in_progress",
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  {
    value: "completed",
    label: "Completed",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
] as const

export type OnboardingStatusValue = (typeof ONBOARDING_STATUSES)[number]["value"]

export function getOnboardingStatusStyle(status: string) {
  return (
    ONBOARDING_STATUSES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

export function getRoleStyle(role: string) {
  return (
    USER_ROLES.find((r) => r.value === role) ?? {
      value: role,
      label: role,
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

export const LETTER_TYPE_STYLES = [
  { value: "appointment", label: "Appointment", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "warning", label: "Warning", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  { value: "experience", label: "Experience", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "termination", label: "Termination", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
  { value: "salary_certificate", label: "Salary Certificate", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { value: "increment", label: "Increment", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
] as const

export type LetterTypeValue = (typeof LETTER_TYPE_STYLES)[number]["value"]

export function getLetterTypeStyle(type: string) {
  return (
    LETTER_TYPE_STYLES.find((s) => s.value === type) ?? {
      value: type,
      label: type,
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    }
  )
}

// HR Query Status Styles
export const HR_QUERY_STATUS_STYLES = [
  { value: "open", label: "Open", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "in_progress", label: "In Progress", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "resolved", label: "Resolved", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "rejected", label: "Rejected", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
] as const

export type HrQueryStatusValue = (typeof HR_QUERY_STATUS_STYLES)[number]["value"]

export function getHrQueryStatusStyle(status: string) {
  return (
    HR_QUERY_STATUS_STYLES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

// Insurance Status Styles
export const INSURANCE_STATUS_STYLES = [
  { value: "pending", label: "Pending", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "enrolled", label: "Enrolled", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "expired", label: "Expired", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  { value: "renewed", label: "Renewed", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
] as const

export type InsuranceStatusValue = (typeof INSURANCE_STATUS_STYLES)[number]["value"]

export function getInsuranceStatusStyle(status: string) {
  return (
    INSURANCE_STATUS_STYLES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

// Suggestion Status Styles
export const SUGGESTION_STATUS_STYLES = [
  { value: "new", label: "New", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "reviewed", label: "Reviewed", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "implemented", label: "Implemented", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "dismissed", label: "Dismissed", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
] as const

export type SuggestionStatusValue = (typeof SUGGESTION_STATUS_STYLES)[number]["value"]

export function getSuggestionStatusStyle(status: string) {
  return (
    SUGGESTION_STATUS_STYLES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

// Vehicle Type Styles
export const VEHICLE_TYPE_STYLES = [
  { value: "car", label: "Car", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "bike", label: "Bike", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  { value: "van", label: "Van", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { value: "suv", label: "SUV", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { value: "auto_rickshaw", label: "Auto Rickshaw", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "other", label: "Other", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
] as const

export type VehicleTypeValue = (typeof VEHICLE_TYPE_STYLES)[number]["value"]

export function getVehicleTypeStyle(type: string) {
  return (
    VEHICLE_TYPE_STYLES.find((s) => s.value === type) ?? {
      value: type,
      label: type,
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    }
  )
}

// Fuel Type Styles
export const FUEL_TYPE_STYLES = [
  { value: "petrol", label: "Petrol", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  { value: "diesel", label: "Diesel", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { value: "cng", label: "CNG", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "electric", label: "Electric", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  { value: "hybrid", label: "Hybrid", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
] as const

export type FuelTypeValue = (typeof FUEL_TYPE_STYLES)[number]["value"]

export function getFuelTypeStyle(type: string) {
  return (
    FUEL_TYPE_STYLES.find((s) => s.value === type) ?? {
      value: type,
      label: type,
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    }
  )
}

// Vehicle Status Styles
export const VEHICLE_STATUS_STYLES = [
  { value: "active", label: "Active", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "inactive", label: "Inactive", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
  { value: "maintenance", label: "Maintenance", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
] as const

export type VehicleStatusValue = (typeof VEHICLE_STATUS_STYLES)[number]["value"]

export function getVehicleStatusStyle(status: string) {
  return (
    VEHICLE_STATUS_STYLES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    }
  )
}

// Trip Status Styles
export const TRIP_STATUS_STYLES = [
  { value: "planned", label: "Planned", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "in_progress", label: "In Progress", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "completed", label: "Completed", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
] as const

export type TripStatusValue = (typeof TRIP_STATUS_STYLES)[number]["value"]

export function getTripStatusStyle(status: string) {
  return (
    TRIP_STATUS_STYLES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    }
  )
}

// Message Status Styles
export const MESSAGE_STATUS_STYLES = [
  { value: "pending", label: "Pending", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "sending", label: "Sending", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "sent", label: "Sent", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "failed", label: "Failed", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  { value: "skipped", label: "Skipped", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
  { value: "cancelled", label: "Cancelled", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
] as const

export type MessageStatusValue = (typeof MESSAGE_STATUS_STYLES)[number]["value"]

export function getMessageStatusStyle(status: string) {
  return (
    MESSAGE_STATUS_STYLES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

export const TRIGGER_TYPE_STYLES = [
  { value: "manual", label: "Manual", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  { value: "auto_schedule", label: "Auto", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { value: "auto_suggest", label: "Suggested", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
] as const

export function getTriggerTypeStyle(type: string) {
  return (
    TRIGGER_TYPE_STYLES.find((s) => s.value === type) ?? {
      value: type,
      label: type,
      bg: "bg-gray-100",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

// Article Status Styles
export const ARTICLE_STATUS_STYLES = [
  { value: "draft", label: "Draft", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "published", label: "Published", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
] as const

export type ArticleStatusValue = (typeof ARTICLE_STATUS_STYLES)[number]["value"]

export function getArticleStatusStyle(status: string) {
  return (
    ARTICLE_STATUS_STYLES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

// Inquiry Status Styles
export const INQUIRY_STATUS_STYLES = [
  { value: "new", label: "New", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "contacted", label: "Contacted", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "closed", label: "Closed", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
] as const

export type InquiryStatusValue = (typeof INQUIRY_STATUS_STYLES)[number]["value"]

export const INQUIRY_TYPE_STYLES = [
  { value: "inquiry", label: "Inquiry", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "partner", label: "Partner", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
] as const

export type InquiryTypeValue = (typeof INQUIRY_TYPE_STYLES)[number]["value"]

export function getInquiryTypeStyle(type: string | undefined) {
  return (
    INQUIRY_TYPE_STYLES.find((s) => s.value === type) ?? {
      value: "inquiry",
      label: "Inquiry",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    }
  )
}

export function getInquiryStatusStyle(status: string) {
  return (
    INQUIRY_STATUS_STYLES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

// After-Sales Step Styles
export const AFTER_SALES_STEP_STYLES = [
  { value: "booking_form_fillup", label: "Booking Form Fill-up", shortLabel: "Booking Form", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "share_project_documents", label: "Share Project Documents", shortLabel: "Project Docs", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  { value: "loan_document_collection", label: "Loan Document Collection", shortLabel: "Loan Docs", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { value: "loan_processing", label: "Loan Processing", shortLabel: "Loan Processing", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { value: "ocr_payment_collection", label: "OCR / Down Payment", shortLabel: "OCR Payment", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { value: "draft_agreement_preparation", label: "Draft Agreement", shortLabel: "Draft Agreement", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  { value: "stamp_duty_payment", label: "Stamp Duty Payment", shortLabel: "Stamp Duty", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  { value: "registration", label: "Property Registration", shortLabel: "Registration", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  { value: "original_document_collection", label: "Original Documents", shortLabel: "Original Docs", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  { value: "bank_disbursement", label: "Bank Disbursement", shortLabel: "Disbursement", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
] as const

export type AfterSalesStepValue = (typeof AFTER_SALES_STEP_STYLES)[number]["value"]

export function getAfterSalesStepStyle(step: string) {
  return (
    AFTER_SALES_STEP_STYLES.find((s) => s.value === step) ?? {
      value: step,
      label: step,
      shortLabel: step,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

// After-Sales Process Status Styles
export const AFTER_SALES_STATUS_STYLES = [
  { value: "in_progress", label: "In Progress", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "completed", label: "Completed", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "on_hold", label: "On Hold", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
] as const

export type AfterSalesStatusValue = (typeof AFTER_SALES_STATUS_STYLES)[number]["value"]

export function getAfterSalesStatusStyle(status: string) {
  return (
    AFTER_SALES_STATUS_STYLES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

// Article Categories
export const ARTICLE_CATEGORIES = [
  { value: "market_news", label: "Market News" },
  { value: "tips", label: "Tips & Guides" },
  { value: "company_updates", label: "Company Updates" },
  { value: "investment", label: "Investment" },
  { value: "lifestyle", label: "Lifestyle" },
] as const

export type ArticleCategoryValue = (typeof ARTICLE_CATEGORIES)[number]["value"]

// HR Query Type Styles (for badge display)
export const HR_QUERY_TYPE_STYLES = [
  { value: "salary_certificate", label: "Salary Certificate" },
  { value: "experience_letter", label: "Experience Letter" },
  { value: "leave_encashment", label: "Leave Encashment" },
  { value: "salary_advance", label: "Salary Advance" },
  { value: "address_change", label: "Address Change" },
  { value: "bank_detail_change", label: "Bank Detail Change" },
  { value: "other", label: "Other" },
] as const

export function getHrQueryTypeLabel(type: string) {
  return HR_QUERY_TYPE_STYLES.find((t) => t.value === type)?.label ?? type
}

// Visit Check-in Styles
export const VISIT_CHECKIN_STYLES = [
  { value: "expected", label: "Expected", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "arrived", label: "Arrived", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  { value: "no_show", label: "No Show", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
] as const

export type VisitCheckinValue = (typeof VISIT_CHECKIN_STYLES)[number]["value"]

export function getVisitCheckinStyle(status: string) {
  return (
    VISIT_CHECKIN_STYLES.find((s) => s.value === status) ?? {
      value: status,
      label: status,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

// Visit Location Styles
export const VISIT_LOCATION_STYLES = [
  { value: "office", label: "Office", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { value: "site", label: "Site Visit", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { value: "other", label: "Other", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
] as const

export type VisitLocationValue = (typeof VISIT_LOCATION_STYLES)[number]["value"]

export function getVisitLocationStyle(location: string) {
  return (
    VISIT_LOCATION_STYLES.find((s) => s.value === location) ?? {
      value: location,
      label: location,
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    }
  )
}

// Petty Cash Type Styles
export const PETTY_CASH_TYPE_STYLES = [
  { value: "given", label: "Given", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  { value: "returned", label: "Returned", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
] as const

export type PettyCashTypeValue = (typeof PETTY_CASH_TYPE_STYLES)[number]["value"]

export function getPettyCashTypeStyle(type: string) {
  return (
    PETTY_CASH_TYPE_STYLES.find((s) => s.value === type) ?? {
      value: type,
      label: type,
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  )
}

// Active lead statuses (all except terminal won/lost)
export const ACTIVE_LEAD_STATUSES = [
  "New",
  "No Response",
  "Not Interested",
  "Follow Up",
  "Other Requirement",
  "Visit Scheduled",
  "Visit Done",
  "Booking Done",
] as const

// Break Types
export const BREAK_TYPES = [
  { value: "lunch",             label: "Lunch Break" },
  { value: "other_break",       label: "Other Break" },
  { value: "training",          label: "Training" },
  { value: "huddle",            label: "Huddle" },
  { value: "onsite_visit",      label: "On Site Visit" },
  { value: "offline_marketing", label: "Offline Marketing" },
  { value: "other",             label: "Other" },
] as const

export type BreakTypeValue = (typeof BREAK_TYPES)[number]["value"]

export function getBreakTypeLabel(value: string) {
  return BREAK_TYPES.find((b) => b.value === value)?.label ?? value
}

// Petty Cash Category Styles
export const PETTY_CASH_CATEGORY_STYLES = [
  { value: "fuel", label: "Fuel", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  { value: "office_supplies", label: "Office Supplies", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { value: "food_beverages", label: "Food & Beverages", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  { value: "travel", label: "Travel", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { value: "courier", label: "Courier / Postage", bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  { value: "maintenance", label: "Maintenance", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  { value: "stationery", label: "Stationery", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  { value: "advance", label: "Advance", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  { value: "reimbursement", label: "Reimbursement", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { value: "other", label: "Other", bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
] as const

export type PettyCashCategoryValue = (typeof PETTY_CASH_CATEGORY_STYLES)[number]["value"]

export function getPettyCashCategoryStyle(category: string) {
  return (
    PETTY_CASH_CATEGORY_STYLES.find((s) => s.value === category) ?? {
      value: category,
      label: category,
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
    }
  )
}
