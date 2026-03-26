"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useBreakTime() {
  const activeBreak = useQuery(api.breakTime.getActiveBreak)
  const startBreakMutation = useMutation(api.breakTime.startBreak)
  const endBreakMutation = useMutation(api.breakTime.endBreak)

  const isOnBreak = !!activeBreak

  const startBreak = async (args: { breakType: string; remarks?: string }) => {
    await startBreakMutation(args)
  }

  const endBreak = async () => {
    await endBreakMutation()
  }

  return {
    isOnBreak,
    activeBreak,
    startBreak,
    endBreak,
  }
}
