"use client"

import { useState, useCallback, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { StepIndicator } from "@/components/import/step-indicator"
import { DragDropZone } from "@/components/import/drag-drop-zone"
import {
  ColumnMapping,
  autoDetectMappings,
  validateMappings,
} from "@/components/import/column-mapping"
import { AllocationPreview } from "@/components/import/allocation-preview"
import { ImportConfirm } from "@/components/import/import-confirm"

export default function ImportPage() {
  const [currentStep, setCurrentStep] = useState(0)

  // Step 0 state
  const [parsedData, setParsedData] = useState<{
    headers: string[]
    rows: string[][]
  } | null>(null)
  const [selectedProject, setSelectedProject] = useState<string>("")

  // Step 1 state
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})

  // Step 2 state
  const [selectedSalespeople, setSelectedSalespeople] = useState<Set<string>>(new Set())

  // Step 3 state
  const [importStatus, setImportStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [importError, setImportError] = useState<string | undefined>()

  // Queries
  const projects = useQuery(api.projects.list, { status: "active" })
  const excludeIds = useMemo(() => {
    const allSalespeople = new Set<string>()
    // Build list of excluded (unchecked) user IDs — we don't exclude any since
    // previewAllocation's excludeUserIds only filters out deselected users
    return undefined
  }, [])

  const allocationPreview = useQuery(
    api.import.previewAllocation,
    selectedSalespeople.size > 0 && parsedData
      ? {
          leadCount: parsedData.rows.length,
          excludeUserIds: undefined,
        }
      : "skip"
  )

  // Filter allocation to only include selected salespeople
  const filteredAllocation = useMemo(() => {
    if (!allocationPreview) return []

    const selected = allocationPreview.filter((entry) =>
      selectedSalespeople.has(entry.userId)
    )

    // Recalculate round-robin for only selected people
    if (selected.length === 0 || !parsedData) return []

    // Sort by current leads ascending
    selected.sort((a, b) => a.currentLeads - b.currentLeads)

    // Reset new leads counts
    const recalculated = selected.map((entry) => ({
      ...entry,
      newLeads: 0,
      totalAfter: entry.currentLeads,
    }))

    // Distribute round-robin
    for (let i = 0; i < parsedData.rows.length; i++) {
      const idx = i % recalculated.length
      recalculated[idx].newLeads += 1
      recalculated[idx].totalAfter += 1
    }

    return recalculated
  }, [allocationPreview, selectedSalespeople, parsedData])

  // Mutations
  const bulkImport = useMutation(api.import.bulkImportLeads)

  const selectedProjectData = projects?.find((p) => p._id === selectedProject)

  // Handlers
  const handleParsed = useCallback(
    (data: { headers: string[]; rows: string[][] }) => {
      setParsedData(data)
      const detected = autoDetectMappings(data.headers)
      setColumnMappings(detected)
    },
    []
  )

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 0:
        return parsedData !== null && selectedProject !== ""
      case 1: {
        const error = validateMappings(columnMappings)
        return error === null
      }
      case 2:
        return selectedSalespeople.size > 0
      default:
        return false
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      const error = validateMappings(columnMappings)
      if (error) {
        toast.error(error)
        return
      }
    }
    setCurrentStep((s) => Math.min(s + 1, 3))
  }

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0))
  }

  const handleConfirm = async () => {
    if (!parsedData || !selectedProject || filteredAllocation.length === 0) return

    setImportStatus("loading")
    setImportError(undefined)

    try {
      // Transform rows using column mappings
      const leads = parsedData.rows.map((row) => {
        const lead: Record<string, string | undefined> = {}

        parsedData.headers.forEach((header, idx) => {
          const mapping = columnMappings[header]
          if (mapping && mapping !== "skip") {
            lead[mapping] = row[idx]?.trim() || undefined
          }
        })

        return {
          name: lead.name ?? "Unknown",
          mobileNumber: lead.mobileNumber ?? "",
          email: lead.email,
          budget: lead.budget,
          notes: lead.notes,
          source: "99acres" as const,
        }
      })

      // Build allocations array using round-robin
      const sortedAllocation = [...filteredAllocation].sort(
        (a, b) => a.currentLeads - b.currentLeads
      )
      const allocations = leads.map((_, index) => ({
        index,
        assignedTo: sortedAllocation[index % sortedAllocation.length]
          .userId as Id<"users">,
      }))

      await bulkImport({
        leads,
        projectId: selectedProject as Id<"projects">,
        allocations,
      })

      setImportStatus("success")
      toast.success(`Successfully imported ${leads.length} leads`)
    } catch (err) {
      setImportStatus("error")
      setImportError(err instanceof Error ? err.message : "An unexpected error occurred")
      toast.error("Import failed")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-lg font-semibold">Import Leads</h1>
        <p className="text-xs text-muted-foreground">
          Upload a CSV file to import leads in bulk.
        </p>
      </div>

      <StepIndicator currentStep={currentStep} />

      <div className="max-w-3xl mx-auto">
        {/* Step 0: Upload */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <DragDropZone onParsed={handleParsed} />

            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((project) => (
                    <SelectItem key={project._id} value={project._id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                All imported leads will be linked to this project.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Column Mapping */}
        {currentStep === 1 && parsedData && (
          <ColumnMapping
            headers={parsedData.headers}
            sampleRow={parsedData.rows[0]}
            mappings={columnMappings}
            onMappingsChange={setColumnMappings}
          />
        )}

        {/* Step 2: Allocation */}
        {currentStep === 2 && parsedData && (
          <AllocationPreview
            totalLeads={parsedData.rows.length}
            selectedSalespeople={selectedSalespeople}
            onSelectionChange={setSelectedSalespeople}
            allocation={filteredAllocation}
          />
        )}

        {/* Step 3: Confirm */}
        {currentStep === 3 && parsedData && selectedProjectData && (
          <ImportConfirm
            summary={{
              totalLeads: parsedData.rows.length,
              projectName: selectedProjectData.name,
              allocation: filteredAllocation.map((a) => ({
                userName: a.userName,
                newLeads: a.newLeads,
              })),
            }}
            onConfirm={handleConfirm}
            status={importStatus}
            error={importError}
          />
        )}

        {/* Navigation buttons */}
        {importStatus !== "success" && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            {currentStep < 3 && (
              <Button onClick={handleNext} disabled={!canGoNext()}>
                Next
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
