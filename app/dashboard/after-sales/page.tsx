"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AfterSalesCard } from "@/components/after-sales/after-sales-card"
import { AfterSalesProcessDialog } from "@/components/after-sales/after-sales-process-dialog"

export default function AfterSalesPage() {
  const inProgress = useQuery(api.afterSales.getMyProcesses, {
    status: "in_progress",
  })
  const onHold = useQuery(api.afterSales.getMyProcesses, {
    status: "on_hold",
  })
  const completed = useQuery(api.afterSales.getMyProcesses, {
    status: "completed",
  })
  const stats = useQuery(api.afterSales.getStats)

  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(
    null
  )
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleView = (processId: string) => {
    setSelectedProcessId(processId)
    setDialogOpen(true)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">After Sales</h1>

      {/* Stat cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Active
              </p>
              <p className="text-2xl font-mono font-bold">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                On Hold
              </p>
              <p className="text-2xl font-mono font-bold">{stats.onHold}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Stale (&gt;5d)
              </p>
              <p className="text-2xl font-mono font-bold text-destructive">
                {stats.stale}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Completed
              </p>
              <p className="text-2xl font-mono font-bold text-green-600">
                {stats.completed}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">
            Active
            {inProgress && (
              <Badge variant="secondary" className="ml-1.5">
                {inProgress.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="on_hold">
            On Hold
            {onHold && onHold.length > 0 && (
              <Badge variant="secondary" className="ml-1.5">
                {onHold.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {completed && completed.length > 0 && (
              <Badge variant="secondary" className="ml-1.5">
                {completed.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {inProgress === undefined ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : inProgress.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No active after-sales processes
            </p>
          ) : (
            [...inProgress]
              .sort((a, b) => a.updatedAt - b.updatedAt)
              .map((p) => (
                <AfterSalesCard key={p._id} process={p} onView={handleView} />
              ))
          )}
        </TabsContent>

        <TabsContent value="on_hold" className="space-y-3 mt-4">
          {onHold === undefined ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : onHold.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No processes on hold
            </p>
          ) : (
            onHold.map((p) => (
              <AfterSalesCard key={p._id} process={p} onView={handleView} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {completed === undefined ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : completed.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No completed processes yet
            </p>
          ) : (
            completed.map((p) => (
              <AfterSalesCard key={p._id} process={p} onView={handleView} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <AfterSalesProcessDialog
        processId={selectedProcessId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
