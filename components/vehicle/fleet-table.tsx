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
  getFuelTypeStyle,
  getVehicleStatusStyle,
  VEHICLE_TYPE_STYLES,
  FUEL_TYPE_STYLES,
  VEHICLE_STATUS_STYLES,
} from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { AddVehicleDialog } from "./add-vehicle-dialog"
import { VehicleDetailSheet } from "./vehicle-detail-sheet"
import { toast } from "sonner"

export function FleetTable() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [fuelFilter, setFuelFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<Id<"vehicles"> | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const vehicles = useQuery(api.vehicles.list, {
    search: debouncedSearch || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    fuelType: fuelFilter !== "all" ? fuelFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    includeTemporary: false,
  })

  const removeVehicle = useMutation(api.vehicles.remove)

  async function handleDelete(id: Id<"vehicles">) {
    try {
      await removeVehicle({ id })
      toast.success("Vehicle removed")
    } catch {
      toast.error("Failed to remove vehicle")
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {VEHICLE_TYPE_STYLES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fuelFilter} onValueChange={setFuelFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Fuel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fuels</SelectItem>
              {FUEL_TYPE_STYLES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {VEHICLE_STATUS_STYLES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto">
            <Button onClick={() => setShowAddDialog(true)}>Add Vehicle</Button>
          </div>
        </div>

        {!vehicles ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No vehicles found
          </div>
        ) : (
          <div className="border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registration #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Make & Model</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Trips</TableHead>
                  <TableHead className="text-right">Total Km</TableHead>
                  <TableHead>GPS</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => {
                  const typeStyle = getVehicleTypeStyle(vehicle.type)
                  const fuelStyle = getFuelTypeStyle(vehicle.fuelType)
                  const statusStyle = getVehicleStatusStyle(vehicle.status)

                  return (
                    <TableRow
                      key={vehicle._id}
                      className="cursor-pointer"
                      onClick={() => setSelectedVehicleId(vehicle._id)}
                    >
                      <TableCell className="font-mono font-medium">
                        {vehicle.registrationNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px]", typeStyle.bg, typeStyle.text, typeStyle.border, "border")}
                        >
                          {typeStyle.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px]", fuelStyle.bg, fuelStyle.text, fuelStyle.border, "border")}
                        >
                          {fuelStyle.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px]", statusStyle.bg, statusStyle.text, statusStyle.border, "border")}
                        >
                          {statusStyle.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{vehicle.totalTrips}</TableCell>
                      <TableCell className="text-right font-mono">
                        {vehicle.totalKm.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-block size-2",
                          vehicle.gpsDeviceId ? "bg-emerald-500" : "bg-gray-300"
                        )} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(vehicle._id)
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

      <AddVehicleDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <VehicleDetailSheet
        vehicleId={selectedVehicleId}
        open={!!selectedVehicleId}
        onOpenChange={(open) => !open && setSelectedVehicleId(null)}
      />
    </>
  )
}
