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
  WhatsappIcon,
  Wifi01Icon,
  WifiDisconnected01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export function WhatsAppConnectCard() {
  const session = useQuery(api.whatsappSessions.getMySession)
  const createSession = useMutation(api.whatsappSessions.createSession)
  const deleteSession = useMutation(api.whatsappSessions.deleteSession)
  const fetchQr = useAction(api.whatsappSessions.fetchQrCode)
  const pollStatus = useAction(api.whatsappSessions.pollSessionStatus)

  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      await createSession({ name: "My WhatsApp" })
      // Wait briefly for the action to create the bridge session
      setTimeout(() => {
        setQrDialogOpen(true)
      }, 2000)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create session"
      )
      setConnecting(false)
    }
  }

  // When dialog opens and session has a bridgeSessionId, fetch QR and poll
  useEffect(() => {
    if (!qrDialogOpen || !session?.bridgeSessionId) return

    let cancelled = false

    const fetchAndPoll = async () => {
      // Fetch QR
      const result = await fetchQr({
        bridgeSessionId: session.bridgeSessionId,
      })
      if (!cancelled && !result.error) {
        setQrImage(result.qr ?? null)
        setConnecting(false)
      }

      // Start polling
      pollRef.current = setInterval(async () => {
        if (cancelled) return
        const statusResult = await pollStatus({
          bridgeSessionId: session.bridgeSessionId,
          sessionId: session._id,
        })
        if (statusResult.status === "connected") {
          toast("WhatsApp connected!")
          setQrDialogOpen(false)
          setQrImage(null)
          if (pollRef.current) clearInterval(pollRef.current)
        }
      }, 3000)
    }

    fetchAndPoll()

    return () => {
      cancelled = true
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [qrDialogOpen, session?.bridgeSessionId])

  const handleDisconnect = async () => {
    if (!session) return
    setDisconnecting(true)
    try {
      await deleteSession({ sessionId: session._id })
      toast("WhatsApp disconnected")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to disconnect"
      )
    } finally {
      setDisconnecting(false)
    }
  }

  // Loading state
  if (session === undefined) return null

  // Connected state
  if (session?.status === "connected") {
    return (
      <div className="border bg-green-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-green-100 flex items-center justify-center">
            <HugeiconsIcon
              icon={WhatsappIcon}
              strokeWidth={2}
              className="size-5 text-green-700"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">
              WhatsApp Connected
            </p>
            <p className="text-xs text-green-600">
              {session.phone ?? "Connected"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="text-xs"
        >
          {disconnecting ? "Disconnecting..." : "Disconnect"}
        </Button>
      </div>
    )
  }

  // Disconnected state
  if (session?.status === "disconnected") {
    return (
      <div className="border border-yellow-200 bg-yellow-50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-yellow-100 flex items-center justify-center">
            <HugeiconsIcon
              icon={WifiDisconnected01Icon}
              strokeWidth={2}
              className="size-5 text-yellow-700"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              WhatsApp Disconnected
            </p>
            <p className="text-xs text-yellow-600">
              Your session was disconnected. Please reconnect.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs"
          >
            Remove
          </Button>
        </div>
      </div>
    )
  }

  // Not connected — show prominent card
  return (
    <>
      <div className="border border-dashed border-muted-foreground/30 bg-muted/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-background border flex items-center justify-center">
            <HugeiconsIcon
              icon={WhatsappIcon}
              strokeWidth={2}
              className="size-5 text-muted-foreground"
            />
          </div>
          <div>
            <p className="text-sm font-medium">Connect your WhatsApp</p>
            <p className="text-xs text-muted-foreground">
              Link your WhatsApp to start messaging leads directly from the CRM
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleConnect} disabled={connecting}>
          {connecting ? (
            <>
              <HugeiconsIcon
                icon={Loading03Icon}
                strokeWidth={2}
                className="animate-spin"
              />
              Connecting...
            </>
          ) : (
            <>
              <HugeiconsIcon icon={Wifi01Icon} strokeWidth={2} />
              Connect
            </>
          )}
        </Button>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
            <DialogDescription>
              Open WhatsApp on your phone, go to Linked Devices, and scan this
              QR code.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {qrImage ? (
              <img
                src={qrImage}
                alt="WhatsApp QR Code"
                className="w-64 h-64"
              />
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
            Waiting for scan...
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
