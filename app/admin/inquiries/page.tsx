"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InquiriesTable } from "@/components/admin/inquiries/inquiries-table"

export default function AdminInquiriesPage() {
  const [tab, setTab] = useState("all")

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Website Inquiries</h1>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="contacted">Contacted</TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
          <TabsTrigger value="partners">Partners</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <InquiriesTable />
        </TabsContent>
        <TabsContent value="new">
          <InquiriesTable statusFilter="new" />
        </TabsContent>
        <TabsContent value="contacted">
          <InquiriesTable statusFilter="contacted" />
        </TabsContent>
        <TabsContent value="closed">
          <InquiriesTable statusFilter="closed" />
        </TabsContent>
        <TabsContent value="partners">
          <InquiriesTable typeFilter="partner" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
