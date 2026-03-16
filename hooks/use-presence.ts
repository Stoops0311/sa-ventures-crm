"use client"

import { useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export function usePresence() {
  const heartbeat = useMutation(api.presence.heartbeat)

  useEffect(() => {
    // Send initial heartbeat
    heartbeat()

    // Send heartbeat every 30 seconds
    const interval = setInterval(() => heartbeat(), 30_000)

    return () => clearInterval(interval)
  }, [heartbeat])
}
