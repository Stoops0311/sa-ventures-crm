"use client"

import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatINR } from "@/lib/currency"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type BreakdownComponent = {
  name: string
  type: string
  amount: number
  order: number
  isCustom: boolean
}

interface PayslipOverrideDialogProps {
  payslipId: Id<"payslips"> | undefined
  employeeName: string
  breakdown: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PayslipOverrideDialog({
  payslipId,
  employeeName,
  breakdown,
  open,
  onOpenChange,
}: PayslipOverrideDialogProps) {
  const overridePayslip = useMutation(api.payroll.overridePayslip)
  const [saving, setSaving] = useState(false)
  const [localComponents, setLocalComponents] = useState<BreakdownComponent[]>([])
  const [originalComponents, setOriginalComponents] = useState<BreakdownComponent[]>([])

  useEffect(() => {
    if (open && breakdown) {
      try {
        const parsed = JSON.parse(breakdown) as { components: BreakdownComponent[] }
        const comps = parsed.components.map((c) => ({ ...c }))
        setOriginalComponents(parsed.components)
        setLocalComponents(comps)
      } catch {
        setOriginalComponents([])
        setLocalComponents([])
      }
    }
  }, [open, breakdown])

  const updateAmount = (name: string, amount: number) => {
    setLocalComponents((prev) =>
      prev.map((c) => (c.name === name ? { ...c, amount } : c))
    )
  }

  const earnings = localComponents.filter((c) => c.type === "earning")
  const deductions = localComponents.filter((c) => c.type === "deduction")
  const gross = earnings.reduce((s, c) => s + c.amount, 0)
  const totalDed = deductions.reduce((s, c) => s + c.amount, 0)
  const net = gross - totalDed

  const hasChanges = localComponents.some((c) => {
    const orig = originalComponents.find((o) => o.name === c.name)
    return orig && orig.amount !== c.amount
  })

  const handleSave = async () => {
    if (!payslipId) return
    const changed = localComponents.filter((c) => {
      const orig = originalComponents.find((o) => o.name === c.name)
      return orig && orig.amount !== c.amount
    })
    if (changed.length === 0) {
      onOpenChange(false)
      return
    }

    setSaving(true)
    try {
      await overridePayslip({
        payslipId,
        overrides: changed.map((c) => ({ name: c.name, amount: Math.round(c.amount) })),
      })
      toast.success(`Override saved for ${employeeName}`)
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save override")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0">
        <DialogHeader className="p-4 pb-3">
          <DialogTitle className="text-sm">{employeeName}</DialogTitle>
          <DialogDescription>Override salary component amounts for this payslip.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] border-t">
          <div className="p-4 space-y-4">
            {/* Earnings */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">
                Earnings
              </p>
              <div className="space-y-1.5">
                {earnings.map((c) => {
                  const orig = originalComponents.find((o) => o.name === c.name)
                  const changed = orig && orig.amount !== c.amount
                  return (
                    <div key={c.name} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-mono truncate flex-1">{c.name}</span>
                      <Input
                        type="number"
                        min={0}
                        value={c.amount || ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseFloat(e.target.value)
                          if (!isNaN(val) && val >= 0) updateAmount(c.name, val)
                        }}
                        className={cn(
                          "w-32 h-8 text-right font-mono tabular-nums text-xs",
                          changed && "border-l-2 border-l-amber-400"
                        )}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Deductions */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">
                Deductions
              </p>
              <div className="space-y-1.5">
                {deductions.map((c) => {
                  const orig = originalComponents.find((o) => o.name === c.name)
                  const changed = orig && orig.amount !== c.amount
                  return (
                    <div key={c.name} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-mono truncate flex-1">{c.name}</span>
                      <Input
                        type="number"
                        min={0}
                        value={c.amount || ""}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : parseFloat(e.target.value)
                          if (!isNaN(val) && val >= 0) updateAmount(c.name, val)
                        }}
                        className={cn(
                          "w-32 h-8 text-right font-mono tabular-nums text-xs",
                          changed && "border-l-2 border-l-amber-400"
                        )}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Summary */}
        <div className="border-t px-4 py-3 text-xs font-mono flex justify-between bg-muted/30">
          <span>Gross: {formatINR(gross)}</span>
          <span>Deductions: {formatINR(totalDed)}</span>
          <span className="font-bold text-primary">Net: {formatINR(net)}</span>
        </div>

        <DialogFooter className="border-t px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? "Saving..." : "Save Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
