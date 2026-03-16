"use client"

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

interface CreativePreviewDialogProps {
  url: string | null
  fileType?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreativePreviewDialog({
  url,
  fileType,
  open,
  onOpenChange,
}: CreativePreviewDialogProps) {
  const isPdf = fileType === "application/pdf"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0">
        {url && isPdf ? (
          <iframe
            src={url}
            title="PDF preview"
            className="w-full h-[80vh]"
          />
        ) : url ? (
          <img
            src={url}
            alt="Creative preview"
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
