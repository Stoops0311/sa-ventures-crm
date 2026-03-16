"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VEHICLE_TYPE_STYLES, FUEL_TYPE_STYLES } from "@/lib/constants"
import { toast } from "sonner"

interface AddVehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddVehicleDialog({ open, onOpenChange }: AddVehicleDialogProps) {
  const createVehicle = useMutation(api.vehicles.create)

  const [type, setType] = useState("")
  const [make, setMake] = useState("")
  const [model, setModel] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [fuelType, setFuelType] = useState("")
  const [color, setColor] = useState("")
  const [year, setYear] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setType("")
    setMake("")
    setModel("")
    setRegistrationNumber("")
    setFuelType("")
    setColor("")
    setYear("")
    setNotes("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!type || !registrationNumber || !fuelType) return

    setSubmitting(true)
    try {
      await createVehicle({
        type,
        make: make || undefined,
        model: model || undefined,
        registrationNumber: registrationNumber.toUpperCase(),
        fuelType,
        color: color || undefined,
        year: year ? parseInt(year) : undefined,
        notes: notes || undefined,
      })
      toast.success("Vehicle added")
      reset()
      onOpenChange(false)
    } catch {
      toast.error("Failed to add vehicle")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Vehicle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPE_STYLES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fuel Type *</Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel" />
                </SelectTrigger>
                <SelectContent>
                  {FUEL_TYPE_STYLES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Registration Number *</Label>
            <Input
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g., MH01AB1234"
              className="uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Make</Label>
              <Input
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g., Maruti"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g., Swift"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g., White"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g., 2024"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!type || !registrationNumber || !fuelType || submitting}>
              {submitting ? "Adding..." : "Add Vehicle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
