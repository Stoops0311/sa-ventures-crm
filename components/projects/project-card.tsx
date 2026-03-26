"use client"

import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { HugeiconsIcon } from "@hugeicons/react"
import { Building06Icon, Location01Icon } from "@hugeicons/core-free-icons"
import { PROPERTY_TYPES, getConstructionStatusStyle } from "@/lib/constants"

interface ProjectCardProps {
  project: {
    _id: string
    name: string
    description?: string
    location: string
    priceRange: string
    status: string
    propertyType?: string
    constructionStatus?: string
  }
  leadCount: number
}

export function ProjectCard({ project, leadCount }: ProjectCardProps) {
  const router = useRouter()

  return (
    <Card
      className="cursor-pointer hover:bg-muted/30 transition-colors"
      onClick={() => router.push(`/admin/projects/${project._id}`)}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <HugeiconsIcon
              icon={Building06Icon}
              className="size-4 text-muted-foreground shrink-0"
              strokeWidth={2}
            />
            <h3 className="font-sans font-semibold text-base truncate">
              {project.name}
            </h3>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 ${
              project.status === "active"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {project.status === "active" ? "Active" : "Archived"}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Location01Icon} className="size-3" strokeWidth={2} />
          <span>{project.location}</span>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm">{project.priceRange}</p>
          {project.propertyType && (
            <Badge variant="outline" className="text-xs">
              {PROPERTY_TYPES.find((t) => t.value === project.propertyType)?.label ?? project.propertyType}
            </Badge>
          )}
          {project.constructionStatus && (() => {
            const style = getConstructionStatusStyle(project.constructionStatus!)
            return (
              <Badge className={`text-xs ${style.bg} ${style.text} ${style.border}`}>
                {style.label}
              </Badge>
            )
          })()}
        </div>

        <p className="text-xs text-muted-foreground">
          {leadCount} lead{leadCount !== 1 ? "s" : ""}
        </p>
      </CardContent>
    </Card>
  )
}
