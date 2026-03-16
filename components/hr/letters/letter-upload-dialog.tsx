"use client"

import { useState, useRef } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileUploadIcon, File01Icon } from "@hugeicons/core-free-icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface LetterUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultUserId?: Id<"users">
  defaultUserName?: string
}

export function LetterUploadDialog({
  open,
  onOpenChange,
  defaultUserId,
  defaultUserName,
}: LetterUploadDialogProps) {
  const employees = useQuery(api.employeeProfiles.listAll, open ? {} : "skip")
  const generateUploadUrl = useMutation(api.employeeLetters.generateUploadUrl)
  const createLetter = useMutation(api.employeeLetters.create)

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    defaultUserId ?? ""
  )
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedEmployee = employees?.find(
    (e) => e.userId === selectedEmployeeId
  )

  const isPreSelected = !!defaultUserId

  function handleFileSelect(f: File | null) {
    setFileError(null)
    if (!f) {
      setFile(null)
      return
    }
    if (f.type !== "application/pdf") {
      setFileError("Only PDF files are accepted")
      return
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError("File is too large. Maximum size is 10MB.")
      return
    }
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function resetForm() {
    if (!isPreSelected) setSelectedEmployeeId("")
    setTitle("")
    setFile(null)
    setFileError(null)
  }

  async function handleUpload() {
    if (!selectedEmployeeId || !title.trim() || !file) return
    setUploading(true)

    try {
      // 1. Get upload URL
      const uploadUrl = await generateUploadUrl()

      // 2. Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { storageId } = (await response.json()) as { storageId: string }

      // 3. Create letter record
      await createLetter({
        userId: selectedEmployeeId as Id<"users">,
        title: title.trim(),
        storageId: storageId as Id<"_storage">,
        fileName: file.name,
        isGenerated: false,
      })

      const empName =
        defaultUserName ?? selectedEmployee?.user.name ?? "employee"
      toast.success(`Document uploaded for ${empName}`)
      resetForm()
      onOpenChange(false)
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const canUpload = !!selectedEmployeeId && !!title.trim() && !!file && !uploading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans font-semibold">
            {isPreSelected
              ? `Upload Document for ${defaultUserName}`
              : "Upload Document"}
          </DialogTitle>
          <DialogDescription>
            Attach a PDF document to an employee&apos;s profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee selector */}
          {!isPreSelected && (
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Popover
                open={employeeSearchOpen}
                onOpenChange={setEmployeeSearchOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between font-normal"
                    autoFocus
                  >
                    {selectedEmployee ? (
                      <span>{selectedEmployee.user.name}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        Search employee...
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
                          value={`${emp.user.name} ${emp.designation ?? ""}`}
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
                              {emp.designation ?? "—"} ·{" "}
                              {emp.department ?? "—"}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Signed Offer Letter, Reference Check..."
              autoFocus={isPreSelected}
            />
          </div>

          {/* File Upload Zone */}
          <div className="space-y-1.5">
            <Label>Document</Label>
            {file ? (
              <div className="flex items-center gap-3 p-3 border">
                <HugeiconsIcon
                  icon={File01Icon}
                  className="size-6 text-primary shrink-0"
                  strokeWidth={1.5}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  className="text-xs text-destructive hover:underline"
                  onClick={() => setFile(null)}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                className={cn(
                  "flex flex-col items-center justify-center p-6 border-2 border-dashed cursor-pointer transition-colors",
                  fileError
                    ? "border-destructive"
                    : "border-muted-foreground/25 hover:border-primary"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <HugeiconsIcon
                  icon={FileUploadIcon}
                  className="size-8 text-muted-foreground mb-2"
                  strokeWidth={1.5}
                />
                <p className="text-sm text-muted-foreground">
                  Drag and drop a PDF or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 10MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) =>
                    handleFileSelect(e.target.files?.[0] ?? null)
                  }
                />
              </div>
            )}
            {fileError && (
              <p className="text-xs text-destructive">{fileError}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleUpload}
            disabled={!canUpload}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
