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
import { VISIT_LOCATION_STYLES } from "@/lib/constants"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export function LogWalkInDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [isExistingLead, setIsExistingLead] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLeadId, setSelectedLeadId] = useState<string>("")
  const [walkinName, setWalkinName] = useState("")
  const [walkinPhone, setWalkinPhone] = useState("")
  const [walkinPurpose, setWalkinPurpose] = useState("")
  const [visitLocation, setVisitLocation] = useState("office")
  const [saving, setSaving] = useState(false)

  const createWalkIn = useMutation(api.visits.createWalkIn)

  const searchResults = useQuery(
    api.visits.searchVisitors,
    isExistingLead && searchTerm.length >= 2 ? { searchTerm } : "skip"
  )

  const resetForm = () => {
    setIsExistingLead(false)
    setSearchTerm("")
    setSelectedLeadId("")
    setWalkinName("")
    setWalkinPhone("")
    setWalkinPurpose("")
    setVisitLocation("office")
  }

  const handleSave = async () => {
    if (isExistingLead && !selectedLeadId) {
      toast.error("Please select a lead")
      return
    }
    if (!isExistingLead && !walkinName.trim()) {
      toast.error("Please enter a visitor name")
      return
    }

    setSaving(true)
    try {
      await createWalkIn({
        leadId: isExistingLead && selectedLeadId
          ? (selectedLeadId as Id<"leads">)
          : undefined,
        walkinName: !isExistingLead ? walkinName.trim() : undefined,
        walkinPhone: !isExistingLead && walkinPhone.trim()
          ? walkinPhone.trim()
          : undefined,
        walkinPurpose: walkinPurpose.trim() || undefined,
        visitLocation,
      })
      toast.success("Walk-in visit logged")
      setOpen(false)
      resetForm()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to log visit")
    } finally {
      setSaving(false)
    }
  }

  const selectedLead = searchResults?.find((r) => r.leadId === selectedLeadId)

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Log Walk-in Visit</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs text-muted-foreground">
            Record an unscheduled visitor. They will be marked as arrived immediately.
          </p>

          {/* Toggle: existing lead vs custom */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Existing lead in CRM?</Label>
            <Switch
              checked={isExistingLead}
              onCheckedChange={(v) => {
                setIsExistingLead(v)
                setSelectedLeadId("")
                setSearchTerm("")
              }}
            />
          </div>

          {isExistingLead ? (
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Search Lead</Label>
                <Input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setSelectedLeadId("")
                  }}
                  placeholder="Search by name or phone..."
                />
              </div>

              {searchResults && searchResults.length > 0 && !selectedLeadId && (
                <div className="max-h-40 overflow-y-auto space-y-1 border p-1">
                  {searchResults.map((result) => (
                    <button
                      key={result.leadId}
                      type="button"
                      onClick={() => setSelectedLeadId(result.leadId)}
                      className="w-full text-left p-2 hover:bg-muted transition-colors"
                    >
                      <p className="text-sm font-medium">{result.leadName}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.leadPhone} &middot; {result.projectName} &middot; {result.salespersonName}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {selectedLead && (
                <div className="p-2 border bg-muted/50">
                  <p className="text-sm font-medium">{selectedLead.leadName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedLead.leadPhone} &middot; {selectedLead.projectName} &middot; {selectedLead.salespersonName}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Visitor Name</Label>
                <Input
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="Enter visitor name..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Phone{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value)}
                  placeholder="Phone number..."
                />
              </div>
            </>
          )}

          {/* Purpose */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              Purpose{" "}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              value={walkinPurpose}
              onChange={(e) => setWalkinPurpose(e.target.value)}
              placeholder="Reason for visit..."
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Location</Label>
            <Select value={visitLocation} onValueChange={setVisitLocation}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VISIT_LOCATION_STYLES.map((loc) => (
                  <SelectItem key={loc.value} value={loc.value}>
                    {loc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              {saving ? "Logging..." : "Log Walk-in"}
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
