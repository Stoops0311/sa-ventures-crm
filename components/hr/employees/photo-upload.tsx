"use client"

import { useState, useRef } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import { Camera01Icon } from "@hugeicons/core-free-icons"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

type Props = {
  userId: Id<"users">
  currentPhotoUrl?: string | null
  clerkImageUrl?: string
  name: string
}

export function PhotoUpload({ userId, currentPhotoUrl, clerkImageUrl, name }: Props) {
  const generateUploadUrl = useMutation(api.employeeProfiles.generateUploadUrl)
  const updatePhoto = useMutation(api.employeeProfiles.updatePhoto)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const displayUrl = previewUrl ?? currentPhotoUrl ?? clerkImageUrl

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are accepted")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB")
      return
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setUploading(true)

    try {
      const uploadUrl = await generateUploadUrl()
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!result.ok) throw new Error("Upload failed")

      const { storageId } = await result.json()
      await updatePhoto({ userId, storageId })
      toast.success("Photo uploaded")
    } catch {
      toast.error("Photo upload failed. Please try again.")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
      // Clear input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileSelect}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="relative group size-[120px] border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden hover:border-muted-foreground/50 transition-colors"
      >
        {uploading && (
          <div className="absolute inset-0 z-10 bg-background/60 flex items-center justify-center">
            <Skeleton className="size-full animate-pulse" />
          </div>
        )}
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt={name}
              className="size-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">Change</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <HugeiconsIcon icon={Camera01Icon} className="size-6" strokeWidth={1.5} />
            <span className="text-[10px]">Upload</span>
          </div>
        )}
      </button>
      <p className="text-[10px] text-muted-foreground mt-1">
        JPG or PNG, max 5MB
      </p>
    </div>
  )
}
