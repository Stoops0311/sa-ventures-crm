"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useParams } from "next/navigation"
import { ProjectGallery } from "@/components/website/project-gallery"
import { ContactForm } from "@/components/website/contact-form"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon } from "@hugeicons/core-free-icons"
import type { Id } from "@/convex/_generated/dataModel"
import Link from "next/link"

export default function ProjectDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const project = useQuery(api.publicSite.getProjectBySlug, { slug })

  if (project === undefined) {
    return (
      <div className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-96 w-full" />
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="mt-4 h-48 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (project === null) {
    return (
      <div className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold">Project Not Found</h1>
          <p className="mt-3 text-muted-foreground">
            This project may have been removed or the URL is incorrect.
          </p>
          <Link
            href="/projects"
            className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
          >
            &larr; Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  const configurations = project.configurations
    ? (JSON.parse(project.configurations) as {
        type: string
        size: string
        price: string
      }[])
    : []

  return (
    <div className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-primary">
            Projects
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{project.name}</span>
        </nav>

        {/* Gallery */}
        <ProjectGallery
          creatives={project.creatives}
          projectName={project.name}
        />

        {/* Content */}
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          {/* Details */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge className="bg-primary text-white">
                {project.priceRange}
              </Badge>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-muted-foreground">
              <HugeiconsIcon
                icon={Location01Icon}
                size={16}
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
              <div className="mt-6">
                <h2 className="text-lg font-semibold">About this Project</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {project.description}
                </p>
              </div>
            )}

            {/* Key Details */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {project.possessionDate && (
                <div className="border p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Possession
                  </p>
                  <p className="mt-1 font-semibold">
                    {project.possessionDate}
                  </p>
                </div>
              )}
              {project.reraNumber && (
                <div className="border p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    RERA Number
                  </p>
                  <p className="mt-1 font-semibold">{project.reraNumber}</p>
                </div>
              )}
            </div>

            {/* Configurations */}
            {configurations.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Configurations</h2>
                <div className="mt-4 overflow-hidden border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Size
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {configurations.map((config, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-3 font-medium">
                            {config.type}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {config.size}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {config.price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Amenities */}
            {project.amenities && project.amenities.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Amenities</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {project.amenities.map((amenity) => (
                    <Badge
                      key={amenity}
                      variant="outline"
                      className="px-3 py-1.5"
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            {project.mapEmbedUrl && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Location</h2>
                <div className="mt-4 aspect-[16/9] overflow-hidden border">
                  <iframe
                    src={project.mapEmbedUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Project location"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Contact Form Sidebar */}
          <div>
            <div className="sticky top-20 border bg-white p-6">
              <h2 className="text-lg font-semibold">Interested?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fill in your details and we&apos;ll get back to you
              </p>
              <div className="mt-6">
                <ContactForm
                  preselectedProjectId={project._id as Id<"projects">}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
