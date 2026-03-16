"use client"

import { use, useState } from "react"
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
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { CreativesGallery } from "@/components/projects/creatives-gallery"
import { PageSkeleton } from "@/components/shared/loading-skeleton"

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

  const [name, setName] = useState<string | undefined>()
  const [description, setDescription] = useState<string | undefined>()
  const [location, setLocation] = useState<string | undefined>()
  const [priceRange, setPriceRange] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)

  if (project === undefined || project === null) {
    return <PageSkeleton />
  }

  // Use local state if set, otherwise project values
  const currentName = name ?? project.name
  const currentDescription = description ?? project.description ?? ""
  const currentLocation = location ?? project.location
  const currentPriceRange = priceRange ?? project.priceRange

  const hasChanges =
    (name !== undefined && name !== project.name) ||
    (description !== undefined && description !== (project.description ?? "")) ||
    (location !== undefined && location !== project.location) ||
    (priceRange !== undefined && priceRange !== project.priceRange)

  async function handleSave() {
    if (!hasChanges) return

    setIsSaving(true)
    try {
      await updateProject({
        projectId: id as Id<"projects">,
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        location: location !== undefined ? location : undefined,
        priceRange: priceRange !== undefined ? priceRange : undefined,
      })
      toast.success("Project updated")
      // Reset local state
      setName(undefined)
      setDescription(undefined)
      setLocation(undefined)
      setPriceRange(undefined)
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
      toast.error(err instanceof Error ? err.message : "Failed to archive project")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push("/admin/projects")}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        </Button>
        <h1 className="font-sans text-lg font-semibold">{project.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={currentName}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={currentLocation}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-price">Price Range</Label>
              <Input
                id="edit-price"
                value={currentPriceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <div className="flex items-center gap-2 h-8">
                <span className="text-xs capitalize">{project.status}</span>
                {project.status === "active" && (
                  <Button
                    variant="destructive"
                    size="xs"
                    onClick={handleArchive}
                  >
                    Archive
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={currentDescription}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <CreativesGallery projectId={id as Id<"projects">} />
    </div>
  )
}
