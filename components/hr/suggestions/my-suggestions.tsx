"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { getSuggestionStatusStyle } from "@/lib/constants"
import { getRelativeTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { Idea01Icon } from "@hugeicons/core-free-icons"

export function MySuggestions() {
  const suggestions = useQuery(api.suggestions.listByUser)

  if (suggestions === undefined) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div>
        <EmptyState
          icon={Idea01Icon}
          title="No suggestions submitted"
          description="Have an idea to improve the workplace? Share it above — anonymously if you prefer."
        />
        <p className="text-xs text-muted-foreground text-center mt-2">
          Anonymous suggestions are not shown here for your privacy.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => {
        const statusStyle = getSuggestionStatusStyle(suggestion.status)
        return (
          <Card key={suggestion._id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  {suggestion.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {suggestion.category.charAt(0).toUpperCase() + suggestion.category.slice(1)}
                    </Badge>
                  )}
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-4 border",
                      statusStyle.bg,
                      statusStyle.text,
                      statusStyle.border
                    )}
                  >
                    {statusStyle.label}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {getRelativeTime(suggestion.createdAt)}
                </span>
              </div>
              <p className="text-sm line-clamp-2">{suggestion.content}</p>
              {suggestion.reviewNote && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  HR Note: {suggestion.reviewNote}
                </p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
