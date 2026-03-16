"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { cn } from "@/lib/utils"

interface AllocationPreviewProps {
  totalLeads: number
  selectedSalespeople: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  allocation: Array<{
    userId: Id<"users">
    userName: string
    currentLeads: number
    newLeads: number
    totalAfter: number
  }>
}

export function AllocationPreview({
  totalLeads,
  selectedSalespeople,
  onSelectionChange,
  allocation,
}: AllocationPreviewProps) {
  const salespeople = useQuery(api.users.getAvailableSalespeople)

  if (salespeople === undefined) {
    return <TableSkeleton cols={3} />
  }

  function toggleSalesperson(id: string) {
    const next = new Set(selectedSalespeople)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange(next)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left panel: Salesperson selection */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Select Salespeople</CardTitle>
        </CardHeader>
        <CardContent>
          {salespeople.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No available salespeople found. Make sure at least one salesperson is marked as available.
            </p>
          ) : (
            <div className="space-y-3">
              {salespeople.map((sp) => (
                <div key={sp._id} className="flex items-center gap-3">
                  <Checkbox
                    id={`sp-${sp._id}`}
                    checked={selectedSalespeople.has(sp._id)}
                    onCheckedChange={() => toggleSalesperson(sp._id)}
                  />
                  <Label
                    htmlFor={`sp-${sp._id}`}
                    className="flex flex-1 items-center justify-between cursor-pointer"
                  >
                    <span>{sp.name}</span>
                    <span className="text-xs text-muted-foreground">
                      current leads: loading...
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right panel: Allocation preview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans">Allocation Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {allocation.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Select salespeople to see allocation preview.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {totalLeads} lead{totalLeads !== 1 ? "s" : ""} will be distributed via round-robin:
              </p>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salesperson</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">New</TableHead>
                      <TableHead className="text-right">Total After</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocation.map((entry) => (
                      <TableRow key={entry.userId}>
                        <TableCell className="font-medium">{entry.userName}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {entry.currentLeads}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            entry.newLeads > 0 && "text-primary"
                          )}
                        >
                          +{entry.newLeads}
                        </TableCell>
                        <TableCell className="text-right">{entry.totalAfter}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
