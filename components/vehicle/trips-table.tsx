"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getVehicleTypeStyle,
  getTripStatusStyle,
  TRIP_STATUS_STYLES,
} from "@/lib/constants"
import { formatINR } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { LogTripDialog } from "./log-trip-dialog"
import { TripDetailSheet } from "./trip-detail-sheet"
import { toast } from "sonner"

export function TripsTable() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showLogDialog, setShowLogDialog] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<Id<"trips"> | null>(null)

  const trips = useQuery(api.trips.list, {
    status: statusFilter !== "all" ? statusFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  })

  const removeTrip = useMutation(api.trips.remove)

  async function handleDelete(id: Id<"trips">) {
    try {
      await removeTrip({ id })
      toast.success("Trip removed")
    } catch {
      toast.error("Failed to remove trip")
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
            placeholder="To"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {TRIP_STATUS_STYLES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <Button onClick={() => setShowLogDialog(true)}>Log Trip</Button>
          </div>
        </div>

        {!trips ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No trips found
          </div>
        ) : (
          <div className="border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Km</TableHead>
                  <TableHead className="text-right">Fuel Cost</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => {
                  const statusStyle = getTripStatusStyle(trip.status)
                  const typeStyle = trip.vehicle
                    ? getVehicleTypeStyle(trip.vehicle.type)
                    : null

                  return (
                    <TableRow
                      key={trip._id}
                      className="cursor-pointer"
                      onClick={() => setSelectedTripId(trip._id)}
                    >
                      <TableCell className="font-mono">{trip.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs">
                            {trip.vehicle?.registrationNumber ?? "—"}
                          </span>
                          {typeStyle && (
                            <Badge
                              variant="secondary"
                              className={cn("text-[10px] px-1 py-0 h-4", typeStyle.bg, typeStyle.text, typeStyle.border, "border")}
                            >
                              {typeStyle.label}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {trip.startLocation && trip.destination
                          ? `${trip.startLocation} → ${trip.destination}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {trip.kmDriven}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatINR(trip.fuelCost)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {trip.driverName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px]", statusStyle.bg, statusStyle.text, statusStyle.border, "border")}
                        >
                          {statusStyle.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(trip._id)
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <LogTripDialog open={showLogDialog} onOpenChange={setShowLogDialog} />
      <TripDetailSheet
        tripId={selectedTripId}
        open={!!selectedTripId}
        onOpenChange={(open: boolean) => !open && setSelectedTripId(null)}
      />
    </>
  )
}
