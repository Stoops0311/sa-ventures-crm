"use client"

import Link from "next/link"
import Image from "next/image"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon } from "@hugeicons/core-free-icons"

export default function ProjectsPage() {
  const projects = useQuery(api.publicSite.listActiveProjects)

  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Our Projects
          </h1>
          <p className="mt-3 text-muted-foreground">
            Explore premium residential properties across Navi Mumbai
          </p>
        </div>

        {projects === undefined ? (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              New projects coming soon. Check back later!
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const firstImage = project.creatives.find(
                (c) => c.fileType.startsWith("image/") && c.url
              )
              return (
                <Link
                  key={project._id}
                  href={`/projects/${project.slug ?? project._id}`}
                >
                  <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {firstImage?.url ? (
                        <Image
                          src={firstImage.url}
                          alt={project.name}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-primary/5">
                          <span className="text-4xl font-bold text-primary/20">
                            SA
                          </span>
                        </div>
                      )}
                      <Badge className="absolute left-3 top-3 bg-primary text-white">
                        {project.priceRange}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <h2 className="text-lg font-semibold group-hover:text-primary">
                        {project.name}
                      </h2>
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <HugeiconsIcon
                          icon={Location01Icon}
                          size={14}
                          className="text-primary"
                        />
                        {project.location}
                      </div>
                      {project.developerName && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          by {project.developerName}
                        </p>
                      )}
                      {project.description && (
                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
