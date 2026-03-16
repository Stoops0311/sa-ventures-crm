"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { TimeDisplay } from "@/components/shared/time-display"
import { getMessageStatusStyle, getTriggerTypeStyle } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { WhatsappIcon, SmartPhone01Icon } from "@hugeicons/core-free-icons"

interface MessageHistoryProps {
  leadId: string
}

export function MessageHistory({ leadId }: MessageHistoryProps) {
  const typedLeadId = leadId as Id<"leads">
  const messages = useQuery(api.messaging.listByLead, {
    leadId: typedLeadId,
  })

  if (!messages || messages.length === 0) return null

  return (
    <div className="px-4 py-4 border-t space-y-3">
      <h3 className="text-sm font-sans font-medium">Messages</h3>

      <div className="space-y-2">
        {messages.map((msg) => {
          const waStyle = getMessageStatusStyle(msg.whatsappStatus)
          const smsStyle = getMessageStatusStyle(msg.smsStatus)
          const triggerStyle = getTriggerTypeStyle(msg.triggerType)

          return (
            <div
              key={msg._id}
              className="border p-2.5 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Badge
                    className={`text-[10px] ${triggerStyle.bg} ${triggerStyle.text} ${triggerStyle.border}`}
                    variant="outline"
                  >
                    {triggerStyle.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {msg.language === "hi" ? "HI" : "EN"}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  <TimeDisplay
                    timestamp={msg.sentAt ?? msg.createdAt}
                    mode="relative"
                  />
                </span>
              </div>

              <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                {msg.message}
              </p>

              <div className="flex items-center gap-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <HugeiconsIcon
                    icon={WhatsappIcon}
                    strokeWidth={2}
                    className="size-3"
                  />
                  <Badge
                    className={`text-[9px] px-1 py-0 ${waStyle.bg} ${waStyle.text} ${waStyle.border}`}
                    variant="outline"
                  >
                    {waStyle.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <HugeiconsIcon
                    icon={SmartPhone01Icon}
                    strokeWidth={2}
                    className="size-3"
                  />
                  <Badge
                    className={`text-[9px] px-1 py-0 ${smsStyle.bg} ${smsStyle.text} ${smsStyle.border}`}
                    variant="outline"
                  >
                    {smsStyle.label}
                  </Badge>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
