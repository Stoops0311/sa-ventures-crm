"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import { File01Icon, Cancel01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  resolveAutoPlaceholders,
  hasUnfilledPlaceholders,
} from "@/lib/placeholder-utils"
import { MANUAL_PLACEHOLDERS } from "@/convex/lib/constants"
import type { LetterTemplateType } from "@/convex/lib/constants"
import { PlaceholderPreview } from "./placeholder-preview"

type GenerationState = "idle" | "generating" | "success" | "error"

export function LetterGenerator() {
  const searchParams = useSearchParams()
  const preSelectedEmployee = searchParams.get("employee") as Id<"users"> | null

  // Queries
  const activeTemplates = useQuery(api.letterTemplates.listActive)
  const employees = useQuery(api.employeeProfiles.listAll, {})

  // Mutations / Actions
  const generatePdf = useAction(api.employeeLetters.generatePdf)
  const createLetter = useMutation(api.employeeLetters.create)

  // State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    preSelectedEmployee ?? ""
  )
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false)
  const [content, setContent] = useState("")
  const [genState, setGenState] = useState<GenerationState>("idle")
  const [generatedLetterId, setGeneratedLetterId] = useState<Id<"employeeLetters"> | null>(null)

  // Derived
  const selectedTemplate = useMemo(
    () => activeTemplates?.find((t) => t._id === selectedTemplateId),
    [activeTemplates, selectedTemplateId]
  )

  const selectedEmployee = useMemo(
    () => employees?.find((e) => e.userId === selectedEmployeeId),
    [employees, selectedEmployeeId]
  )

  const bothSelected = !!selectedTemplate && !!selectedEmployee

  // Auto-fill placeholders when both are selected
  useEffect(() => {
    if (!selectedTemplate || !selectedEmployee) return

    const resolved = resolveAutoPlaceholders(
      selectedTemplate.content,
      { name: selectedEmployee.user.name },
      {
        designation: selectedEmployee.designation,
        department: selectedEmployee.department,
        dateOfJoining: selectedEmployee.dateOfJoining,
        panNumber: selectedEmployee.panNumber,
      }
    )
    setContent(resolved)
    setGenState("idle")
    setGeneratedLetterId(null)
  }, [selectedTemplate, selectedEmployee])

  const manualPlaceholders = selectedTemplate
    ? (MANUAL_PLACEHOLDERS[selectedTemplate.type as LetterTemplateType] ?? [])
    : []

  const autoFilledPills = selectedEmployee
    ? [
        { key: "companyName", value: "SA Ventures" },
        { key: "employeeName", value: selectedEmployee.user.name },
        ...(selectedEmployee.designation
          ? [{ key: "designation", value: selectedEmployee.designation }]
          : []),
        ...(selectedEmployee.department
          ? [{ key: "department", value: selectedEmployee.department }]
          : []),
        ...(selectedEmployee.dateOfJoining
          ? [{ key: "dateOfJoining", value: selectedEmployee.dateOfJoining }]
          : []),
      ]
    : []

  const hasUnfilled = hasUnfilledPlaceholders(content)

  const letterTitle = selectedTemplate && selectedEmployee
    ? `${selectedTemplate.name} - ${selectedEmployee.user.name}`
    : ""

  async function handleGenerate() {
    if (!selectedTemplate || !selectedEmployee) return
    setGenState("generating")

    try {
      const result = await generatePdf({
        content,
        title: letterTitle,
      })

      // Create the letter record
      const letterId = await createLetter({
        userId: selectedEmployeeId as Id<"users">,
        title: letterTitle,
        storageId: result.storageId as Id<"_storage">,
        fileName: result.fileName,
        templateType: selectedTemplate.type,
        isGenerated: true,
      })

      setGeneratedLetterId(letterId)
      setGenState("success")

      toast.success(
        `${selectedTemplate.name} for ${selectedEmployee.user.name} generated successfully`
      )
    } catch {
      setGenState("error")
      toast.error("Failed to generate PDF. Please try again.")
    }
  }

  function handleReset() {
    setSelectedTemplateId("")
    setSelectedEmployeeId("")
    setContent("")
    setGenState("idle")
    setGeneratedLetterId(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-lg font-semibold">
          Generate Letter
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Select a template and employee to create a letter
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Template + Employee Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Template Select */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Template
            </label>
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a letter template..." />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates?.map((t) => {
                  const manualCount =
                    MANUAL_PLACEHOLDERS[t.type as LetterTemplateType]?.length ?? 0
                  return (
                    <SelectItem key={t._id} value={t._id}>
                      <div className="flex items-center gap-2">
                        <span>{t.name}</span>
                        {manualCount > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {manualCount} manual field{manualCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Combobox */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide">
              Employee
            </label>
            <Popover
              open={employeeSearchOpen}
              onOpenChange={setEmployeeSearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  {selectedEmployee ? (
                    <span>{selectedEmployee.user.name}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      Search employee by name...
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search employee..." />
                  <CommandList>
                    <CommandEmpty>No employees found</CommandEmpty>
                    {employees?.map((emp) => (
                      <CommandItem
                        key={emp.userId}
                        value={`${emp.user.name} ${emp.designation ?? ""} ${emp.department ?? ""}`}
                        onSelect={() => {
                          setSelectedEmployeeId(emp.userId)
                          setEmployeeSearchOpen(false)
                        }}
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {emp.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {emp.designation ?? "—"} · {emp.department ?? "—"}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Placeholder when not both selected */}
        {!bothSelected && (
          <p className="text-sm text-muted-foreground text-center py-2">
            {selectedEmployeeId && !selectedTemplateId
              ? `Choose a template for ${selectedEmployee?.user.name ?? "this employee"}`
              : "Select a template and employee to preview the letter"}
          </p>
        )}

        {/* Step 2: Preview + Edit */}
        {bothSelected && (
          <div className="border-t pt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Generation header */}
            <p className="font-sans text-sm font-medium">
              Generating{" "}
              <strong>{selectedTemplate.name}</strong> for{" "}
              <strong>{selectedEmployee.user.name}</strong>
            </p>

            {/* Auto-filled pills */}
            <PlaceholderPreview
              autoFilled={autoFilledPills}
              manualPlaceholders={manualPlaceholders}
              content={content}
            />

            {/* Content editor */}
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="font-mono text-sm min-h-[288px] max-h-[576px]"
              rows={12}
            />

            <p className="text-xs text-muted-foreground">
              Review the content above. Auto-filled values can be edited.
              Replace any remaining {"{{placeholders}}"} with the correct
              information.
            </p>

            {/* Step 3: Generate */}
            <div className="flex items-center justify-between border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-4 mr-1" />
                Reset
              </Button>

              <div className="flex items-center gap-2">
                {genState === "success" && generatedLetterId && (
                  <>
                    <DownloadButton letterId={generatedLetterId} />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReset}
                    >
                      Generate Another
                    </Button>
                  </>
                )}
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={hasUnfilled || genState === "generating"}
                  title={
                    hasUnfilled
                      ? "Replace all {{placeholders}} in the letter before generating"
                      : undefined
                  }
                  className={cn(
                    genState === "success" &&
                      "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {genState === "generating" ? (
                    <>
                      <HugeiconsIcon
                        icon={Loading03Icon}
                        className="size-4 mr-1 animate-spin"
                      />
                      Generating...
                    </>
                  ) : genState === "success" ? (
                    "Letter Generated"
                  ) : (
                    <>
                      <HugeiconsIcon
                        icon={File01Icon}
                        className="size-4 mr-1"
                      />
                      Generate PDF
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DownloadButton({ letterId }: { letterId: Id<"employeeLetters"> }) {
  const [downloading, setDownloading] = useState(false)
  const url = useQuery(api.employeeLetters.getDownloadUrl, { letterId })

  function handleDownload() {
    if (!url) return
    setDownloading(true)
    const a = document.createElement("a")
    a.href = url
    a.download = "letter.pdf"
    a.click()
    setTimeout(() => setDownloading(false), 1500)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={downloading || !url}
    >
      {downloading ? "Downloading..." : "Download PDF"}
    </Button>
  )
}
