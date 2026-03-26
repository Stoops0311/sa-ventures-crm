"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function BreakTimeSettings() {
  const settings = useQuery(api.breakTime.getSettings)
  const updateSettings = useMutation(api.breakTime.updateSettings)

  const [threshold, setThreshold] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setThreshold(String(settings.warningThresholdMinutes))
    }
  }, [settings])

  const handleSave = async () => {
    const value = parseInt(threshold, 10)
    if (isNaN(value) || value < 1) {
      toast.error("Please enter a valid number of minutes (minimum 1)")
      return
    }

    setIsSaving(true)
    try {
      await updateSettings({ warningThresholdMinutes: value })
      toast.success("Break time settings updated")
    } catch {
      toast.error("Failed to update settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans text-sm">Break Time Warning Threshold</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Daily break time exceeding this threshold will be flagged in attendance views for admin/HR review.
        </p>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="break-threshold" className="text-xs">
              Threshold (minutes)
            </Label>
            <Input
              id="break-threshold"
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-32"
            />
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || threshold === String(settings?.warningThresholdMinutes)}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Current threshold: {settings?.warningThresholdMinutes ?? 90} minutes
        </p>
      </CardContent>
    </Card>
  )
}
