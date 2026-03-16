"use client"

import { useState, useId } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import { PlusSignIcon, Delete01Icon } from "@hugeicons/core-free-icons"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SalaryHelper } from "./salary-helper"
import { formatINR } from "@/lib/currency"
import { toast } from "sonner"

const DEFAULT_SALARY_COMPONENTS = [
  { name: "Basic", type: "earning" as const, order: 1, isCustom: false },
  { name: "HRA", type: "earning" as const, order: 2, isCustom: false },
  { name: "DA", type: "earning" as const, order: 3, isCustom: false },
  { name: "Conveyance Allowance", type: "earning" as const, order: 4, isCustom: false },
  { name: "Medical Allowance", type: "earning" as const, order: 5, isCustom: false },
  { name: "Special Allowance", type: "earning" as const, order: 6, isCustom: false },
  { name: "PF", type: "deduction" as const, order: 7, isCustom: false },
  { name: "ESI", type: "deduction" as const, order: 8, isCustom: false },
  { name: "Professional Tax", type: "deduction" as const, order: 9, isCustom: false },
  { name: "TDS", type: "deduction" as const, order: 10, isCustom: false },
]

type ComponentRow = {
  id: string
  name: string
  type: "earning" | "deduction"
  amount: number
  isCustom: boolean
  order: number
}

interface SalaryConfigFormProps {
  userId: Id<"users">
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  existingComponents?: Array<{
    name: string
    type: string
    amount: number
    isCustom: boolean
    order: number
  }>
}

export function SalaryConfigForm({
  userId,
  userName,
  open,
  onOpenChange,
  existingComponents,
}: SalaryConfigFormProps) {
  const formId = useId()
  const setAll = useMutation(api.salaryComponents.setAll)
  const [saving, setSaving] = useState(false)

  const initialRows: ComponentRow[] =
    existingComponents && existingComponents.length > 0
      ? existingComponents.map((c, i) => ({
          id: `${formId}-${i}`,
          name: c.name,
          type: c.type as "earning" | "deduction",
          amount: c.amount,
          isCustom: c.isCustom,
          order: c.order,
        }))
      : DEFAULT_SALARY_COMPONENTS.map((c, i) => ({
          id: `${formId}-default-${i}`,
          name: c.name,
          type: c.type,
          amount: 0,
          isCustom: c.isCustom,
          order: c.order,
        }))

  const [rows, setRows] = useState<ComponentRow[]>(initialRows)

  // Reset rows when dialog opens
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setRows(initialRows)
    }
    onOpenChange(next)
  }

  const updateRow = (id: string, updates: Partial<ComponentRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
  }

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const addCustomRow = () => {
    const maxOrder = Math.max(...rows.map((r) => r.order), 0)
    setRows((prev) => [
      ...prev,
      {
        id: `${formId}-custom-${Date.now()}`,
        name: "",
        type: "earning",
        amount: 0,
        isCustom: true,
        order: maxOrder + 1,
      },
    ])
  }

  const earnings = rows.filter((r) => r.type === "earning")
  const deductions = rows.filter((r) => r.type === "deduction")
  const grossEarnings = earnings.reduce((s, r) => s + r.amount, 0)
  const totalDeductions = deductions.reduce((s, r) => s + r.amount, 0)
  const netPay = grossEarnings - totalDeductions
  const allZero = rows.every((r) => r.amount === 0)

  const handleSave = async () => {
    // Validate
    for (const row of rows) {
      if (!row.name.trim()) {
        toast.error("All components must have a name")
        return
      }
      if (row.amount < 0) {
        toast.error(`${row.name}: amount cannot be negative`)
        return
      }
    }

    const names = rows.map((r) => r.name.trim().toLowerCase())
    const dupes = names.filter((n, i) => names.indexOf(n) !== i)
    if (dupes.length > 0) {
      toast.error(`Duplicate component: ${dupes[0]}`)
      return
    }

    setSaving(true)
    try {
      await setAll({
        userId,
        components: rows.map((r, i) => ({
          name: r.name.trim(),
          type: r.type,
          amount: Math.round(r.amount),
          isCustom: r.isCustom,
          order: i + 1,
        })),
      })
      toast.success(`Salary configured for ${userName}`)
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Salary Configuration</DialogTitle>
          <DialogDescription>{userName}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-2">
            {/* Earnings */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">
                Earnings
              </p>
              <div className="space-y-1.5">
                {earnings.map((row) => (
                  <ComponentRowInput
                    key={row.id}
                    row={row}
                    onChange={(updates) => updateRow(row.id, updates)}
                    onRemove={row.isCustom ? () => removeRow(row.id) : undefined}
                  />
                ))}
                <SubtotalRow label="Gross Earnings" amount={grossEarnings} />
              </div>
            </div>

            <Separator />

            {/* Deductions */}
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-2">
                Deductions
              </p>
              <div className="space-y-1.5">
                {deductions.map((row) => (
                  <ComponentRowInput
                    key={row.id}
                    row={row}
                    onChange={(updates) => updateRow(row.id, updates)}
                    onRemove={row.isCustom ? () => removeRow(row.id) : undefined}
                  />
                ))}
                <SubtotalRow label="Total Deductions" amount={totalDeductions} />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 p-4 flex items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p>
                  Gross: <span className="font-mono font-medium text-foreground">{formatINR(grossEarnings)}</span>
                </p>
                <p>
                  Deductions: <span className="font-mono font-medium text-foreground">{formatINR(totalDeductions)}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Net Pay</p>
                <p className="text-xl font-bold text-primary font-sans tabular-nums">
                  {formatINR(netPay)}
                </p>
              </div>
            </div>

            {allZero && rows.length > 0 && (
              <p className="text-xs text-amber-600 text-center">
                All amounts are zero. Enter salary amounts before saving.
              </p>
            )}

            {/* Advisory */}
            <SalaryHelper components={rows} />

            {/* Add custom */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addCustomRow}
            >
              <HugeiconsIcon icon={PlusSignIcon} className="size-3.5 mr-1.5" />
              Add Custom Component
            </Button>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || rows.length === 0}>
            {saving ? "Saving..." : "Save Salary Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ComponentRowInput({
  row,
  onChange,
  onRemove,
}: {
  row: ComponentRow
  onChange: (updates: Partial<ComponentRow>) => void
  onRemove?: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      {row.isCustom ? (
        <>
          <Input
            value={row.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Component name"
            className="flex-1 h-8 text-xs"
          />
          <Select
            value={row.type}
            onValueChange={(val) => onChange({ type: val as "earning" | "deduction" })}
          >
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="earning">Earning</SelectItem>
              <SelectItem value="deduction">Deduction</SelectItem>
            </SelectContent>
          </Select>
        </>
      ) : (
        <Label className="flex-1 text-xs font-mono truncate">{row.name}</Label>
      )}
      <Input
        type="number"
        min={0}
        value={row.amount || ""}
        onChange={(e) => {
          const val = e.target.value === "" ? 0 : parseFloat(e.target.value)
          if (!isNaN(val)) onChange({ amount: val })
        }}
        placeholder="0"
        className="w-36 h-8 text-right font-mono tabular-nums text-xs"
      />
      {onRemove ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <HugeiconsIcon icon={Delete01Icon} className="size-3.5" />
        </Button>
      ) : (
        <div className="w-7 shrink-0" />
      )}
    </div>
  )
}

function SubtotalRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-center justify-between border-t pt-1.5 mt-1.5">
      <span className="text-xs font-medium">{label}</span>
      <span className="text-xs font-mono font-medium tabular-nums mr-9">
        {formatINR(amount)}
      </span>
    </div>
  )
}
