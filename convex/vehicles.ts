import { query, mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { getUserWithAnyRole, requireUserWithAnyRole } from "./lib/auth"
import { logActivity } from "./lib/activityLogger"
import { isValidVehicleType, isValidFuelType, isValidVehicleStatus } from "./lib/constants"

const VEHICLE_ACCESS_ROLES = ["vehicle", "admin"] as const
const accessRoles = [...VEHICLE_ACCESS_ROLES]

export const list = query({
  args: {
    type: v.optional(v.string()),
    fuelType: v.optional(v.string()),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
    includeTemporary: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getUserWithAnyRole(ctx, accessRoles)
    if (!user) return null

    let vehicles

    if (args.search && args.search.trim().length > 0) {
      vehicles = await ctx.db
        .query("vehicles")
        .withSearchIndex("searchByRegistration", (q) =>
          q.search("registrationNumber", args.search!)
        )
        .collect()
    } else {
      vehicles = await ctx.db.query("vehicles").collect()
    }

    // Filter
    if (args.type) {
      vehicles = vehicles.filter((v) => v.type === args.type)
    }
    if (args.fuelType) {
      vehicles = vehicles.filter((v) => v.fuelType === args.fuelType)
    }
    if (args.status) {
      vehicles = vehicles.filter((v) => v.status === args.status)
    }
    if (!args.includeTemporary) {
      vehicles = vehicles.filter((v) => !v.isTemporary)
    }

    // Enrich with trip stats
    const enriched = await Promise.all(
      vehicles.map(async (vehicle) => {
        const trips = await ctx.db
          .query("trips")
          .withIndex("byVehicleId", (q) => q.eq("vehicleId", vehicle._id))
          .collect()

        const completedTrips = trips.filter((t) => t.status === "completed")
        const totalKm = completedTrips.reduce(
          (sum, t) => sum + ((t.odometerEnd ?? 0) - (t.odometerStart ?? 0)),
          0
        )

        return {
          ...vehicle,
          totalTrips: completedTrips.length,
          totalKm,
        }
      })
    )

    return enriched
  },
})

export const getById = query({
  args: { id: v.id("vehicles") },
  handler: async (ctx, { id }) => {
    const user = await getUserWithAnyRole(ctx, accessRoles)
    if (!user) return null
    return await ctx.db.get(id)
  },
})

export const getActiveVehicles = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, accessRoles)
    if (!user) return null

    const vehicles = await ctx.db
      .query("vehicles")
      .withIndex("byStatus", (q) => q.eq("status", "active"))
      .collect()

    return vehicles.filter((v) => !v.isTemporary || (v.expiresAt && v.expiresAt > Date.now()))
  },
})

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUserWithAnyRole(ctx, accessRoles)
    if (!user) return null

    const vehicles = await ctx.db.query("vehicles").collect()
    const activeVehicles = vehicles.filter((v) => !v.isTemporary)
    const active = activeVehicles.filter((v) => v.status === "active").length
    const maintenance = activeVehicles.filter((v) => v.status === "maintenance").length

    const byType: Record<string, number> = {}
    for (const v of activeVehicles) {
      byType[v.type] = (byType[v.type] ?? 0) + 1
    }

    return {
      total: activeVehicles.length,
      active,
      maintenance,
      inactive: activeVehicles.length - active - maintenance,
      byType,
    }
  },
})

export const create = mutation({
  args: {
    type: v.string(),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    registrationNumber: v.string(),
    fuelType: v.string(),
    color: v.optional(v.string()),
    year: v.optional(v.number()),
    isTemporary: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUserWithAnyRole(ctx, accessRoles)

    if (!isValidVehicleType(args.type)) {
      throw new Error(`Invalid vehicle type: ${args.type}`)
    }
    if (!isValidFuelType(args.fuelType)) {
      throw new Error(`Invalid fuel type: ${args.fuelType}`)
    }

    const now = Date.now()
    const isTemp = args.isTemporary ?? false

    const vehicleId = await ctx.db.insert("vehicles", {
      type: args.type,
      make: args.make,
      model: args.model,
      registrationNumber: args.registrationNumber,
      fuelType: args.fuelType,
      color: args.color,
      year: args.year,
      isTemporary: isTemp,
      expiresAt: isTemp ? now + 3 * 60 * 60 * 1000 : undefined, // 3 hours
      status: "active",
      notes: args.notes,
      createdBy: user._id,
      createdAt: now,
      updatedAt: now,
    })

    await logActivity(ctx, {
      entityType: "vehicle",
      entityId: vehicleId,
      action: "vehicle_created",
      details: {
        type: args.type,
        registrationNumber: args.registrationNumber,
        isTemporary: isTemp,
      },
      performedBy: user._id,
    })

    return vehicleId
  },
})

export const update = mutation({
  args: {
    id: v.id("vehicles"),
    type: v.optional(v.string()),
    make: v.optional(v.string()),
    model: v.optional(v.string()),
    registrationNumber: v.optional(v.string()),
    fuelType: v.optional(v.string()),
    color: v.optional(v.string()),
    year: v.optional(v.number()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const user = await requireUserWithAnyRole(ctx, accessRoles)

    const vehicle = await ctx.db.get(id)
    if (!vehicle) throw new Error("Vehicle not found")

    if (updates.type && !isValidVehicleType(updates.type)) {
      throw new Error(`Invalid vehicle type: ${updates.type}`)
    }
    if (updates.fuelType && !isValidFuelType(updates.fuelType)) {
      throw new Error(`Invalid fuel type: ${updates.fuelType}`)
    }
    if (updates.status && !isValidVehicleStatus(updates.status)) {
      throw new Error(`Invalid vehicle status: ${updates.status}`)
    }

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) patch[key] = value
    }

    await ctx.db.patch(id, patch)

    await logActivity(ctx, {
      entityType: "vehicle",
      entityId: id,
      action: "vehicle_updated",
      details: updates,
      performedBy: user._id,
    })
  },
})

export const remove = mutation({
  args: { id: v.id("vehicles") },
  handler: async (ctx, { id }) => {
    const user = await requireUserWithAnyRole(ctx, accessRoles)

    const vehicle = await ctx.db.get(id)
    if (!vehicle) throw new Error("Vehicle not found")

    await logActivity(ctx, {
      entityType: "vehicle",
      entityId: id,
      action: "vehicle_deleted",
      details: { registrationNumber: vehicle.registrationNumber },
      performedBy: user._id,
    })

    await ctx.db.delete(id)
  },
})

export const connectGps = mutation({
  args: {
    id: v.id("vehicles"),
    gpsDeviceId: v.string(),
    gpsDeviceName: v.optional(v.string()),
    gpsProvider: v.optional(v.string()),
  },
  handler: async (ctx, { id, gpsDeviceId, gpsDeviceName, gpsProvider }) => {
    const user = await requireUserWithAnyRole(ctx, accessRoles)

    const vehicle = await ctx.db.get(id)
    if (!vehicle) throw new Error("Vehicle not found")

    await ctx.db.patch(id, {
      gpsDeviceId,
      gpsDeviceName,
      gpsProvider,
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "vehicle",
      entityId: id,
      action: "gps_connected",
      details: { gpsDeviceId, gpsDeviceName, gpsProvider },
      performedBy: user._id,
    })
  },
})

export const disconnectGps = mutation({
  args: { id: v.id("vehicles") },
  handler: async (ctx, { id }) => {
    const user = await requireUserWithAnyRole(ctx, accessRoles)

    const vehicle = await ctx.db.get(id)
    if (!vehicle) throw new Error("Vehicle not found")

    await ctx.db.patch(id, {
      gpsDeviceId: undefined,
      gpsDeviceName: undefined,
      gpsProvider: undefined,
      updatedAt: Date.now(),
    })

    await logActivity(ctx, {
      entityType: "vehicle",
      entityId: id,
      action: "gps_disconnected",
      performedBy: user._id,
    })
  },
})

// Internal mutation for cron cleanup of temporary vehicles
export const cleanupTemporary = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    const tempVehicles = await ctx.db
      .query("vehicles")
      .withIndex("byIsTemporary", (q) => q.eq("isTemporary", true))
      .collect()

    const expired = tempVehicles.filter(
      (v) => v.expiresAt && v.expiresAt < now
    )

    for (const vehicle of expired) {
      // Check if any active trips reference this vehicle
      const activeTrips = await ctx.db
        .query("trips")
        .withIndex("byVehicleId", (q) => q.eq("vehicleId", vehicle._id))
        .collect()

      const hasActiveTrips = activeTrips.some(
        (t) => t.status === "planned" || t.status === "in_progress"
      )

      if (!hasActiveTrips) {
        await ctx.db.delete(vehicle._id)
      }
    }
  },
})
