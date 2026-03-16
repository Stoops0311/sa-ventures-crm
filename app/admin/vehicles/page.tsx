"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FleetTable } from "@/components/vehicle/fleet-table"
import { TripsTable } from "@/components/vehicle/trips-table"
import { VehicleStatCards } from "@/components/vehicle/dashboard/stat-cards-row"

export default function AdminVehiclesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">Vehicle Management</h1>

      <VehicleStatCards />

      <Tabs defaultValue="fleet">
        <TabsList>
          <TabsTrigger value="fleet">Fleet</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
        </TabsList>
        <TabsContent value="fleet" className="mt-4">
          <FleetTable />
        </TabsContent>
        <TabsContent value="trips" className="mt-4">
          <TripsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
