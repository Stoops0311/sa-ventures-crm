"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getVehicleTypeStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ConnectGpsForm } from "./connect-gps-form"

export function GpsVehicleList() {
  const vehicles = useQuery(api.vehicles.list, {
    status: "active",
    includeTemporary: false,
  })

  const [connectVehicleId, setConnectVehicleId] = useState<Id<"vehicles"> | null>(null)
  const connectVehicle = vehicles?.find((v) => v._id === connectVehicleId)

  if (!vehicles) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        No vehicles in fleet. Add vehicles first from the Fleet page.
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((vehicle) => {
          const typeStyle = getVehicleTypeStyle(vehicle.type)
          const isConnected = !!vehicle.gpsDeviceId

          return (
            <Card key={vehicle._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono font-medium text-sm">
                      {vehicle.registrationNumber}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px]", typeStyle.bg, typeStyle.text, typeStyle.border, "border")}
                      >
                        {typeStyle.label}
                      </Badge>
                      {vehicle.make && (
                        <span className="text-xs text-muted-foreground">
                          {vehicle.make} {vehicle.model}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "inline-block size-2",
                      isConnected ? "bg-emerald-500" : "bg-gray-300"
                    )} />
                    <span className="text-xs text-muted-foreground">
                      {isConnected ? "Connected" : "Not Connected"}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  {isConnected ? (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Device:</span> {vehicle.gpsDeviceId}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs mt-1"
                        onClick={() => setConnectVehicleId(vehicle._id)}
                      >
                        Device Settings
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => setConnectVehicleId(vehicle._id)}
                    >
                      Connect Device
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog
        open={!!connectVehicleId}
        onOpenChange={(open) => !open && setConnectVehicleId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {connectVehicle?.gpsDeviceId ? "GPS Device Settings" : "Connect GPS Device"}
            </DialogTitle>
          </DialogHeader>
          {connectVehicle && (
            <ConnectGpsForm
              vehicleId={connectVehicle._id}
              vehicle={connectVehicle}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
