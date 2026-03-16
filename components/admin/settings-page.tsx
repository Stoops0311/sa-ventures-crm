"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WhatsAppSessionsOverview } from "@/components/admin/whatsapp-sessions-overview"
import { SmsSetup } from "@/components/admin/sms-setup"
import { MessageTemplatesManager } from "@/components/admin/message-templates-manager"

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-sans font-semibold">Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage WhatsApp sessions, SMS device, and message templates
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="whatsapp">WhatsApp Sessions</TabsTrigger>
          <TabsTrigger value="sms">SMS Device</TabsTrigger>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp">
          <WhatsAppSessionsOverview />
        </TabsContent>

        <TabsContent value="sms">
          <SmsSetup />
        </TabsContent>

        <TabsContent value="templates">
          <MessageTemplatesManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
