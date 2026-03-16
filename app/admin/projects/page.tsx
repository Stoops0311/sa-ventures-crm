"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Building06Icon } from "@hugeicons/core-free-icons"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectCreateDialog } from "@/components/projects/project-create-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { PageSkeleton } from "@/components/shared/loading-skeleton"

export default function ProjectsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const projects = useQuery(api.projects.list, {
    status: showArchived ? undefined : "active",
  })

  if (projects === undefined) {
    return <PageSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-lg font-semibold">Projects</h1>
          <p className="text-xs text-muted-foreground">
            Manage residential projects and their creatives.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
          New Project
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="show-archived"
          size="sm"
          checked={showArchived}
          onCheckedChange={setShowArchived}
        />
        <Label htmlFor="show-archived" className="cursor-pointer">
          Show archived
        </Label>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={Building06Icon}
          title="No projects yet"
          description="Create your first project to start importing leads."
          action={{ label: "New Project", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              leadCount={0}
            />
          ))}
        </div>
      )}

      <ProjectCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
