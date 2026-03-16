"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

interface Creative {
  _id: string
  url: string | null
  fileName: string
  fileType: string
}

interface ProjectGalleryProps {
  creatives: Creative[]
  projectName: string
}

export function ProjectGallery({
  creatives,
  projectName,
}: ProjectGalleryProps) {
  const images = creatives.filter(
    (c) => c.fileType.startsWith("image/") && c.url
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] items-center justify-center bg-primary/5">
        <span className="text-6xl font-bold text-primary/20">SA</span>
      </div>
    )
  }

  const mainImage = images[selectedIndex]

  return (
    <>
      {/* Main Image */}
      <div
        className="relative aspect-[16/9] cursor-pointer overflow-hidden bg-muted"
        onClick={() => setLightboxOpen(true)}
      >
        {mainImage?.url && (
          <Image
            src={mainImage.url}
            alt={`${projectName} - ${selectedIndex + 1}`}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute bottom-3 right-3 bg-foreground/70 px-3 py-1 text-xs text-white">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={img._id}
              onClick={() => setSelectedIndex(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden border-2 transition-colors",
                i === selectedIndex
                  ? "border-primary"
                  : "border-transparent hover:border-primary/30"
              )}
            >
              {img.url && (
                <Image
                  src={img.url}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl border-none bg-black/95 p-0">
          <DialogTitle className="sr-only">
            {projectName} - Image {selectedIndex + 1}
          </DialogTitle>
          <div className="relative aspect-[16/10]">
            {mainImage?.url && (
              <Image
                src={mainImage.url}
                alt={`${projectName} - ${selectedIndex + 1}`}
                fill
                className="object-contain"
              />
            )}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() =>
                    setSelectedIndex(
                      (selectedIndex - 1 + images.length) % images.length
                    )
                  }
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() =>
                    setSelectedIndex((selectedIndex + 1) % images.length)
                  }
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
