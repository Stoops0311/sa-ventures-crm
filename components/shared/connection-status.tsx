"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function ConnectionStatus() {
  const [status, setStatus] = useState<"connected" | "reconnecting" | "hidden">("hidden")

  useEffect(() => {
    // Convex client doesn't expose a direct connection status event API,
    // so we use a simple visibility-based approach
    function handleOnline() {
      setStatus("connected")
      setTimeout(() => setStatus("hidden"), 3000)
    }

    function handleOffline() {
      setStatus("reconnecting")
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (status === "hidden") return null

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 py-1.5 text-center text-xs font-medium transition-all",
        status === "reconnecting" && "bg-yellow-100 text-yellow-800",
        status === "connected" && "bg-green-100 text-green-800"
      )}
    >
      {status === "reconnecting" ? "Reconnecting..." : "Connected"}
    </div>
  )
}
