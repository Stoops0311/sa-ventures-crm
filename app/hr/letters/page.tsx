"use client"

import { Suspense, useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileUploadIcon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LetterGenerator } from "@/components/hr/letters/letter-generator"
import { TemplateList } from "@/components/hr/letters/template-list"
import { LetterUploadDialog } from "@/components/hr/letters/letter-upload-dialog"

function LettersPageContent() {
  const templates = useQuery(api.letterTemplates.list)
  const seed = useMutation(api.letterTemplates.seed)
  const [uploadOpen, setUploadOpen] = useState(false)

  // Auto-seed templates on first visit
  useEffect(() => {
    if (templates !== undefined && templates.length === 0) {
      seed()
    }
  }, [templates, seed])

  const templateCount = templates?.length ?? 0

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Page header with Upload button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-lg font-semibold">Letters</h1>
          <p className="text-xs text-muted-foreground">
            Generate employee letters and manage templates
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setUploadOpen(true)}
        >
          <HugeiconsIcon
            icon={FileUploadIcon}
            className="size-4 mr-1.5"
            strokeWidth={1.5}
          />
          Upload Document
        </Button>
      </div>

      {/* Section 1: Letter Generation */}
      <LetterGenerator />

      {/* Section 2: Template Management */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-sans text-lg font-semibold">Templates</h2>
            {templateCount > 0 && (
              <Badge variant="secondary" className="text-[10px] font-mono">
                {templateCount}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Manage letter template content and availability
          </p>
        </div>
        <TemplateList />
      </div>

      {/* Upload Dialog */}
      <LetterUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
    </div>
  )
}

export default function LettersPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto p-6 space-y-4">
          <div className="h-8 bg-muted animate-pulse w-48" />
          <div className="h-64 bg-muted animate-pulse" />
          <div className="h-48 bg-muted animate-pulse" />
        </div>
      }
    >
      <LettersPageContent />
    </Suspense>
  )
}
