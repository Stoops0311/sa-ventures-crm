"use client"

import { useState, useCallback, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileUploadIcon, Delete02Icon, ViewIcon, File02Icon } from "@hugeicons/core-free-icons"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { CreativePreviewDialog } from "./creative-preview-dialog"
import { cn } from "@/lib/utils"

interface CreativesGalleryProps {
  projectId: Id<"projects">
}

export function CreativesGallery({ projectId }: CreativesGalleryProps) {
  const creatives = useQuery(api.projectCreatives.listByProject, { projectId })
  const generateUploadUrl = useMutation(api.projectCreatives.generateUploadUrl)
  const createCreative = useMutation(api.projectCreatives.create)
  const removeCreative = useMutation(api.projectCreatives.remove)

  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFileType, setPreviewFileType] = useState<string | undefined>()
  const [previewOpen, setPreviewOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (file: File) => {
      const isImage = file.type.startsWith("image/")
      const isPdf = file.type === "application/pdf"
      if (!isImage && !isPdf) {
        toast.error("Only image and PDF files are supported.")
        return
      }

      setIsUploading(true)
      try {
        // Step 1: Get upload URL
        const uploadUrl = await generateUploadUrl()

        // Step 2: Upload file
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        })

        if (!result.ok) {
          throw new Error("Upload failed")
        }

        const { storageId } = await result.json()

        // Step 3: Create record
        await createCreative({
          projectId,
          storageId,
          fileName: file.name,
          fileType: file.type,
        })

        toast.success("Creative uploaded successfully")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to upload creative")
      } finally {
        setIsUploading(false)
      }
    },
    [generateUploadUrl, createCreative, projectId]
  )

  const handleDelete = useCallback(
    async (creativeId: Id<"projectCreatives">) => {
      try {
        await removeCreative({ creativeId })
        toast.success("Creative deleted")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to delete creative")
      }
    },
    [removeCreative]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleUpload(file)
    },
    [handleUpload]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleUpload(file)
    },
    [handleUpload]
  )

  return (
    <div className="space-y-3">
      <h3 className="font-sans text-sm font-medium">Creatives</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {creatives?.map((creative) => (
          <div
            key={creative._id}
            className="group relative aspect-square bg-muted overflow-hidden border"
          >
            {creative.fileType === "application/pdf" ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                <HugeiconsIcon
                  icon={File02Icon}
                  className="size-8 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-[10px] text-muted-foreground px-2 text-center truncate max-w-full">
                  {creative.fileName}
                </span>
              </div>
            ) : creative.url ? (
              <img
                src={creative.url}
                alt={creative.fileName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                No preview
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="icon-sm"
                onClick={() => {
                  setPreviewUrl(creative.url ?? null)
                  setPreviewFileType(creative.fileType)
                  setPreviewOpen(true)
                }}
              >
                <HugeiconsIcon icon={ViewIcon} strokeWidth={2} />
              </Button>
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" size="icon-sm">
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                  </Button>
                }
                title="Delete Creative"
                description={`Are you sure you want to delete "${creative.fileName}"? This cannot be undone.`}
                confirmLabel="Delete"
                variant="destructive"
                onConfirm={() => handleDelete(creative._id)}
              />
            </div>

            <p className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white truncate">
              {creative.fileName}
            </p>
          </div>
        ))}

        {/* Upload zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "aspect-square border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
            isDragging && "border-primary bg-primary/5",
            !isDragging && "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <HugeiconsIcon
            icon={FileUploadIcon}
            className="size-6 text-muted-foreground/50"
            strokeWidth={1.5}
          />
          <span className="text-[10px] text-muted-foreground text-center px-2">
            {isUploading ? "Uploading..." : "Drop file or click"}
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,application/pdf"
        className="hidden"
        onChange={handleInputChange}
      />

      <CreativePreviewDialog
        url={previewUrl}
        fileType={previewFileType}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  )
}
