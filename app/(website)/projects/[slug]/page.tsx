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
import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  OWNERSHIP_TYPES,
  FURNISHING_STATUSES,
  POWER_BACKUP_OPTIONS,
  FACING_OPTIONS,
  OVERLOOKING_OPTIONS,
  LANDMARK_TYPES,
  getConstructionStatusStyle,
} from "@/lib/constants"

function getLabel(list: readonly { value: string; label: string }[], value: string | undefined) {
  if (!value) return null
  return list.find((item) => item.value === value)?.label ?? value
}

interface LandmarkEntry {
  type: string
  name: string
  distance: string
}

interface ConfigEntry {
  type?: string
  size?: string
  superArea?: string
  carpetArea?: string
  bedrooms?: string
  bathrooms?: string
  balconies?: string
  price?: string
  facing?: string
}

function DetailItem({ label, value }: { label: string; value: string | undefined | null }) {
  if (!value) return null
  return (
    <div className="border p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

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

  const configurations: ConfigEntry[] = project.configurations
    ? (() => {
        try {
          return JSON.parse(project.configurations) as ConfigEntry[]
        } catch {
          return []
        }
      })()
    : []

  const landmarks: LandmarkEntry[] = project.nearbyLandmarks
    ? (() => {
        try {
          return JSON.parse(project.nearbyLandmarks) as LandmarkEntry[]
        } catch {
          return []
        }
      })()
    : []

  const propertyTypeLabel = getLabel(PROPERTY_TYPES, project.propertyType)
  const constructionStyle = project.constructionStatus
    ? getConstructionStatusStyle(project.constructionStatus)
    : null
  const transactionLabel = getLabel(TRANSACTION_TYPES, project.transactionType)
  const ownershipLabel = getLabel(OWNERSHIP_TYPES, project.ownershipType)
  const furnishingLabel = getLabel(FURNISHING_STATUSES, project.furnishingStatus)
  const powerBackupLabel = getLabel(POWER_BACKUP_OPTIONS, project.powerBackup)

  // Check if configurations have the expanded fields
  const hasExpandedConfigs = configurations.some(
    (c) => c.superArea || c.carpetArea || c.bedrooms || c.bathrooms || c.balconies || c.facing
  )

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
            {/* Header */}
            <div className="flex flex-wrap items-start gap-3">
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <Badge className="bg-primary text-white">
                {project.priceRange}
              </Badge>
              {propertyTypeLabel && (
                <Badge variant="outline">{propertyTypeLabel}</Badge>
              )}
              {constructionStyle && (
                <Badge
                  className={`${constructionStyle.bg} ${constructionStyle.text} ${constructionStyle.border}`}
                >
                  {constructionStyle.label}
                </Badge>
              )}
              {transactionLabel && (
                <Badge variant="outline">{transactionLabel}</Badge>
              )}
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-muted-foreground">
              <HugeiconsIcon
                icon={Location01Icon}
                size={16}
                className="text-primary"
              />
              {project.location}
              {project.city && `, ${project.city}`}
              {project.pincode && ` - ${project.pincode}`}
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

            {/* Key Details Grid */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Possession" value={project.possessionDate} />
              <DetailItem label="RERA Number" value={project.reraNumber} />
              <DetailItem label="Ownership" value={ownershipLabel} />
              <DetailItem label="Price per Sqft" value={project.pricePerSqft} />
              <DetailItem label="Maintenance" value={project.maintenanceCharges} />
              <DetailItem label="Booking Amount" value={project.bookingAmount} />
              <DetailItem label="Flooring" value={project.flooring} />
              <DetailItem label="Water Supply" value={project.waterSupply} />
              <DetailItem label="Power Backup" value={powerBackupLabel} />
              <DetailItem label="Furnishing" value={furnishingLabel} />
              <DetailItem label="Parking" value={project.parkingInfo} />
              {project.gatedCommunity && (
                <DetailItem label="Gated Community" value="Yes" />
              )}
              {project.petFriendly && (
                <DetailItem label="Pet Friendly" value="Yes" />
              )}
            </div>

            {/* Overlooking */}
            {project.overlooking && project.overlooking.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Overlooking
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {project.overlooking.map((v) => (
                    <Badge key={v} variant="outline" className="px-3 py-1.5">
                      {getLabel(OVERLOOKING_OPTIONS, v) ?? v}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Building Info */}
            {(project.totalTowers || project.totalFloors || project.totalUnits || project.launchDate || project.completionDate) && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Building Information</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem label="Total Towers" value={project.totalTowers?.toString()} />
                  <DetailItem label="Total Floors" value={project.totalFloors?.toString()} />
                  <DetailItem label="Total Units" value={project.totalUnits?.toString()} />
                  <DetailItem label="Launch Date" value={project.launchDate} />
                  <DetailItem label="Completion Date" value={project.completionDate} />
                </div>
              </div>
            )}

            {/* Configurations */}
            {configurations.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Configurations</h2>
                <div className="mt-4 overflow-x-auto border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Type</th>
                        {hasExpandedConfigs ? (
                          <>
                            <th className="px-4 py-3 text-left font-medium">Super Area</th>
                            <th className="px-4 py-3 text-left font-medium">Carpet Area</th>
                            <th className="px-4 py-3 text-left font-medium">Bed</th>
                            <th className="px-4 py-3 text-left font-medium">Bath</th>
                            <th className="px-4 py-3 text-left font-medium">Balcony</th>
                            <th className="px-4 py-3 text-left font-medium">Facing</th>
                          </>
                        ) : (
                          <th className="px-4 py-3 text-left font-medium">Size</th>
                        )}
                        <th className="px-4 py-3 text-left font-medium">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {configurations.map((config, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-4 py-3 font-medium">{config.type}</td>
                          {hasExpandedConfigs ? (
                            <>
                              <td className="px-4 py-3 text-muted-foreground">{config.superArea || "-"}</td>
                              <td className="px-4 py-3 text-muted-foreground">{config.carpetArea || "-"}</td>
                              <td className="px-4 py-3 text-muted-foreground">{config.bedrooms || "-"}</td>
                              <td className="px-4 py-3 text-muted-foreground">{config.bathrooms || "-"}</td>
                              <td className="px-4 py-3 text-muted-foreground">{config.balconies || "-"}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {config.facing
                                  ? getLabel(FACING_OPTIONS, config.facing) ?? config.facing
                                  : "-"}
                              </td>
                            </>
                          ) : (
                            <td className="px-4 py-3 text-muted-foreground">{config.size || "-"}</td>
                          )}
                          <td className="px-4 py-3 text-muted-foreground">{config.price}</td>
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

            {/* Nearby Landmarks */}
            {landmarks.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold">Nearby Landmarks</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {landmarks.map((lm, i) => (
                    <div key={i} className="flex items-center justify-between border p-3">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          {getLabel(LANDMARK_TYPES, lm.type) ?? lm.type}
                        </p>
                        <p className="font-medium">{lm.name}</p>
                      </div>
                      {lm.distance && (
                        <span className="text-sm text-muted-foreground">
                          {lm.distance}
                        </span>
                      )}
                    </div>
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
