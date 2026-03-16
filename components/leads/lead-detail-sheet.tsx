"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { LeadDetailContent } from "@/components/leads/lead-detail-content"

export function LeadDetailSheet({
  leadId,
  open,
  onOpenChange,
}: {
  leadId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>Lead Details</DialogTitle>
          <DialogDescription className="sr-only">
            View and manage lead information
          </DialogDescription>
        </DialogHeader>
        {leadId ? (
          <div className="flex-1 overflow-hidden">
            <LeadDetailContent leadId={leadId} />
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-xs text-muted-foreground">No lead selected</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
