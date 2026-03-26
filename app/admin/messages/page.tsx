import { WhatsAppConnectCard } from "@/components/dashboard/whatsapp-connect"
import { MessagesPage } from "@/components/dashboard/messages-page"

export default function AdminMessagesPage() {
  return (
    <div className="space-y-6">
      <WhatsAppConnectCard />
      <MessagesPage />
    </div>
  )
}
