"use client"

import { GpsVehicleList } from "@/components/vehicle/gps-vehicle-list"

export default function GpsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-sans text-lg font-semibold">GPS Tracking</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect GPS devices to your vehicles for real-time location tracking, route history, and mileage verification.
        </p>
      </div>
      <GpsVehicleList />
    </div>
  )
}
