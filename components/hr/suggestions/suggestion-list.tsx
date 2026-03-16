"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Idea01Icon } from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { SuggestionReviewForm } from "./suggestion-review-form"
import { getSuggestionStatusStyle } from "@/lib/constants"
import { getRelativeTime } from "@/lib/date-utils"
import { cn } from "@/lib/utils"

export function SuggestionList() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [reviewingId, setReviewingId] = useState<string | null>(null)

  const suggestions = useQuery(api.suggestions.listAll, {
    status: statusFilter === "all" ? undefined : statusFilter,
    category: categoryFilter === "all" ? undefined : categoryFilter,
  })

  if (suggestions === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Suggestion count */}
      {suggestions.length > 0 && (
        <p className="font-sans text-lg">
          {suggestions.length} suggestion{suggestions.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="implemented">Implemented</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="workplace">Workplace</SelectItem>
            <SelectItem value="policy">Policy</SelectItem>
            <SelectItem value="process">Process</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Suggestion Cards */}
      {suggestions.length === 0 ? (
        <EmptyState
          icon={Idea01Icon}
          title="No suggestions yet"
          description="When employees submit suggestions, they will appear here."
        />
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const statusStyle = getSuggestionStatusStyle(suggestion.status)
            const isReviewing = reviewingId === suggestion._id

            return (
              <Card
                key={suggestion._id}
                className={cn(
                  "transition-colors duration-200",
                  suggestion.isAnonymous && "border-l-2 border-l-gray-300",
                  suggestion.status === "implemented" && "border-l-2 border-l-green-500",
                  isReviewing && "border-primary/30"
                )}
              >
                <CardContent className="p-4">
                  {/* Header row */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {suggestion.isAnonymous ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-gray-100 text-gray-600 border-gray-200"
                        >
                          Anonymous
                        </Badge>
                      ) : (
                        <span className="font-medium text-sm">
                          {suggestion.submitterName}
                        </span>
                      )}
                      {suggestion.category && (
                        <Badge variant="outline" className="text-[10px]">
                          {suggestion.category.charAt(0).toUpperCase() + suggestion.category.slice(1)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
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
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(suggestion.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <SuggestionContent content={suggestion.content} />

                  {/* Review note if exists */}
                  {suggestion.reviewNote && !isReviewing && (
                    <p className="text-xs text-muted-foreground italic mt-2">
                      HR Note: {suggestion.reviewNote}
                    </p>
                  )}

                  {/* Footer / Actions */}
                  {isReviewing ? (
                    <div className="mt-3 animate-in fade-in slide-in-from-bottom-1 duration-200">
                      <SuggestionReviewForm
                        suggestionId={suggestion._id}
                        currentStatus={suggestion.status}
                        onCancel={() => setReviewingId(null)}
                        onSaved={() => setReviewingId(null)}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReviewingId(suggestion._id)}
                      >
                        Review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SuggestionContent({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false)
  const lines = content.split("\n")
  const isLong = lines.length > 6 || content.length > 500

  if (!isLong || expanded) {
    return (
      <div>
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        {isLong && (
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-xs"
            onClick={() => setExpanded(false)}
          >
            Show less
          </Button>
        )}
      </div>
    )
  }

  const truncated = content.slice(0, 500) + "..."

  return (
    <div>
      <p className="text-sm whitespace-pre-wrap">{truncated}</p>
      <Button
        variant="link"
        size="sm"
        className="p-0 h-auto text-xs"
        onClick={() => setExpanded(true)}
      >
        Read more
      </Button>
    </div>
  )
}
