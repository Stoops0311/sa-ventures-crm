"use client"

import { useCallback, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileUploadIcon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Papa from "papaparse"

interface DragDropZoneProps {
  onParsed: (data: { headers: string[]; rows: string[][] }) => void
}

export function DragDropZone({ onParsed }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [rowCount, setRowCount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      setError(null)

      if (!file.name.endsWith(".csv")) {
        setError("Please upload a CSV file.")
        return
      }

      Papa.parse(file, {
        complete: (results) => {
          const allRows = results.data as string[][]
          if (allRows.length < 2) {
            setError("CSV file must contain at least a header row and one data row.")
            return
          }

          const headers = allRows[0]
          const rows = allRows.slice(1).filter((row) => row.some((cell) => cell.trim() !== ""))

          if (rows.length === 0) {
            setError("CSV file contains no data rows.")
            return
          }

          setFileName(file.name)
          setRowCount(rows.length)
          onParsed({ headers, rows })
        },
        error: () => {
          setError("Failed to parse CSV file. Please check the format.")
        },
      })
    },
    [onParsed]
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
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 border-2 border-dashed p-12 transition-colors",
        isDragging && "border-primary bg-primary/5",
        !isDragging && "border-muted-foreground/25"
      )}
    >
      <HugeiconsIcon
        icon={FileUploadIcon}
        className="size-12 text-muted-foreground/50"
        strokeWidth={1.5}
      />

      {fileName ? (
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-medium">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            {rowCount} row{rowCount !== 1 ? "s" : ""} found
          </p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleBrowse}>
            Choose Different File
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Drag & drop your CSV file here
          </p>
          <p className="text-xs text-muted-foreground">or</p>
          <Button variant="outline" size="sm" onClick={handleBrowse}>
            Browse Files
          </Button>
        </>
      )}

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}
