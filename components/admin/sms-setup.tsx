"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  SmartPhone01Icon,
  Loading03Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export function SmsSetup() {
  const smsDevice = useQuery(api.whatsappSessions.getSmsDevice)
  const createDevice = useMutation(api.whatsappSessions.createSmsDevice)
  const deleteDevice = useMutation(api.whatsappSessions.deleteSmsDevice)
  const fetchQr = useAction(api.whatsappSessions.fetchSmsQr)
  const checkHealth = useAction(api.whatsappSessions.checkSmsHealth)

  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [setting, setSetting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Poll health every 30s when a device exists to keep status in sync
  useEffect(() => {
    if (!smsDevice || !smsDevice.bridgeDeviceId) return
    // Run once immediately
    checkHealth().catch(() => {})
    const interval = setInterval(() => {
      checkHealth().catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [smsDevice?._id, smsDevice?.bridgeDeviceId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleSetup = async () => {
    setSetting(true)
    try {
      await createDevice()
      // Wait for action to create the device
      setTimeout(async () => {
        setQrDialogOpen(true)
        const result = await fetchQr()
        if (!result.error) {
          setQrImage(result.qr ?? null)
        }
        setSetting(false)

        // Poll health
        pollRef.current = setInterval(async () => {
          const health = await checkHealth()
          if (health.device === "online") {
            toast("SMS device connected!")
            setQrDialogOpen(false)
            setQrImage(null)
            if (pollRef.current) clearInterval(pollRef.current)
          }
        }, 5000)
      }, 2000)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create SMS device"
      )
      setSetting(false)
    }
  }

  const handleDelete = async () => {
    if (!smsDevice) return
    try {
      await deleteDevice({ deviceId: smsDevice._id })
      toast("SMS device removed")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove device"
      )
    }
  }

  if (smsDevice === undefined) return null

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium">SMS Device</h3>
        <p className="text-xs text-muted-foreground">
          One shared SMS device for the entire CRM. All salespeople send SMS
          through this device.
        </p>
      </div>

      {smsDevice ? (
        <div className="border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 flex items-center justify-center ${
                smsDevice.status === "online" ? "bg-green-50" : "bg-gray-100"
              }`}
            >
              <HugeiconsIcon
                icon={SmartPhone01Icon}
                strokeWidth={2}
                className={`size-5 ${
                  smsDevice.status === "online"
                    ? "text-green-700"
                    : "text-gray-500"
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-medium">
                SMS Device{" "}
                <span
                  className={`text-xs ${
                    smsDevice.status === "online"
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
                >
                  ({smsDevice.status})
                </span>
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {smsDevice.phone ?? (smsDevice.bridgeDeviceId || "Pending setup")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive"
          >
            <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
            Remove
          </Button>
        </div>
      ) : (
        <Button onClick={handleSetup} disabled={setting}>
          {setting ? (
            <>
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className="animate-spin"
              />
              Setting up...
            </>
          ) : (
            <>
              <HugeiconsIcon icon={SmartPhone01Icon} strokeWidth={2} />
              Set Up SMS Device
            </>
          )}
        </Button>
      )}

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>SMS Device Setup</DialogTitle>
            <DialogDescription>
              Scan this QR code with your Android phone to install the Bridge SMS
              app and link it to the CRM.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {qrImage ? (
              <img src={qrImage} alt="SMS Setup QR" className="w-64 h-64" />
            ) : (
              <div className="w-64 h-64 bg-muted flex items-center justify-center">
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-8 animate-spin text-muted-foreground"
                />
              </div>
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            Waiting for device to come online...
          </p>
        </DialogContent>
      </Dialog>
    </div>
  )
}
