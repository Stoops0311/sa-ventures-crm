"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VEHICLE_TYPE_STYLES, FUEL_TYPE_STYLES } from "@/lib/constants"
import { toast } from "sonner"

interface LogTripDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogTripDialog({ open, onOpenChange }: LogTripDialogProps) {
  const createTrip = useMutation(api.trips.create)
  const activeVehicles = useQuery(api.vehicles.getActiveVehicles)

  const [vehicleId, setVehicleId] = useState<string>("")
  const [isCustomVehicle, setIsCustomVehicle] = useState(false)

  // Custom vehicle fields
  const [customType, setCustomType] = useState("")
  const [customMake, setCustomMake] = useState("")
  const [customModel, setCustomModel] = useState("")
  const [customRegNo, setCustomRegNo] = useState("")
  const [customFuel, setCustomFuel] = useState("")

  // Trip fields
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [driverName, setDriverName] = useState("")
  const [startLocation, setStartLocation] = useState("")
  const [destination, setDestination] = useState("")
  const [purpose, setPurpose] = useState("")
  const [odometerStart, setOdometerStart] = useState("")
  const [odometerEnd, setOdometerEnd] = useState("")
  const [fuelFilled, setFuelFilled] = useState("")
  const [fuelCost, setFuelCost] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState("completed")
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setVehicleId("")
    setIsCustomVehicle(false)
    setCustomType("")
    setCustomMake("")
    setCustomModel("")
    setCustomRegNo("")
    setCustomFuel("")
    setDate(new Date().toISOString().split("T")[0])
    setDriverName("")
    setStartLocation("")
    setDestination("")
    setPurpose("")
    setOdometerStart("")
    setOdometerEnd("")
    setFuelFilled("")
    setFuelCost("")
    setNotes("")
    setStatus("completed")
  }

  const isPlanned = status === "planned"
  const isValid = isCustomVehicle
    ? customType && customRegNo && customFuel && (isPlanned || (odometerStart && odometerEnd && fuelCost))
    : vehicleId && (isPlanned || (odometerStart && odometerEnd && fuelCost))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setSubmitting(true)
    try {
      await createTrip({
        vehicleId: isCustomVehicle ? undefined : vehicleId as Id<"vehicles">,
        customVehicle: isCustomVehicle
          ? {
              type: customType,
              make: customMake || undefined,
              model: customModel || undefined,
              registrationNumber: customRegNo.toUpperCase(),
              fuelType: customFuel,
            }
          : undefined,
        date,
        driverName: driverName || undefined,
        startLocation: startLocation || undefined,
        destination: destination || undefined,
        purpose: purpose || undefined,
        odometerStart: odometerStart ? parseFloat(odometerStart) : undefined,
        odometerEnd: odometerEnd ? parseFloat(odometerEnd) : undefined,
        fuelFilled: fuelFilled ? parseFloat(fuelFilled) : undefined,
        fuelCost: fuelCost ? parseFloat(fuelCost) : undefined,
        status,
        notes: notes || undefined,
      })
      toast.success("Trip logged")
      reset()
      onOpenChange(false)
    } catch {
      toast.error("Failed to log trip")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Trip</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vehicle selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Vehicle *</Label>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Custom / Rental</Label>
                <Switch
                  checked={isCustomVehicle}
                  onCheckedChange={(checked) => {
                    setIsCustomVehicle(checked)
                    setVehicleId("")
                  }}
                />
              </div>
            </div>

            {isCustomVehicle ? (
              <div className="space-y-3 border p-3 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  This vehicle will be added temporarily and removed after 3 hours.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Type *</Label>
                    <Select value={customType} onValueChange={setCustomType}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPE_STYLES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fuel *</Label>
                    <Select value={customFuel} onValueChange={setCustomFuel}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Fuel" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPE_STYLES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Registration # *</Label>
                  <Input
                    value={customRegNo}
                    onChange={(e) => setCustomRegNo(e.target.value)}
                    placeholder="e.g., MH01AB1234"
                    className="h-8 text-xs uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Make</Label>
                    <Input
                      value={customMake}
                      onChange={(e) => setCustomMake(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Model</Label>
                    <Input
                      value={customModel}
                      onChange={(e) => setCustomModel(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {activeVehicles?.map((v) => (
                    <SelectItem key={v._id} value={v._id}>
                      {v.registrationNumber} — {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Trip details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Driver Name</Label>
            <Input
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Driver name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Location</Label>
              <Input
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                placeholder="From"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Destination</Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="To"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Input
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g., Client site visit"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Odometer Start (km) {!isPlanned && "*"}</Label>
              <Input
                type="number"
                value={odometerStart}
                onChange={(e) => setOdometerStart(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Odometer End (km) {!isPlanned && "*"}</Label>
              <Input
                type="number"
                value={odometerEnd}
                onChange={(e) => setOdometerEnd(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Fuel Filled (L/kg)</Label>
              <Input
                type="number"
                value={fuelFilled}
                onChange={(e) => setFuelFilled(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fuel Cost (₹) {!isPlanned && "*"}</Label>
              <Input
                type="number"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || submitting}>
              {submitting ? "Logging..." : "Log Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
