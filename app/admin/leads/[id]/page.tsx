"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { LeadDetailContent } from "@/components/leads/lead-detail-content"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"

export default function AdminLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin/leads")}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          Back to Leads
        </Button>
      </div>
      <div className="flex-1 max-w-3xl mx-auto w-full">
        <LeadDetailContent leadId={id} />
      </div>
    </div>
  )
}
