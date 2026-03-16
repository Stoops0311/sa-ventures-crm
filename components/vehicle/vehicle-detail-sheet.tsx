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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getVehicleTypeStyle,
  getFuelTypeStyle,
  getVehicleStatusStyle,
} from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ConnectGpsForm } from "./connect-gps-form"
import { formatINR } from "@/lib/currency"

interface VehicleDetailSheetProps {
  vehicleId: Id<"vehicles"> | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VehicleDetailSheet({ vehicleId, open, onOpenChange }: VehicleDetailSheetProps) {
  const vehicle = useQuery(
    api.vehicles.getById,
    vehicleId ? { id: vehicleId } : "skip"
  )

  const trips = useQuery(
    api.trips.list,
    vehicleId ? { vehicleId } : "skip"
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {!vehicle ? (
          <div className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="font-mono">
                {vehicle.registrationNumber}
              </SheetTitle>
              <div className="flex gap-2 mt-1">
                {(() => {
                  const typeStyle = getVehicleTypeStyle(vehicle.type)
                  const fuelStyle = getFuelTypeStyle(vehicle.fuelType)
                  const statusStyle = getVehicleStatusStyle(vehicle.status)
                  return (
                    <>
                      <Badge variant="secondary" className={cn("text-[10px]", typeStyle.bg, typeStyle.text, typeStyle.border, "border")}>
                        {typeStyle.label}
                      </Badge>
                      <Badge variant="secondary" className={cn("text-[10px]", fuelStyle.bg, fuelStyle.text, fuelStyle.border, "border")}>
                        {fuelStyle.label}
                      </Badge>
                      <Badge variant="secondary" className={cn("text-[10px]", statusStyle.bg, statusStyle.text, statusStyle.border, "border")}>
                        {statusStyle.label}
                      </Badge>
                    </>
                  )
                })()}
              </div>
            </SheetHeader>

            <Tabs defaultValue="info" className="mt-6">
              <TabsList>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="trips">Trips</TabsTrigger>
                <TabsTrigger value="gps">GPS</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4 space-y-3">
                <InfoRow label="Make" value={vehicle.make} />
                <InfoRow label="Model" value={vehicle.model} />
                <InfoRow label="Color" value={vehicle.color} />
                <InfoRow label="Year" value={vehicle.year?.toString()} />
                <InfoRow label="Notes" value={vehicle.notes} />
                {vehicle.isTemporary && (
                  <div className="text-xs text-muted-foreground bg-yellow-50 p-2 border border-yellow-200">
                    Temporary vehicle — expires automatically
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trips" className="mt-4">
                {!trips ? (
                  <Skeleton className="h-32" />
                ) : trips.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No trips recorded</p>
                ) : (
                  <div className="space-y-2">
                    {trips.slice(0, 20).map((trip) => (
                      <div
                        key={trip._id}
                        className="flex items-center justify-between border p-3 text-xs"
                      >
                        <div>
                          <p className="font-mono font-medium">{trip.date}</p>
                          {trip.startLocation && trip.destination && (
                            <p className="text-muted-foreground mt-0.5">
                              {trip.startLocation} → {trip.destination}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-mono">{trip.kmDriven} km</p>
                          <p className="text-muted-foreground">{formatINR(trip.fuelCost)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="gps" className="mt-4">
                <ConnectGpsForm vehicleId={vehicle._id} vehicle={vehicle} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
