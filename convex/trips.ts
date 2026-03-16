import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserWithAnyRole, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { isValidTripStatus } from "./lib/constants"

const accessRoles = ["vehicle", "admin"] as const
const roles = [...accessRoles]

export const list = query({
  args: {
    vehicleId: v.optional(v.id("vehicles")),
    status: v.optional(v.string()),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, roles)
    if (!user) return null

    let trips

    if (args.vehicleId) {
      trips = await ctx.db
        .query("trips")
        .withIndex("byVehicleId", (q) => q.eq("vehicleId", args.vehicleId!))
        .collect()
    } else {
      trips = await ctx.db.query("trips").collect()
    }

    if (args.status) {
      trips = trips.filter((t) => t.status === args.status)
    }
    if (args.dateFrom) {
      trips = trips.filter((t) => t.date >= args.dateFrom!)
    }
    if (args.dateTo) {
      trips = trips.filter((t) => t.date <= args.dateTo!)
    }

    // Sort by date desc
    trips.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.createdAt - a.createdAt))

    // Enrich with vehicle data
    const enriched = await Promise.all(
      trips.map(async (trip) => {
        const vehicle = await ctx.db.get(trip.vehicleId)
        const kmDriven = (trip.odometerEnd ?? 0) - (trip.odometerStart ?? 0)
        const fuelCost = trip.fuelCost ?? 0
        return {
          ...trip,
          kmDriven,
          fuelCost,
          costPerKm: kmDriven > 0 ? fuelCost / kmDriven : 0,
          vehicle: vehicle
            ? {
                registrationNumber: vehicle.registrationNumber,
                type: vehicle.type,
                make: vehicle.make,
                model: vehicle.model,
              }
            : null,
        }
      })
    )

    return enriched
  },
})

export const getById = query({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const user = await getUserWithAnyRole(ctx, roles)
    if (!user) return null

    const trip = await ctx.db.get(id)
    if (!trip) return null

    const vehicle = await ctx.db.get(trip.vehicleId)

    const kmDriven = (trip.odometerEnd ?? 0) - (trip.odometerStart ?? 0)
    const fuelCost = trip.fuelCost ?? 0
    return {
      ...trip,
      kmDriven,
      fuelCost,
      costPerKm: kmDriven > 0 ? fuelCost / kmDriven : 0,
      vehicle,
    }
  },
})

export const getRecentTrips = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const user = await getUserWithAnyRole(ctx, roles)
    if (!user) return null

    const trips = await ctx.db.query("trips").collect()

    // Sort by date desc, then createdAt desc
    trips.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.createdAt - a.createdAt))

    const sliced = trips.slice(0, limit ?? 10)

    const enriched = await Promise.all(
      sliced.map(async (trip) => {
        const vehicle = await ctx.db.get(trip.vehicleId)
        return {
          ...trip,
          kmDriven: (trip.odometerEnd ?? 0) - (trip.odometerStart ?? 0),
          fuelCost: trip.fuelCost ?? 0,
          vehicle: vehicle
            ? {
                registrationNumber: vehicle.registrationNumber,
                type: vehicle.type,
              }
            : null,
        }
      })
    )

    return enriched
  },
})

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, roles)
    if (!user) return null

    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

    // Previous month for comparison
    const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const prevMonthPrefix = `${prevYear}-${String(prevMonth).padStart(2, "0")}`

    const allTrips = await ctx.db.query("trips").collect()
    const allVehicles = await ctx.db.query("vehicles").collect()
    const activeVehicles = allVehicles.filter((v) => !v.isTemporary && v.status === "active")

    const tripsToday = allTrips.filter((t) => t.date === todayStr)
    const tripsThisMonth = allTrips.filter((t) => t.date.startsWith(monthPrefix))
    const tripsPrevMonth = allTrips.filter((t) => t.date.startsWith(prevMonthPrefix))

    const completedThisMonth = tripsThisMonth.filter((t) => t.status === "completed")
    const completedPrevMonth = tripsPrevMonth.filter((t) => t.status === "completed")

    const kmThisMonth = completedThisMonth.reduce(
      (sum, t) => sum + ((t.odometerEnd ?? 0) - (t.odometerStart ?? 0)),
      0
    )
    const kmPrevMonth = completedPrevMonth.reduce(
      (sum, t) => sum + ((t.odometerEnd ?? 0) - (t.odometerStart ?? 0)),
      0
    )

    const fuelCostThisMonth = completedThisMonth.reduce(
      (sum, t) => sum + (t.fuelCost ?? 0),
      0
    )
    const fuelCostPrevMonth = completedPrevMonth.reduce(
      (sum, t) => sum + (t.fuelCost ?? 0),
      0
    )

    const avgCostPerKm = kmThisMonth > 0 ? fuelCostThisMonth / kmThisMonth : 0

    // Daily trip counts for last 14 days (bar chart)
    const dailyTrips: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const count = allTrips.filter((t) => t.date === dateStr).length
      dailyTrips.push({ date: dateStr, count })
    }

    // Daily fuel cost for last 30 days (line chart)
    const dailyFuelCost: { date: string; cost: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      const cost = allTrips
        .filter((t) => t.date === dateStr && t.status === "completed")
        .reduce((sum, t) => sum + (t.fuelCost ?? 0), 0)
      dailyFuelCost.push({ date: dateStr, cost })
    }

    // Vehicle utilization this month (horizontal bar chart)
    const vehicleUtilization = activeVehicles.map((v) => {
      const vehicleTrips = completedThisMonth.filter(
        (t) => t.vehicleId === v._id
      )
      return {
        vehicleId: v._id,
        registrationNumber: v.registrationNumber,
        type: v.type,
        tripCount: vehicleTrips.length,
        totalKm: vehicleTrips.reduce(
          (sum, t) => sum + ((t.odometerEnd ?? 0) - (t.odometerStart ?? 0)),
          0
        ),
      }
    }).sort((a, b) => b.tripCount - a.tripCount)

    return {
      totalVehicles: activeVehicles.length,
      tripsToday: tripsToday.length,
      kmThisMonth,
      kmPrevMonth,
      fuelCostThisMonth,
      fuelCostPrevMonth,
      avgCostPerKm,
      dailyTrips,
      dailyFuelCost,
      vehicleUtilization,
    }
  },
})

export const create = mutation({
  args: {
    vehicleId: v.optional(v.id("vehicles")),
    // Custom vehicle fields (when vehicleId is not provided)
    customVehicle: v.optional(
      v.object({
        type: v.string(),
        make: v.optional(v.string()),
        model: v.optional(v.string()),
        registrationNumber: v.string(),
        fuelType: v.string(),
      })
    ),
    date: v.string(),
    driverName: v.optional(v.string()),
    startLocation: v.optional(v.string()),
    destination: v.optional(v.string()),
    purpose: v.optional(v.string()),
    odometerStart: v.optional(v.number()),
    odometerEnd: v.optional(v.number()),
    fuelFilled: v.optional(v.number()),
    fuelCost: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, roles)

    let vehicleId = args.vehicleId

    // If custom vehicle, create a temporary one
    if (!vehicleId && args.customVehicle) {
      const now = Date.now()
      vehicleId = await ctx.db.insert("vehicles", {
        type: args.customVehicle.type,
        make: args.customVehicle.make,
        model: args.customVehicle.model,
        registrationNumber: args.customVehicle.registrationNumber,
        fuelType: args.customVehicle.fuelType,
        isTemporary: true,
        expiresAt: now + 3 * 60 * 60 * 1000, // 3 hours
        status: "active",
        createdBy: user._id,
        createdAt: now,
        updatedAt: now,
      })
    }

    if (!vehicleId) {
      throw new Error("Either vehicleId or customVehicle must be provided")
    }

    const status = args.status ?? "completed"
    if (!isValidTripStatus(status)) {
      throw new Error(`Invalid trip status: ${status}`)
    }

    const now = Date.now()
    const tripId = await ctx.db.insert("trips", {
      vehicleId,
      date: args.date,
      driverName: args.driverName,
      startLocation: args.startLocation,
      destination: args.destination,
      purpose: args.purpose,
      odometerStart: args.odometerStart,
      odometerEnd: args.odometerEnd,
      fuelFilled: args.fuelFilled,
      fuelCost: args.fuelCost,
      status,
      notes: args.notes,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "trip",
      entityId: tripId,
      action: "trip_created",
      details: {
        vehicleId,
        date: args.date,
        kmDriven: (args.odometerEnd ?? 0) - (args.odometerStart ?? 0),
        fuelCost: args.fuelCost,
      },
      performedBy: user._id,
    })

    return tripId
  },
})

export const update = mutation({
  args: {
    id: v.id("trips"),
    date: v.optional(v.string()),
    driverName: v.optional(v.string()),
    startLocation: v.optional(v.string()),
    destination: v.optional(v.string()),
    purpose: v.optional(v.string()),
    odometerStart: v.optional(v.number()),
    odometerEnd: v.optional(v.number()),
    fuelFilled: v.optional(v.number()),
    fuelCost: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const user = await requireUserWithAnyRole(ctx, roles)

    const trip = await ctx.db.get(id)
    if (!trip) throw new Error("Trip not found")

    if (updates.status && !isValidTripStatus(updates.status)) {
      throw new Error(`Invalid trip status: ${updates.status}`)
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value
    }

    await ctx.db.patch(id, patch)

    await logActivity(ctx, {
      entityType: "trip",
      entityId: id,
      action: updates.status === "completed" ? "trip_completed" : "trip_updated",
      details: updates,
      performedBy: user._id,
    })
  },
})

export const remove = mutation({
  args: { id: v.id("trips") },
  handler: async (ctx, { id }) => {
    const user = await requireUserWithAnyRole(ctx, roles)

    const trip = await ctx.db.get(id)
    if (!trip) throw new Error("Trip not found")

    await logActivity(ctx, {
      entityType: "trip",
      entityId: id,
      action: "trip_deleted",
      details: { vehicleId: trip.vehicleId, date: trip.date },
      performedBy: user._id,
    })

    await ctx.db.delete(id)
  },
})
