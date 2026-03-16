"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { SentIcon, Cancel01Icon, WhatsappIcon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface AutoSuggestBannerProps {
  leadId: string
}

export function AutoSuggestBanner({ leadId }: AutoSuggestBannerProps) {
  const typedLeadId = leadId as Id<"leads">
  const suggestions = useQuery(api.messaging.getPendingSuggestions, {
    leadId: typedLeadId,
  })
  const confirmSuggested = useMutation(api.messaging.confirmSuggested)
  const cancelMessage = useMutation(api.messaging.cancel)

  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (!suggestions || suggestions.length === 0) return null

  const handleSend = async (messageId: Id<"scheduledMessages">) => {
    setLoadingId(messageId)
    try {
      await confirmSuggested({ messageId })
      toast("Message sent")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send"
      )
    } finally {
      setLoadingId(null)
    }
  }

  const handleDismiss = async (messageId: Id<"scheduledMessages">) => {
    setLoadingId(messageId)
    try {
      await cancelMessage({ messageId })
      toast("Suggestion dismissed")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to dismiss"
      )
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-2">
      {suggestions.map((suggestion) => (
        <div
          key={suggestion._id}
          className="mx-4 mt-3 border border-indigo-200 bg-indigo-50 p-3 space-y-2"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-700">
              <HugeiconsIcon
                icon={WhatsappIcon}
                strokeWidth={2}
                className="size-3.5"
              />
              Suggested Message
            </div>
          </div>

          <p className="text-xs text-indigo-900 leading-relaxed line-clamp-3">
            {suggestion.message}
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleSend(suggestion._id)}
              disabled={loadingId === suggestion._id}
              className="h-7 text-xs"
            >
              <HugeiconsIcon icon={SentIcon} strokeWidth={2} />
              Send Now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDismiss(suggestion._id)}
              disabled={loadingId === suggestion._id}
              className="h-7 text-xs text-muted-foreground"
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
