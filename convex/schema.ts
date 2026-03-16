import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.string(), // "admin" | "salesperson" | "dsm"
    externalId: v.string(), // Clerk user ID
    imageUrl: v.optional(v.string()),
    isAvailable: v.boolean(), // for round-robin allocation
    createdAt: v.number(),
  }).index("byExternalId", ["externalId"]),

  projects: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    location: v.string(),
    priceRange: v.string(),
    status: v.string(), // "active" | "archived"
    slug: v.optional(v.string()),
    amenities: v.optional(v.array(v.string())),
    configurations: v.optional(v.string()), // JSON: [{type, size, price}]
    possessionDate: v.optional(v.string()),
    developerName: v.optional(v.string()),
    reraNumber: v.optional(v.string()),
    mapEmbedUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("byStatus", ["status"])
    .index("bySlug", ["slug"]),

  leads: defineTable({
    name: v.string(),
    mobileNumber: v.string(),
    email: v.optional(v.string()),
    budget: v.optional(v.string()),
    projectId: v.id("projects"),
    assignedTo: v.id("users"),
    status: v.string(), // validated at runtime against LEAD_STATUSES
    source: v.string(),
    submittedBy: v.optional(v.id("users")),
    followUpDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byAssignedTo", ["assignedTo"])
    .index("byProjectId", ["projectId"])
    .index("byStatus", ["status"])
    .index("bySubmittedBy", ["submittedBy"])
    .index("byFollowUpDate", ["followUpDate"])
    .index("byAssignedToAndStatus", ["assignedTo", "status"])
    .searchIndex("searchByName", {
      searchField: "name",
      filterFields: ["projectId", "status", "assignedTo"],
    })
    .searchIndex("searchByPhone", {
      searchField: "mobileNumber",
      filterFields: ["projectId", "status", "assignedTo"],
    }),

  remarks: defineTable({
    leadId: v.id("leads"),
    content: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("byLeadId", ["leadId"]),

  activityLogs: defineTable({
    entityType: v.string(), // "lead" | "project" | "user"
    entityId: v.string(), // string since it can reference any table
    action: v.string(),
    details: v.optional(v.string()), // JSON-stringified details
    performedBy: v.id("users"),
    timestamp: v.number(),
  })
    .index("byEntityId", ["entityId"])
    .index("byPerformedBy", ["performedBy"])
    .index("byTimestamp", ["timestamp"]),

  presence: defineTable({
    userId: v.id("users"),
    lastSeen: v.number(),
    isOnline: v.boolean(),
  }).index("byUserId", ["userId"]),

  scheduledMessages: defineTable({
    leadId: v.id("leads"),
    templateId: v.optional(v.id("messageTemplates")),
    message: v.string(),
    language: v.string(), // "en" | "hi"
    scheduledAt: v.number(), // 0 = auto-suggest sentinel (not yet confirmed)
    channels: v.string(), // "both" | "whatsapp" | "sms"
    whatsappStatus: v.string(), // "pending" | "sending" | "sent" | "failed" | "skipped" | "cancelled"
    smsStatus: v.string(), // same values
    whatsappMessageId: v.optional(v.string()),
    smsMessageId: v.optional(v.string()),
    whatsappError: v.optional(v.string()),
    smsError: v.optional(v.string()),
    triggerType: v.string(), // "manual" | "auto_schedule" | "auto_suggest"
    sentAt: v.optional(v.number()),
    cancelledAt: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("byLeadId", ["leadId"])
    .index("byWhatsappStatus", ["whatsappStatus"])
    .index("bySmsStatus", ["smsStatus"])
    .index("byScheduledAt", ["scheduledAt"])
    .index("byCreatedBy", ["createdBy"]),

  messageTemplates: defineTable({
    name: v.string(),
    slug: v.string(),
    bodyEn: v.string(),
    bodyHi: v.string(),
    triggerStatus: v.optional(v.string()),
    triggerBehavior: v.optional(v.string()), // "auto_schedule" | "auto_suggest"
    autoDelayMs: v.optional(v.number()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("bySlug", ["slug"])
    .index("byTriggerStatus", ["triggerStatus"])
    .index("byIsActive", ["isActive"]),

  whatsappSessions: defineTable({
    userId: v.optional(v.id("users")), // null for org-wide SMS session
    sessionType: v.string(), // "whatsapp" | "sms"
    bridgeSessionId: v.string(), // UUID from Bridge API
    name: v.string(),
    status: v.string(), // "pending" | "qr_ready" | "connected" | "disconnected"
    phone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("bySessionType", ["sessionType"])
    .index("byBridgeSessionId", ["bridgeSessionId"])
    .index("byStatus", ["status"]),

  smsDevices: defineTable({
    bridgeDeviceId: v.string(),
    deviceKey: v.string(),
    status: v.string(), // "pending" | "online" | "offline"
    phone: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byStatus", ["status"]),

  attendanceSessions: defineTable({
    userId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD" for easy day queries
    startTime: v.number(), // epoch ms
    endTime: v.number(), // epoch ms (updated on each heartbeat)
    isActive: v.boolean(), // true if session is ongoing
  })
    .index("byUserId", ["userId"])
    .index("byUserIdAndDate", ["userId", "date"])
    .index("byDate", ["date"])
    .index("byUserIdAndIsActive", ["userId", "isActive"]),

  projectCreatives: defineTable({
    projectId: v.id("projects"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    order: v.number(),
    createdAt: v.number(),
  }).index("byProjectId", ["projectId"]),

  employeeProfiles: defineTable({
    userId: v.id("users"),
    // Personal info
    dateOfBirth: v.optional(v.string()), // "YYYY-MM-DD"
    gender: v.optional(v.string()), // "male" | "female" | "other"
    fatherName: v.optional(v.string()),
    motherName: v.optional(v.string()),
    maritalStatus: v.optional(v.string()), // "single" | "married" | "divorced" | "widowed"
    bloodGroup: v.optional(v.string()), // "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-"
    panNumber: v.optional(v.string()),
    aadharNumber: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
    address: v.optional(v.string()),
    // Banking
    bankName: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    ifscCode: v.optional(v.string()),
    // Emergency contact
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
    emergencyContactRelation: v.optional(v.string()),
    // Employment
    dateOfJoining: v.optional(v.string()), // "YYYY-MM-DD"
    designation: v.optional(v.string()),
    department: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("byUserId", ["userId"]),

  onboardingChecklists: defineTable({
    userId: v.id("users"),
    employeeProfileId: v.id("employeeProfiles"),
    status: v.string(), // "pending" | "in_progress" | "completed"
    items: v.string(), // JSON: [{ key, label, completedAt?, completedBy? }]
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("byUserId", ["userId"])
    .index("byStatus", ["status"]),

  letterTemplates: defineTable({
    type: v.string(), // "appointment" | "warning" | "experience" | "termination" | "salary_certificate" | "increment"
    name: v.string(),
    content: v.string(), // Template body with {{placeholders}}
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byType", ["type"])
    .index("byIsActive", ["isActive"]),

  employeeLetters: defineTable({
    userId: v.id("users"),
    templateType: v.optional(v.string()), // null if uploaded externally
    title: v.string(),
    storageId: v.id("_storage"), // PDF in Convex file storage
    fileName: v.string(),
    isGenerated: v.boolean(), // true = system-generated, false = uploaded
    generatedBy: v.id("users"), // HR user who generated/uploaded
    createdAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byUserIdAndType", ["userId", "templateType"]),

  salaryComponents: defineTable({
    userId: v.id("users"),
    name: v.string(),
    type: v.string(), // "earning" | "deduction"
    amount: v.number(),
    isCustom: v.boolean(),
    order: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("byUserId", ["userId"]),

  payrollRuns: defineTable({
    month: v.number(), // 1–12
    year: v.number(),
    status: v.string(), // "draft" | "confirmed"
    processedBy: v.id("users"),
    confirmedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("byYearMonth", ["year", "month"])
    .index("byStatus", ["status"]),

  payslips: defineTable({
    payrollRunId: v.id("payrollRuns"),
    userId: v.id("users"),
    month: v.number(),
    year: v.number(),
    breakdown: v.string(), // JSON snapshot
    grossEarnings: v.number(),
    totalDeductions: v.number(),
    netPay: v.number(),
    isOverridden: v.boolean(),
    pdfStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  })
    .index("byPayrollRunId", ["payrollRunId"])
    .index("byUserId", ["userId"])
    .index("byUserIdAndYearMonth", ["userId", "year", "month"]),

  insuranceEnrollments: defineTable({
    userId: v.id("users"),
    // Required fields (employee fills)
    nomineeName: v.string(),
    nomineeRelation: v.string(),
    nomineeDob: v.string(), // "YYYY-MM-DD"
    existingConditions: v.boolean(),
    // Optional fields (employee fills)
    dependents: v.optional(v.string()), // JSON: [{ name, relation, dob }]
    preExistingDetails: v.optional(v.string()),
    preferredHospital: v.optional(v.string()),
    sumInsured: v.optional(v.number()),
    // Tracker fields (HR manages)
    policyNumber: v.optional(v.string()),
    expiryDate: v.optional(v.string()), // "YYYY-MM-DD"
    renewalReminderDate: v.optional(v.string()),
    status: v.string(), // "pending" | "enrolled" | "expired" | "renewed"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byStatus", ["status"])
    .index("byExpiryDate", ["expiryDate"]),

  insuranceDocuments: defineTable({
    insuranceEnrollmentId: v.id("insuranceEnrollments"),
    userId: v.id("users"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    createdAt: v.number(),
  })
    .index("byInsuranceEnrollmentId", ["insuranceEnrollmentId"])
    .index("byUserId", ["userId"]),

  hrQueries: defineTable({
    userId: v.id("users"),
    type: v.string(), // "salary_certificate" | "experience_letter" | "leave_encashment" | "salary_advance" | "address_change" | "bank_detail_change" | "other"
    subject: v.string(),
    description: v.string(),
    status: v.string(), // "open" | "in_progress" | "resolved" | "rejected"
    resolvedBy: v.optional(v.id("users")),
    resolutionNote: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("byUserId", ["userId"])
    .index("byStatus", ["status"])
    .index("byType", ["type"]),

  vehicles: defineTable({
    type: v.string(), // "car" | "bike" | "van" | "suv" | "auto_rickshaw" | "other"
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    registrationNumber: v.string(),
    fuelType: v.string(), // "petrol" | "diesel" | "cng" | "electric" | "hybrid"
    color: v.optional(v.string()),
    year: v.optional(v.number()),
    isTemporary: v.boolean(),
    expiresAt: v.optional(v.number()), // epoch ms, only for temporary
    gpsDeviceId: v.optional(v.string()),
    gpsDeviceName: v.optional(v.string()),
    gpsProvider: v.optional(v.string()),
    status: v.string(), // "active" | "inactive" | "maintenance"
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byCreatedBy", ["createdBy"])
    .index("byStatus", ["status"])
    .index("byIsTemporary", ["isTemporary"])
    .searchIndex("searchByRegistration", {
      searchField: "registrationNumber",
    }),

  trips: defineTable({
    vehicleId: v.id("vehicles"),
    date: v.string(), // "YYYY-MM-DD"
    driverName: v.optional(v.string()),
    startLocation: v.optional(v.string()),
    destination: v.optional(v.string()),
    purpose: v.optional(v.string()),
    odometerStart: v.optional(v.number()), // optional for planned trips
    odometerEnd: v.optional(v.number()), // optional for planned trips
    fuelFilled: v.optional(v.number()), // liters or kg
    fuelCost: v.optional(v.number()), // ₹ — optional for planned trips
    status: v.string(), // "planned" | "in_progress" | "completed"
    notes: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byVehicleId", ["vehicleId"])
    .index("byDate", ["date"])
    .index("byCreatedBy", ["createdBy"])
    .index("byStatus", ["status"]),

  suggestions: defineTable({
    userId: v.optional(v.id("users")), // stored internally even for anonymous
    isAnonymous: v.boolean(),
    content: v.string(),
    category: v.optional(v.string()), // "workplace" | "policy" | "process" | "other"
    status: v.string(), // "new" | "reviewed" | "implemented" | "dismissed"
    reviewedBy: v.optional(v.id("users")),
    reviewNote: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byStatus", ["status"])
    .index("byUserId", ["userId"]),

  trainingProgress: defineTable({
    userId: v.id("users"),
    day: v.number(), // 1-7
    completedAt: v.number(),
  }).index("byUserId", ["userId"]),

  articles: defineTable({
    title: v.string(),
    slug: v.string(),
    body: v.string(), // Rich text HTML from TipTap
    excerpt: v.optional(v.string()),
    coverImageStorageId: v.optional(v.id("_storage")),
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    status: v.string(), // "draft" | "published"
    authorId: v.id("users"),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byStatus", ["status"])
    .index("bySlug", ["slug"])
    .index("byCategory", ["category"])
    .index("byAuthorId", ["authorId"]),

  websiteInquiries: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    projectId: v.optional(v.id("projects")),
    message: v.optional(v.string()),
    type: v.optional(v.string()), // "inquiry" | "partner" — optional for backward compat
    status: v.string(), // "new" | "contacted" | "closed"
    createdAt: v.number(),
  })
    .index("byStatus", ["status"])
    .index("byCreatedAt", ["createdAt"])
    .index("byType", ["type"]),
})
