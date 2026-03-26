"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { AfterSalesProcessContent } from "./after-sales-process-content"

interface ProcessDialogProps {
  processId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AfterSalesProcessDialog({
  processId,
  open,
  onOpenChange,
}: ProcessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle>After Sales Process</DialogTitle>
          <DialogDescription className="sr-only">
            View and manage the after-sales process for this customer
          </DialogDescription>
        </DialogHeader>
        {processId ? (
          <div className="flex-1 overflow-hidden">
            <AfterSalesProcessContent processId={processId} />
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-xs text-muted-foreground">
              No process selected
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
