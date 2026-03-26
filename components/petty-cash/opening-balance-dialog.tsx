"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export function OpeningBalanceDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [saving, setSaving] = useState(false)

  const settings = useQuery(api.pettyCash.getSettings)
  const updateSettings = useMutation(api.pettyCash.updateSettings)

  useEffect(() => {
    if (settings && open) {
      setAmount(settings.openingBalance.toString())
    }
  }, [settings, open])

  const handleSave = async () => {
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error("Please enter a valid amount")
      return
    }

    setSaving(true)
    try {
      await updateSettings({ openingBalance: amountNum })
      toast.success("Opening balance updated")
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Opening Balance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Set the starting cash amount. The running balance is calculated as:
            Opening Balance + Returned - Given.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Amount (Rs)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="animate-spin"
                />
              )}
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
