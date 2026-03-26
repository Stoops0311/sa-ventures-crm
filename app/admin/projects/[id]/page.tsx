"use client"

import { use, useState, useCallback } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Add01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { CreativesGallery } from "@/components/projects/creatives-gallery"
import { PageSkeleton } from "@/components/shared/loading-skeleton"
import {
  PROPERTY_TYPES,
  CONSTRUCTION_STATUSES,
  TRANSACTION_TYPES,
  OWNERSHIP_TYPES,
  FURNISHING_STATUSES,
  POWER_BACKUP_OPTIONS,
  FACING_OPTIONS,
  OVERLOOKING_OPTIONS,
  LANDMARK_TYPES,
} from "@/lib/constants"

type ProjectData = Record<string, unknown>

interface LandmarkEntry {
  type: string
  name: string
  distance: string
}

interface ConfigEntry {
  type: string
  superArea: string
  carpetArea: string
  bedrooms: string
  bathrooms: string
  balconies: string
  price: string
  facing: string
}

// Helper to safely parse JSON or return default
function parseJSON<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  const project = useQuery(api.projects.getById, {
    projectId: id as Id<"projects">,
  })
  const updateProject = useMutation(api.projects.update)
  const archiveProject = useMutation(api.projects.archive)

  const [changes, setChanges] = useState<ProjectData>({})
  const [isSaving, setIsSaving] = useState(false)

  // Landmark and config local state (initialized from project)
  const [landmarks, setLandmarks] = useState<LandmarkEntry[] | null>(null)
  const [configs, setConfigs] = useState<ConfigEntry[] | null>(null)
  const [amenityInput, setAmenityInput] = useState("")
  const [localAmenities, setLocalAmenities] = useState<string[] | null>(null)
  const [overlookingLocal, setOverlookingLocal] = useState<string[] | null>(null)

  const set = useCallback((key: string, value: unknown) => {
    setChanges((prev) => ({ ...prev, [key]: value }))
  }, [])

  const get = useCallback(
    (key: string) => {
      if (key in changes) return changes[key]
      if (project) return (project as ProjectData)[key]
      return undefined
    },
    [changes, project]
  )

  if (project === undefined || project === null) {
    return <PageSkeleton />
  }

  const currentLandmarks =
    landmarks ?? parseJSON<LandmarkEntry[]>(project.nearbyLandmarks, [])
  const currentConfigs =
    configs ??
    parseJSON<ConfigEntry[]>(project.configurations, [])
  const currentAmenities = localAmenities ?? project.amenities ?? []
  const currentOverlooking = overlookingLocal ?? project.overlooking ?? []

  const hasChanges =
    Object.keys(changes).length > 0 ||
    landmarks !== null ||
    configs !== null ||
    localAmenities !== null ||
    overlookingLocal !== null

  async function handleSave() {
    if (!hasChanges) return
    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = { projectId: id as Id<"projects"> }

      // Copy scalar changes
      for (const [key, value] of Object.entries(changes)) {
        payload[key] = value
      }

      // Serialize JSON fields if modified
      if (landmarks !== null) {
        payload.nearbyLandmarks = JSON.stringify(landmarks)
      }
      if (configs !== null) {
        payload.configurations = JSON.stringify(configs)
      }
      if (localAmenities !== null) {
        payload.amenities = localAmenities
      }
      if (overlookingLocal !== null) {
        payload.overlooking = overlookingLocal
      }

      await updateProject(payload as Parameters<typeof updateProject>[0])
      toast.success("Project updated")
      setChanges({})
      setLandmarks(null)
      setConfigs(null)
      setLocalAmenities(null)
      setOverlookingLocal(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update project")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleArchive() {
    try {
      await archiveProject({ projectId: id as Id<"projects"> })
      toast.success("Project archived")
      router.push("/admin/projects")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to archive project"
      )
    }
  }

  function addLandmark() {
    const updated = [...currentLandmarks, { type: "school", name: "", distance: "" }]
    setLandmarks(updated)
  }

  function updateLandmark(index: number, field: keyof LandmarkEntry, value: string) {
    const updated = [...currentLandmarks]
    updated[index] = { ...updated[index], [field]: value }
    setLandmarks(updated)
  }

  function removeLandmark(index: number) {
    const updated = currentLandmarks.filter((_, i) => i !== index)
    setLandmarks(updated)
  }

  function addConfig() {
    const updated = [
      ...currentConfigs,
      { type: "", superArea: "", carpetArea: "", bedrooms: "", bathrooms: "", balconies: "", price: "", facing: "" },
    ]
    setConfigs(updated)
  }

  function updateConfig(index: number, field: keyof ConfigEntry, value: string) {
    const updated = [...currentConfigs]
    updated[index] = { ...updated[index], [field]: value }
    setConfigs(updated)
  }

  function removeConfig(index: number) {
    const updated = currentConfigs.filter((_, i) => i !== index)
    setConfigs(updated)
  }

  function addAmenity() {
    const trimmed = amenityInput.trim()
    if (!trimmed || currentAmenities.includes(trimmed)) return
    setLocalAmenities([...currentAmenities, trimmed])
    setAmenityInput("")
  }

  function removeAmenity(amenity: string) {
    setLocalAmenities(currentAmenities.filter((a) => a !== amenity))
  }

  function toggleOverlooking(value: string) {
    if (currentOverlooking.includes(value)) {
      setOverlookingLocal(currentOverlooking.filter((v) => v !== value))
    } else {
      setOverlookingLocal([...currentOverlooking, value])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/admin/projects")}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
          <h1 className="font-sans text-lg font-semibold">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          {project.status === "active" && (
            <Button variant="destructive" size="sm" onClick={handleArchive}>
              Archive
            </Button>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Section 1: Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={(get("name") as string) ?? ""}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={(get("location") as string) ?? ""}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Price Range</Label>
              <Input
                value={(get("priceRange") as string) ?? ""}
                onChange={(e) => set("priceRange", e.target.value)}
                placeholder="e.g. 45L - 1.2Cr"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Developer Name</Label>
              <Input
                value={(get("developerName") as string) ?? ""}
                onChange={(e) => set("developerName", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={(get("description") as string) ?? ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Detailed project description..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Classification */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Property Classification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Property Type</Label>
              <Select
                value={(get("propertyType") as string) ?? ""}
                onValueChange={(v) => set("propertyType", v)}
              >
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
              <Label>Construction Status</Label>
              <Select
                value={(get("constructionStatus") as string) ?? ""}
                onValueChange={(v) => set("constructionStatus", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {CONSTRUCTION_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Transaction Type</Label>
              <Select
                value={(get("transactionType") as string) ?? ""}
                onValueChange={(v) => set("transactionType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Ownership Type</Label>
              <Select
                value={(get("ownershipType") as string) ?? ""}
                onValueChange={(v) => set("ownershipType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {OWNERSHIP_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Building Details */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Building Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Total Floors</Label>
              <Input
                type="number"
                value={(get("totalFloors") as number) ?? ""}
                onChange={(e) =>
                  set("totalFloors", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Total Towers</Label>
              <Input
                type="number"
                value={(get("totalTowers") as number) ?? ""}
                onChange={(e) =>
                  set("totalTowers", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Total Units</Label>
              <Input
                type="number"
                value={(get("totalUnits") as number) ?? ""}
                onChange={(e) =>
                  set("totalUnits", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Launch Date</Label>
              <Input
                value={(get("launchDate") as string) ?? ""}
                onChange={(e) => set("launchDate", e.target.value)}
                placeholder="e.g. Mar 2024"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Possession Date</Label>
              <Input
                value={(get("possessionDate") as string) ?? ""}
                onChange={(e) => set("possessionDate", e.target.value)}
                placeholder="e.g. Dec 2026"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Completion Date</Label>
              <Input
                value={(get("completionDate") as string) ?? ""}
                onChange={(e) => set("completionDate", e.target.value)}
                placeholder="e.g. Dec 2027"
              />
            </div>
            <div className="space-y-1.5">
              <Label>RERA Number</Label>
              <Input
                value={(get("reraNumber") as string) ?? ""}
                onChange={(e) => set("reraNumber", e.target.value)}
                placeholder="e.g. P52100001234"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Pricing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>Price per Sqft</Label>
              <Input
                value={(get("pricePerSqft") as string) ?? ""}
                onChange={(e) => set("pricePerSqft", e.target.value)}
                placeholder="e.g. ₹8,500/sqft"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Maintenance Charges</Label>
              <Input
                value={(get("maintenanceCharges") as string) ?? ""}
                onChange={(e) => set("maintenanceCharges", e.target.value)}
                placeholder="e.g. ₹5/sqft/month"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Booking Amount</Label>
              <Input
                value={(get("bookingAmount") as string) ?? ""}
                onChange={(e) => set("bookingAmount", e.target.value)}
                placeholder="e.g. ₹5,00,000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>DSM Commission (₹)</Label>
              <Input
                type="number"
                value={(get("dsmCommissionAmount") as number) ?? ""}
                onChange={(e) =>
                  set("dsmCommissionAmount", e.target.value ? Number(e.target.value) : undefined)
                }
                placeholder="e.g. 15000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Specifications */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Specifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Flooring</Label>
              <Input
                value={(get("flooring") as string) ?? ""}
                onChange={(e) => set("flooring", e.target.value)}
                placeholder="e.g. Vitrified Tiles"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Water Supply</Label>
              <Input
                value={(get("waterSupply") as string) ?? ""}
                onChange={(e) => set("waterSupply", e.target.value)}
                placeholder="e.g. Corporation + Borewell, 24 Hours"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Power Backup</Label>
              <Select
                value={(get("powerBackup") as string) ?? ""}
                onValueChange={(v) => set("powerBackup", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {POWER_BACKUP_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Furnishing Status</Label>
              <Select
                value={(get("furnishingStatus") as string) ?? ""}
                onValueChange={(v) => set("furnishingStatus", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {FURNISHING_STATUSES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Parking Info</Label>
              <Input
                value={(get("parkingInfo") as string) ?? ""}
                onChange={(e) => set("parkingInfo", e.target.value)}
                placeholder="e.g. Covered: 1, Open: 1 per unit"
              />
            </div>
          </div>
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={(get("gatedCommunity") as boolean) ?? false}
                onCheckedChange={(v) => set("gatedCommunity", v)}
              />
              <Label className="font-normal">Gated Community</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={(get("petFriendly") as boolean) ?? false}
                onCheckedChange={(v) => set("petFriendly", v)}
              />
              <Label className="font-normal">Pet Friendly</Label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Overlooking</Label>
            <div className="flex flex-wrap gap-2">
              {OVERLOOKING_OPTIONS.map((o) => (
                <Badge
                  key={o.value}
                  variant={currentOverlooking.includes(o.value) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleOverlooking(o.value)}
                >
                  {o.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Location */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Location Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={(get("city") as string) ?? ""}
                onChange={(e) => set("city", e.target.value)}
                placeholder="e.g. Navi Mumbai"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Locality</Label>
              <Input
                value={(get("locality") as string) ?? ""}
                onChange={(e) => set("locality", e.target.value)}
                placeholder="e.g. Nerul"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Pincode</Label>
              <Input
                value={(get("pincode") as string) ?? ""}
                onChange={(e) => set("pincode", e.target.value)}
                placeholder="e.g. 400706"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                value={(get("latitude") as number) ?? ""}
                onChange={(e) =>
                  set("latitude", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                value={(get("longitude") as number) ?? ""}
                onChange={(e) =>
                  set("longitude", e.target.value ? Number(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Map Embed URL</Label>
              <Input
                value={(get("mapEmbedUrl") as string) ?? ""}
                onChange={(e) => set("mapEmbedUrl", e.target.value)}
                placeholder="Google Maps embed URL"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Amenities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              placeholder="Type an amenity and press Add"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  addAmenity()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addAmenity}>
              <HugeiconsIcon icon={Add01Icon} size={16} />
              Add
            </Button>
          </div>
          {currentAmenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {currentAmenities.map((amenity) => (
                <Badge
                  key={amenity}
                  variant="outline"
                  className="gap-1 px-3 py-1.5"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => removeAmenity(amenity)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    &times;
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 8: Nearby Landmarks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-sans">Nearby Landmarks</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addLandmark}>
            <HugeiconsIcon icon={Add01Icon} size={16} />
            Add Landmark
          </Button>
        </CardHeader>
        <CardContent>
          {currentLandmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No landmarks added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {currentLandmarks.map((lm, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select
                    value={lm.type}
                    onValueChange={(v) => updateLandmark(i, "type", v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANDMARK_TYPES.map((lt) => (
                        <SelectItem key={lt.value} value={lt.value}>
                          {lt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={lm.name}
                    onChange={(e) => updateLandmark(i, "name", e.target.value)}
                    placeholder="Name"
                    className="flex-1"
                  />
                  <Input
                    value={lm.distance}
                    onChange={(e) => updateLandmark(i, "distance", e.target.value)}
                    placeholder="Distance"
                    className="w-28"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeLandmark(i)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 9: Configurations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-sans">Configurations</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addConfig}>
            <HugeiconsIcon icon={Add01Icon} size={16} />
            Add Configuration
          </Button>
        </CardHeader>
        <CardContent>
          {currentConfigs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No configurations added yet.
            </p>
          ) : (
            <div className="space-y-4">
              {currentConfigs.map((cfg, i) => (
                <div key={i} className="border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Config {i + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeConfig(i)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Input
                        value={cfg.type}
                        onChange={(e) => updateConfig(i, "type", e.target.value)}
                        placeholder="e.g. 2 BHK"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Super Area</Label>
                      <Input
                        value={cfg.superArea}
                        onChange={(e) => updateConfig(i, "superArea", e.target.value)}
                        placeholder="e.g. 1200 sqft"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Carpet Area</Label>
                      <Input
                        value={cfg.carpetArea}
                        onChange={(e) => updateConfig(i, "carpetArea", e.target.value)}
                        placeholder="e.g. 950 sqft"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Price</Label>
                      <Input
                        value={cfg.price}
                        onChange={(e) => updateConfig(i, "price", e.target.value)}
                        placeholder="e.g. 85L"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bedrooms</Label>
                      <Input
                        value={cfg.bedrooms}
                        onChange={(e) => updateConfig(i, "bedrooms", e.target.value)}
                        placeholder="e.g. 2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Bathrooms</Label>
                      <Input
                        value={cfg.bathrooms}
                        onChange={(e) => updateConfig(i, "bathrooms", e.target.value)}
                        placeholder="e.g. 2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Balconies</Label>
                      <Input
                        value={cfg.balconies}
                        onChange={(e) => updateConfig(i, "balconies", e.target.value)}
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Facing</Label>
                      <Select
                        value={cfg.facing}
                        onValueChange={(v) => updateConfig(i, "facing", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {FACING_OPTIONS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Section 10: Creatives */}
      <CreativesGallery projectId={id as Id<"projects">} />
    </div>
  )
}
