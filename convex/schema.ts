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
    // Banking details (DSM role)
    bankName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    bankIfscCode: v.optional(v.string()),
    bankAccountHolderName: v.optional(v.string()),
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
    configurations: v.optional(v.string()), // JSON: [{type, superArea, carpetArea, bedrooms, bathrooms, balconies, price, facing}]
    possessionDate: v.optional(v.string()),
    developerName: v.optional(v.string()),
    reraNumber: v.optional(v.string()),
    mapEmbedUrl: v.optional(v.string()),
    // Property classification
    propertyType: v.optional(v.string()), // "apartment" | "villa" | "plot" | "penthouse" | "row_house" | "commercial" | "studio" | "duplex"
    constructionStatus: v.optional(v.string()), // "new_launch" | "under_construction" | "ready_to_move"
    transactionType: v.optional(v.string()), // "new_property" | "resale"
    ownershipType: v.optional(v.string()), // "freehold" | "leasehold" | "cooperative" | "power_of_attorney"
    // Building details
    totalFloors: v.optional(v.number()),
    totalTowers: v.optional(v.number()),
    totalUnits: v.optional(v.number()),
    launchDate: v.optional(v.string()),
    completionDate: v.optional(v.string()),
    // Pricing details
    pricePerSqft: v.optional(v.string()),
    maintenanceCharges: v.optional(v.string()),
    bookingAmount: v.optional(v.string()),
    // Specifications
    flooring: v.optional(v.string()),
    waterSupply: v.optional(v.string()),
    powerBackup: v.optional(v.string()), // "full" | "partial" | "none" | "generator"
    overlooking: v.optional(v.array(v.string())),
    gatedCommunity: v.optional(v.boolean()),
    petFriendly: v.optional(v.boolean()),
    furnishingStatus: v.optional(v.string()), // "unfurnished" | "semi_furnished" | "furnished"
    parkingInfo: v.optional(v.string()),
    // Location details
    city: v.optional(v.string()),
    locality: v.optional(v.string()),
    pincode: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    // Nearby landmarks
    nearbyLandmarks: v.optional(v.string()), // JSON: [{type, name, distance}]
    // DSM commission
    dsmCommissionAmount: v.optional(v.number()), // fixed commission in INR for DSM referrals
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
    attachedCreativeId: v.optional(v.id("projectCreatives")),
    attachedLeadPhotoId: v.optional(v.id("leadPhotos")),
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

  leadPhotos: defineTable({
    leadId: v.id("leads"),
    storageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
  }).index("byLeadId", ["leadId"]),

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

  afterSalesProcesses: defineTable({
    leadId: v.id("leads"),
    assignedTo: v.id("users"),
    projectId: v.id("projects"),
    status: v.string(), // "in_progress" | "completed" | "on_hold"
    currentStep: v.string(), // key of first incomplete step
    steps: v.string(), // JSON: AfterSalesStep[]
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byLeadId", ["leadId"])
    .index("byAssignedTo", ["assignedTo"])
    .index("byStatus", ["status"])
    .index("byCurrentStep", ["currentStep"])
    .index("byProjectId", ["projectId"])
    .index("byAssignedToAndStatus", ["assignedTo", "status"]),

  visits: defineTable({
    visitType: v.string(), // "scheduled" | "walk_in"
    // Lead-linked fields (present for scheduled visits, optional for walk-ins)
    leadId: v.optional(v.id("leads")),
    projectId: v.optional(v.id("projects")),
    assignedTo: v.optional(v.id("users")), // salesperson
    // Walk-in fields (for unscheduled visitors)
    walkinName: v.optional(v.string()),
    walkinPhone: v.optional(v.string()),
    walkinPurpose: v.optional(v.string()),
    // Common fields
    visitLocation: v.string(), // "office" | "site" | "other"
    visitAddress: v.optional(v.string()),
    visitDate: v.number(), // epoch ms (date + time)
    checkinStatus: v.string(), // "expected" | "arrived" | "no_show"
    checkinAt: v.optional(v.number()),
    checkinBy: v.optional(v.id("users")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("byLeadId", ["leadId"])
    .index("byAssignedTo", ["assignedTo"])
    .index("byVisitDate", ["visitDate"])
    .index("byCheckinStatus", ["checkinStatus"]),

  pettyCashEntries: defineTable({
    type: v.string(), // "given" | "returned"
    amount: v.number(), // INR
    category: v.string(), // "fuel" | "office_supplies" | ... | "other"
    description: v.string(), // freetext purpose
    personUserId: v.optional(v.id("users")), // if CRM user
    personName: v.optional(v.string()), // if external/custom person
    date: v.string(), // "YYYY-MM-DD" for daily grouping
    receiptStorageId: v.optional(v.id("_storage")),
    receiptFileName: v.optional(v.string()),
    isVoided: v.boolean(),
    voidedAt: v.optional(v.number()),
    voidedBy: v.optional(v.id("users")),
    voidReason: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("byDate", ["date"])
    .index("byType", ["type"])
    .index("byPersonUserId", ["personUserId"])
    .index("byCategory", ["category"])
    .index("byDateAndType", ["date", "type"]),

  pettyCashSettings: defineTable({
    openingBalance: v.number(), // starting cash amount in INR
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }),

  breakSessions: defineTable({
    userId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD" from startTime
    startTime: v.number(), // epoch ms
    endTime: v.optional(v.number()), // epoch ms, null while active
    isActive: v.boolean(),
    wasAutoEnded: v.boolean(), // true if closed by stale-break cron
    breakType: v.optional(v.string()), // "lunch" | "other_break" | "training" | "huddle" | "onsite_visit" | "offline_marketing" | "other"
    remarks: v.optional(v.string()), // required when breakType === "other"
  })
    .index("byUserId", ["userId"])
    .index("byUserIdAndIsActive", ["userId", "isActive"])
    .index("byUserIdAndDate", ["userId", "date"])
    .index("byIsActive", ["isActive"]),

  breakTimeSettings: defineTable({
    warningThresholdMinutes: v.number(), // daily break time threshold for flagging
    updatedBy: v.id("users"),
    updatedAt: v.number(),
  }),

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

  dsmCommissionEntries: defineTable({
    dsmUserId: v.id("users"),
    type: v.string(), // "credit" | "debit"
    amount: v.number(), // INR, always positive
    leadId: v.optional(v.id("leads")),
    projectId: v.optional(v.id("projects")),
    description: v.string(),
    isAutoGenerated: v.boolean(),
    isVoided: v.boolean(),
    voidedAt: v.optional(v.number()),
    voidedBy: v.optional(v.id("users")),
    voidReason: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("byDsmUserId", ["dsmUserId"])
    .index("byDsmUserIdAndType", ["dsmUserId", "type"])
    .index("byLeadId", ["leadId"])
    .index("byCreatedAt", ["createdAt"]),
})
