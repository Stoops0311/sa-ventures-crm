"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ConnectGpsFormProps {
  vehicleId: Id<"vehicles">
  vehicle: {
    gpsDeviceId?: string
    gpsDeviceName?: string
    gpsProvider?: string
  }
}

export function ConnectGpsForm({ vehicleId, vehicle }: ConnectGpsFormProps) {
  const connectGps = useMutation(api.vehicles.connectGps)
  const disconnectGps = useMutation(api.vehicles.disconnectGps)

  const [deviceId, setDeviceId] = useState(vehicle.gpsDeviceId ?? "")
  const [deviceName, setDeviceName] = useState(vehicle.gpsDeviceName ?? "")
  const [provider, setProvider] = useState(vehicle.gpsProvider ?? "")
  const [submitting, setSubmitting] = useState(false)

  const isConnected = !!vehicle.gpsDeviceId

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    if (!deviceId) return

    setSubmitting(true)
    try {
      await connectGps({
        id: vehicleId,
        gpsDeviceId: deviceId,
        gpsDeviceName: deviceName || undefined,
        gpsProvider: provider || undefined,
      })
      toast.success("GPS device connected")
    } catch {
      toast.error("Failed to connect GPS device")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDisconnect() {
    setSubmitting(true)
    try {
      await disconnectGps({ id: vehicleId })
      setDeviceId("")
      setDeviceName("")
      setProvider("")
      toast.success("GPS device disconnected")
    } catch {
      toast.error("Failed to disconnect GPS device")
    } finally {
      setSubmitting(false)
    }
  }

  if (isConnected) {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-sm font-medium text-emerald-800">GPS Device Connected</p>
          <div className="mt-2 space-y-1 text-xs text-emerald-700">
            <p><span className="text-emerald-600">Device ID:</span> {vehicle.gpsDeviceId}</p>
            {vehicle.gpsDeviceName && (
              <p><span className="text-emerald-600">Name:</span> {vehicle.gpsDeviceName}</p>
            )}
            {vehicle.gpsProvider && (
              <p><span className="text-emerald-600">Provider:</span> {vehicle.gpsProvider}</p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={submitting}
          className="text-destructive hover:text-destructive"
        >
          Disconnect Device
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleConnect} className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Connect a GPS tracking device to this vehicle. Enter the device credentials provided by your GPS hardware vendor.
      </p>

      <div className="space-y-1.5">
        <Label>Device ID *</Label>
        <Input
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          placeholder="e.g., GPS-2024-001"
          className="font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Device Name</Label>
        <Input
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          placeholder="e.g., Concox GT06N"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Provider / Brand</Label>
        <Input
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="e.g., Concox, Teltonika"
        />
      </div>

      <Button type="submit" disabled={!deviceId || submitting}>
        {submitting ? "Connecting..." : "Connect Device"}
      </Button>
    </form>
  )
}
