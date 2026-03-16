"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { formatINR } from "@/lib/currency"
import { getVehicleTypeStyle } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function RecentTripsTable() {
  const trips = useQuery(api.trips.getRecentTrips, { limit: 10 })

  if (!trips) {
    return <Skeleton className="h-72" />
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Recent Trips</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {trips.length === 0 ? (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            No trips recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground px-4 py-2">Date</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-2">Vehicle</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-2">Km</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => {
                  const typeStyle = trip.vehicle
                    ? getVehicleTypeStyle(trip.vehicle.type)
                    : null
                  return (
                    <tr key={trip._id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-2 font-mono">{trip.date}</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <span>{trip.vehicle?.registrationNumber ?? "—"}</span>
                          {typeStyle && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] px-1 py-0 h-4",
                                typeStyle.bg,
                                typeStyle.text,
                                typeStyle.border,
                                "border"
                              )}
                            >
                              {typeStyle.label}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right font-mono">{trip.kmDriven}</td>
                      <td className="px-4 py-2 text-right font-mono">{formatINR(trip.fuelCost)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
