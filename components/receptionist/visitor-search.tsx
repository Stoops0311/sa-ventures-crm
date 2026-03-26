"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getVisitLocationStyle, getVisitCheckinStyle } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function VisitorSearch() {
  const [searchTerm, setSearchTerm] = useState("")
  const [markingId, setMarkingId] = useState<string | null>(null)

  const results = useQuery(
    api.visits.searchVisitors,
    searchTerm.length >= 2 ? { searchTerm } : "skip"
  )

  const markArrived = useMutation(api.visits.markArrived)

  const handleMarkArrived = async (visitId: string) => {
    setMarkingId(visitId)
    try {
      await markArrived({ visitId: visitId as any })
      toast.success("Visitor checked in")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to check in")
    } finally {
      setMarkingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search visitors by name or phone..."
          className="pl-9"
        />
      </div>

      {searchTerm.length >= 2 && results && results.length > 0 && (
        <div className="space-y-2">
          {results.map((result) => (
            <Card key={result.leadId} className="bg-background">
              <CardContent className="p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{result.leadName}</p>
                  <p className="text-xs text-muted-foreground">
                    {result.leadPhone} &middot; {result.projectName} &middot; {result.salespersonName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {result.activeVisit ? (
                    <>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-5 border",
                          getVisitLocationStyle(result.activeVisit.visitLocation).bg,
                          getVisitLocationStyle(result.activeVisit.visitLocation).text,
                          getVisitLocationStyle(result.activeVisit.visitLocation).border
                        )}
                      >
                        {getVisitLocationStyle(result.activeVisit.visitLocation).label}
                      </Badge>
                      {result.activeVisit.checkinStatus === "expected" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleMarkArrived(result.activeVisit!._id)}
                          disabled={markingId === result.activeVisit._id}
                          className="h-7 text-xs"
                        >
                          {markingId === result.activeVisit._id ? (
                            <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="animate-spin size-3" />
                          ) : (
                            "Mark Arrived"
                          )}
                        </Button>
                      )}
                      {result.activeVisit.checkinStatus !== "expected" && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-5 border",
                            getVisitCheckinStyle(result.activeVisit.checkinStatus).bg,
                            getVisitCheckinStyle(result.activeVisit.checkinStatus).text,
                            getVisitCheckinStyle(result.activeVisit.checkinStatus).border
                          )}
                        >
                          {getVisitCheckinStyle(result.activeVisit.checkinStatus).label}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No visit scheduled</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchTerm.length >= 2 && results && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No results found
        </p>
      )}
    </div>
  )
}
