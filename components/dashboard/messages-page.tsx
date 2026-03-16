"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LeadDetailSheet } from "@/components/leads/lead-detail-sheet"
import { TimeDisplay } from "@/components/shared/time-display"
import {
  getMessageStatusStyle,
  getTriggerTypeStyle,
} from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  WhatsappIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons"
import type { Id } from "@/convex/_generated/dataModel"

export function MessagesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [triggerFilter, setTriggerFilter] = useState<string>("")
  const [selectedLeadId, setSelectedLeadId] = useState<Id<"leads"> | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const stats = useQuery(api.messaging.getStats)
  const messages = useQuery(api.messaging.listAll, {
    whatsappStatus: statusFilter || undefined,
    triggerType: triggerFilter || undefined,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-sans font-semibold">Messages</h1>
        <p className="text-xs text-muted-foreground">
          Track all WhatsApp and SMS messages sent to leads
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-xl font-semibold font-mono">{stats?.total ?? 0}</p>
        </div>
        <div className="border p-3">
          <p className="text-xs text-muted-foreground">Sent</p>
          <p className="text-xl font-semibold font-mono text-green-700">
            {stats?.sent ?? 0}
          </p>
        </div>
        <div className="border p-3">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-xl font-semibold font-mono text-yellow-700">
            {stats?.pending ?? 0}
          </p>
        </div>
        <div className="border p-3">
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="text-xl font-semibold font-mono text-red-600">
            {stats?.failed ?? 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={triggerFilter} onValueChange={setTriggerFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="auto_schedule">Auto-scheduled</SelectItem>
            <SelectItem value="auto_suggest">Suggested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Messages table */}
      <div className="border">
        <div className="grid grid-cols-[1fr_100px_90px_90px_80px_100px] gap-2 px-3 py-2 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
          <span>Lead / Message</span>
          <span>Phone</span>
          <span>WhatsApp</span>
          <span>SMS</span>
          <span>Type</span>
          <span>Time</span>
        </div>

        {messages?.length === 0 && (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            No messages found
          </div>
        )}

        {messages?.map((msg) => {
          const waStyle = getMessageStatusStyle(msg.whatsappStatus)
          const smsStyle = getMessageStatusStyle(msg.smsStatus)
          const triggerStyle = getTriggerTypeStyle(msg.triggerType)

          return (
            <button
              key={msg._id}
              onClick={() => {
                setSelectedLeadId(msg.leadId)
                setSheetOpen(true)
              }}
              className="grid grid-cols-[1fr_100px_90px_90px_80px_100px] gap-2 px-3 py-2.5 border-b last:border-b-0 hover:bg-muted/30 transition-colors text-left w-full"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{msg.leadName}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {msg.message}
                </p>
              </div>
              <span className="text-xs text-muted-foreground font-mono self-center">
                {msg.leadPhone}
              </span>
              <div className="self-center flex items-center gap-1">
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
              <div className="self-center flex items-center gap-1">
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
              <div className="self-center">
                <Badge
                  className={`text-[9px] ${triggerStyle.bg} ${triggerStyle.text} ${triggerStyle.border}`}
                  variant="outline"
                >
                  {triggerStyle.label}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground self-center">
                <TimeDisplay
                  timestamp={msg.sentAt ?? msg.createdAt}
                  mode="relative"
                />
              </span>
            </button>
          )
        })}
      </div>

      <LeadDetailSheet
        leadId={selectedLeadId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
