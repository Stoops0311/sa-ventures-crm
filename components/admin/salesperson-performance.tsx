"use client"

import { useQuery } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PresenceDot } from "@/components/shared/presence-dot"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function SalespersonPerformance() {
  const data = useQuery(api.stats.salespersonPerformance)
  const router = useRouter()

  if (data === undefined || data === null) {
    return (
      <div>
        <h2 className="font-sans text-sm font-medium mb-3">
          Team Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Sort by follow-ups overdue desc (problem-first)
  const sorted = [...data].sort(
    (a, b) => b.followUpsDue - a.followUpsDue
  )

  return (
    <div>
      <h2 className="font-sans text-sm font-medium mb-3">Team Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((sp) => {
          const contactedRatio =
            sp.assigned > 0
              ? Math.round((sp.contacted / sp.assigned) * 100)
              : 0

          return (
            <Card
              key={sp.userId}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() =>
                router.push(`/admin/leads?assignedTo=${sp.userId}`)
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-8 items-center justify-center bg-muted text-xs font-medium font-sans">
                    {sp.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium truncate flex-1">
                    {sp.userName}
                  </span>
                  <PresenceDot
                    isOnline={sp.isOnline}
                    lastSeen={sp.lastSeen}
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-4 gap-1 text-center mb-3">
                  <div>
                    <p className="font-sans text-sm font-bold tabular-nums">
                      {sp.assigned}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Assigned
                    </p>
                  </div>
                  <div>
                    <p className="font-sans text-sm font-bold tabular-nums">
                      {sp.contacted}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Contacted
                    </p>
                  </div>
                  <div>
                    <p
                      className={cn(
                        "font-sans text-sm font-bold tabular-nums",
                        sp.followUpsDue > 0 && "text-destructive"
                      )}
                    >
                      {sp.followUpsDue}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Due</p>
                  </div>
                  <div>
                    <p className="font-sans text-sm font-bold tabular-nums">
                      {sp.conversions}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Conversions
                    </p>
                  </div>
                </div>

                <div className="h-1.5 w-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${contactedRatio}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {contactedRatio}% contacted
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
