"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PETTY_CASH_CATEGORY_STYLES } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function AddEntryDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"given" | "returned">("given")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [isCustomPerson, setIsCustomPerson] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [customName, setCustomName] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const createEntry = useMutation(api.pettyCash.create)
  const generateUploadUrl = useMutation(api.pettyCash.generateUploadUrl)
  const crmUsers = useQuery(api.pettyCash.listCrmUsers)

  const resetForm = () => {
    setType("given")
    setAmount("")
    setCategory("")
    setDescription("")
    setIsCustomPerson(false)
    setSelectedUserId("")
    setCustomName("")
    setReceiptFile(null)
  }

  const handleSave = async () => {
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    if (!category) {
      toast.error("Please select a category")
      return
    }
    if (!description.trim()) {
      toast.error("Please enter a description")
      return
    }
    if (!isCustomPerson && !selectedUserId) {
      toast.error("Please select a person")
      return
    }
    if (isCustomPerson && !customName.trim()) {
      toast.error("Please enter a name")
      return
    }

    setSaving(true)
    try {
      let receiptStorageId: Id<"_storage"> | undefined
      let receiptFileName: string | undefined

      // Upload receipt if provided
      if (receiptFile) {
        const uploadUrl = await generateUploadUrl()
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": receiptFile.type },
          body: receiptFile,
        })
        const { storageId } = await result.json()
        receiptStorageId = storageId
        receiptFileName = receiptFile.name
      }

      await createEntry({
        type,
        amount: amountNum,
        category,
        description: description.trim(),
        personUserId: !isCustomPerson && selectedUserId
          ? (selectedUserId as Id<"users">)
          : undefined,
        personName: isCustomPerson ? customName.trim() : undefined,
        receiptStorageId,
        receiptFileName,
      })

      toast.success("Entry added")
      setOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add entry")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Add Petty Cash Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("given")}
              className={cn(
                "p-3 border text-center transition-colors",
                type === "given"
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <p className="text-sm font-medium">Money Given</p>
              <p className="text-[10px] text-muted-foreground">Cash out</p>
            </button>
            <button
              type="button"
              onClick={() => setType("returned")}
              className={cn(
                "p-3 border text-center transition-colors",
                type === "returned"
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-background border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <p className="text-sm font-medium">Money Returned</p>
              <p className="text-[10px] text-muted-foreground">Cash in</p>
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Amount (Rs)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              className="font-mono"
            />
          </div>

          {/* Person */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Person</Label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Custom name</span>
                <Switch
                  checked={isCustomPerson}
                  onCheckedChange={(v) => {
                    setIsCustomPerson(v)
                    setSelectedUserId("")
                    setCustomName("")
                  }}
                />
              </div>
            </div>
            {isCustomPerson ? (
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Enter name..."
              />
            ) : (
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select person..." />
                </SelectTrigger>
                <SelectContent>
                  {crmUsers?.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name}
                      <span className="text-muted-foreground ml-1 text-xs">
                        ({u.role})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {PETTY_CASH_CATEGORY_STYLES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Purpose of this transaction..."
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Receipt{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
            {receiptFile && (
              <p className="text-[10px] text-muted-foreground">
                {receiptFile.name}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
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
              {saving ? "Adding..." : "Add Entry"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setOpen(false); resetForm() }}
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
