"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface ImportSummary {
  totalLeads: number
  projectName: string
  allocation: Array<{
    userName: string
    newLeads: number
  }>
}

interface ImportConfirmProps {
  summary: ImportSummary
  onConfirm: () => void
  status: "idle" | "loading" | "success" | "error"
  error?: string
}

export function ImportConfirm({
  summary,
  onConfirm,
  status,
  error,
}: ImportConfirmProps) {
  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="flex size-16 items-center justify-center bg-green-50 text-green-600">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-10" strokeWidth={1.5} />
        </div>
        <h3 className="font-sans text-lg font-semibold">
          Successfully imported {summary.totalLeads} leads
        </h3>
        <p className="text-xs text-muted-foreground">
          All leads have been created and assigned to salespeople.
        </p>
        <Button asChild className="mt-2">
          <Link href="/admin/leads">Go to Leads</Link>
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans">Import Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Total Leads</p>
            <p className="text-lg font-sans font-bold">{summary.totalLeads}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Project</p>
            <p className="text-lg font-sans font-bold">{summary.projectName}</p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="text-xs text-muted-foreground mb-2">Allocation Breakdown</p>
          <div className="space-y-1.5">
            {summary.allocation.map((entry) => (
              <div
                key={entry.userName}
                className="flex items-center justify-between text-xs py-1 px-2 bg-muted/50"
              >
                <span>{entry.userName}</span>
                <span className="font-medium text-primary">
                  +{entry.newLeads} lead{entry.newLeads !== 1 ? "s" : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={onConfirm}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
              Importing...
            </>
          ) : status === "error" ? (
            "Retry Import"
          ) : (
            `Import ${summary.totalLeads} Leads`
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
