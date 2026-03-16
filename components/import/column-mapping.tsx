"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const MAPPING_OPTIONS = [
  { value: "name", label: "Name", required: true },
  { value: "mobileNumber", label: "Mobile Number", required: true },
  { value: "email", label: "Email", required: false },
  { value: "budget", label: "Budget", required: false },
  { value: "notes", label: "Notes", required: false },
  { value: "skip", label: "Skip", required: false },
] as const

// Auto-detect mappings for common 99acres CSV headers
const AUTO_DETECT_MAP: Record<string, string> = {
  name: "name",
  "customer name": "name",
  "contact name": "name",
  mobile: "mobileNumber",
  "mobile number": "mobileNumber",
  phone: "mobileNumber",
  "phone number": "mobileNumber",
  "contact number": "mobileNumber",
  email: "email",
  "email id": "email",
  "email address": "email",
  budget: "budget",
  "budget range": "budget",
  "price range": "budget",
  notes: "notes",
  remarks: "notes",
  comment: "notes",
  comments: "notes",
}

export function autoDetectMappings(headers: string[]): Record<string, string> {
  const mappings: Record<string, string> = {}
  const used = new Set<string>()

  for (const header of headers) {
    const normalized = header.toLowerCase().trim()
    const mapping = AUTO_DETECT_MAP[normalized]
    if (mapping && !used.has(mapping)) {
      mappings[header] = mapping
      used.add(mapping)
    } else {
      mappings[header] = "skip"
    }
  }

  return mappings
}

export function validateMappings(mappings: Record<string, string>): string | null {
  const values = Object.values(mappings)
  if (!values.includes("name")) {
    return "Name column must be mapped."
  }
  if (!values.includes("mobileNumber")) {
    return "Mobile Number column must be mapped."
  }
  return null
}

interface ColumnMappingProps {
  headers: string[]
  sampleRow: string[]
  mappings: Record<string, string>
  onMappingsChange: (mappings: Record<string, string>) => void
}

export function ColumnMapping({
  headers,
  sampleRow,
  mappings,
  onMappingsChange,
}: ColumnMappingProps) {
  const mappedValues = Object.values(mappings)
  const nameIsMapped = mappedValues.includes("name")
  const mobileIsMapped = mappedValues.includes("mobileNumber")

  function handleChange(header: string, value: string) {
    const next = { ...mappings, [header]: value }
    onMappingsChange(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={cn(
            nameIsMapped
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-600 border-red-200"
          )}
        >
          Name {nameIsMapped ? "mapped" : "required"}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            mobileIsMapped
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-600 border-red-200"
          )}
        >
          Mobile {mobileIsMapped ? "mapped" : "required"}
        </Badge>
      </div>

      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CSV Column</TableHead>
              <TableHead>Sample Data</TableHead>
              <TableHead>Maps To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.map((header, index) => {
              const currentMapping = mappings[header] ?? "skip"

              // Determine which options are available (prevent duplicates except skip)
              const usedMappings = new Set(
                Object.entries(mappings)
                  .filter(([h]) => h !== header)
                  .map(([, v]) => v)
                  .filter((v) => v !== "skip")
              )

              return (
                <TableRow key={header}>
                  <TableCell className="font-medium">{header}</TableCell>
                  <TableCell className="text-muted-foreground max-w-48 truncate">
                    {sampleRow[index] ?? "--"}
                  </TableCell>
                  <TableCell>
                    <Select value={currentMapping} onValueChange={(v) => handleChange(header, v)}>
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MAPPING_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            disabled={opt.value !== "skip" && usedMappings.has(opt.value)}
                          >
                            {opt.label}
                            {opt.required && " *"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
