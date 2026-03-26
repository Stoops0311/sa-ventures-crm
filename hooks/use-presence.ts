"use client"

import { useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

interface UsePresenceOptions {
  paused?: boolean
}

export function usePresence(options?: UsePresenceOptions) {
  const heartbeat = useMutation(api.presence.heartbeat)
  const paused = options?.paused ?? false

  useEffect(() => {
    if (paused) return

    // Send initial heartbeat
    heartbeat()

    // Send heartbeat every 30 seconds
    const interval = setInterval(() => heartbeat(), 30_000)

    return () => clearInterval(interval)
  }, [heartbeat, paused])
}
