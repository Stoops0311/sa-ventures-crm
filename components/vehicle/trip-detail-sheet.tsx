"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getVehicleTypeStyle,
  getFuelTypeStyle,
  getTripStatusStyle,
} from "@/lib/constants"
import { formatINR } from "@/lib/currency"
import { cn } from "@/lib/utils"

interface TripDetailSheetProps {
  tripId: Id<"trips"> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TripDetailSheet({ tripId, open, onOpenChange }: TripDetailSheetProps) {
  const trip = useQuery(
    api.trips.getById,
    tripId ? { id: tripId } : "skip"
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {!trip ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono">{trip.date}</SheetTitle>
              <div className="flex gap-2 mt-1">
                {(() => {
                  const statusStyle = getTripStatusStyle(trip.status)
                  return (
                    <Badge variant="secondary" className={cn("text-[10px]", statusStyle.bg, statusStyle.text, statusStyle.border, "border")}>
                      {statusStyle.label}
                    </Badge>
                  )
                })()}
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Vehicle info */}
              {trip.vehicle && (
                <div className="border p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Vehicle</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{trip.vehicle.registrationNumber}</span>
                    {(() => {
                      const typeStyle = getVehicleTypeStyle(trip.vehicle!.type)
                      const fuelStyle = getFuelTypeStyle(trip.vehicle!.fuelType)
                      return (
                        <>
                          <Badge variant="secondary" className={cn("text-[10px]", typeStyle.bg, typeStyle.text, typeStyle.border, "border")}>
                            {typeStyle.label}
                          </Badge>
                          <Badge variant="secondary" className={cn("text-[10px]", fuelStyle.bg, fuelStyle.text, fuelStyle.border, "border")}>
                            {fuelStyle.label}
                          </Badge>
                        </>
                      )
                    })()}
                  </div>
                  {(trip.vehicle.make || trip.vehicle.model) && (
                    <p className="text-xs text-muted-foreground">
                      {[trip.vehicle.make, trip.vehicle.model].filter(Boolean).join(" ")}
                    </p>
                  )}
                </div>
              )}

              {/* Trip details */}
              <div className="space-y-3">
                {trip.startLocation && trip.destination && (
                  <InfoRow label="Route" value={`${trip.startLocation} → ${trip.destination}`} />
                )}
                {trip.driverName && <InfoRow label="Driver" value={trip.driverName} />}
                {trip.purpose && <InfoRow label="Purpose" value={trip.purpose} />}
                {trip.odometerStart != null && (
                  <InfoRow label="Odometer Start" value={`${trip.odometerStart.toLocaleString("en-IN")} km`} />
                )}
                {trip.odometerEnd != null && (
                  <InfoRow label="Odometer End" value={`${trip.odometerEnd.toLocaleString("en-IN")} km`} />
                )}
                {trip.kmDriven > 0 && (
                  <InfoRow label="Distance" value={`${trip.kmDriven.toLocaleString("en-IN")} km`} />
                )}
                {trip.fuelFilled != null && <InfoRow label="Fuel Filled" value={`${trip.fuelFilled} L/kg`} />}
                {trip.fuelCost > 0 && <InfoRow label="Fuel Cost" value={formatINR(trip.fuelCost)} />}
                {trip.costPerKm > 0 && (
                  <InfoRow label="Cost per Km" value={`₹${trip.costPerKm.toFixed(2)}`} />
                )}
                {trip.notes && <InfoRow label="Notes" value={trip.notes} />}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  )
}
