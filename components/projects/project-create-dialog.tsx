"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROPERTY_TYPES } from "@/lib/constants"

interface ProjectCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectCreateDialog({ open, onOpenChange }: ProjectCreateDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [priceRange, setPriceRange] = useState("")
  const [propertyType, setPropertyType] = useState("")
  const [dsmCommission, setDsmCommission] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createProject = useMutation(api.projects.create)

  const canSubmit = name.trim() !== "" && location.trim() !== "" && priceRange.trim() !== ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setIsSubmitting(true)
    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        location: location.trim(),
        priceRange: priceRange.trim(),
        propertyType: propertyType || undefined,
        dsmCommissionAmount: dsmCommission ? Number(dsmCommission) : undefined,
      })
      toast.success("Project created successfully")
      onOpenChange(false)
      setName("")
      setDescription("")
      setLocation("")
      setPriceRange("")
      setPropertyType("")
      setDsmCommission("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">New Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="project-name">Name *</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Green Valley Residences"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-type">Property Type</Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-location">Location *</Label>
            <Input
              id="project-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Sector 150, Noida"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-price">Price Range *</Label>
            <Input
              id="project-price"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              placeholder="e.g. 45L - 1.2Cr"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project-dsm-commission">DSM Commission (INR)</Label>
            <Input
              id="project-dsm-commission"
              type="number"
              value={dsmCommission}
              onChange={(e) => setDsmCommission(e.target.value)}
              placeholder="e.g. 15000"
              min={0}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
