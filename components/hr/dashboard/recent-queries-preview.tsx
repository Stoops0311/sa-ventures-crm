"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getHrQueryTypeLabel } from "@/lib/constants"
import { getRelativeTime } from "@/lib/date-utils"

export function RecentQueriesPreview() {
  const queries = useQuery(api.hrQueries.listAll, { status: "open" })

  const recent = queries?.slice(0, 5)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-semibold">Recent Queries</CardTitle>
        <Link
          href="/hr/queries"
          className="text-xs text-primary hover:underline"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent>
        {queries === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !recent || recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No open queries. All clear.
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((q) => {
              return (
                <Link
                  key={q._id}
                  href="/hr/queries"
                  className="flex items-center gap-3 py-2 px-2 hover:bg-muted/50 transition-colors -mx-2"
                >
                  <div className="size-6 shrink-0 border bg-muted flex items-center justify-center text-[10px] font-medium overflow-hidden">
                    {q.employeeImageUrl ? (
                      <img src={q.employeeImageUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <span>{q.employeeName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{q.employeeName}</span>
                      <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                        {getHrQueryTypeLabel(q.type)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {q.subject}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {getRelativeTime(q.createdAt)}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
