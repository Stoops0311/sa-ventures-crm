"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export function MessageTemplatesManager() {
  const templates = useQuery(api.messageTemplates.list, {})
  const createTemplate = useMutation(api.messageTemplates.create)
  const updateTemplate = useMutation(api.messageTemplates.update)
  const toggleActive = useMutation(api.messageTemplates.toggleActive)
  const seedTemplates = useMutation(api.messageTemplates.seed)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [editingId, setEditingId] = useState<Id<"messageTemplates"> | null>(
    null
  )
  const [form, setForm] = useState({
    name: "",
    slug: "",
    bodyEn: "",
    bodyHi: "",
    triggerStatus: "",
    triggerBehavior: "",
    autoDelayMs: "",
  })
  const [saving, setSaving] = useState(false)

  const resetForm = () => {
    setForm({
      name: "",
      slug: "",
      bodyEn: "",
      bodyHi: "",
      triggerStatus: "",
      triggerBehavior: "",
      autoDelayMs: "",
    })
    setEditingId(null)
  }

  const handleEdit = (template: NonNullable<typeof templates>[number]) => {
    setEditingId(template._id)
    setForm({
      name: template.name,
      slug: template.slug,
      bodyEn: template.bodyEn,
      bodyHi: template.bodyHi,
      triggerStatus: template.triggerStatus ?? "",
      triggerBehavior: template.triggerBehavior ?? "",
      autoDelayMs: template.autoDelayMs?.toString() ?? "",
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.bodyEn || !form.bodyHi) {
      toast.error("Name, slug, and both message bodies are required")
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await updateTemplate({
          templateId: editingId,
          name: form.name,
          slug: form.slug,
          bodyEn: form.bodyEn,
          bodyHi: form.bodyHi,
          triggerStatus: form.triggerStatus || undefined,
          triggerBehavior: form.triggerBehavior || undefined,
          autoDelayMs: form.autoDelayMs
            ? parseInt(form.autoDelayMs)
            : undefined,
        })
        toast("Template updated")
      } else {
        await createTemplate({
          name: form.name,
          slug: form.slug,
          bodyEn: form.bodyEn,
          bodyHi: form.bodyHi,
          triggerStatus: form.triggerStatus || undefined,
          triggerBehavior: form.triggerBehavior || undefined,
          autoDelayMs: form.autoDelayMs
            ? parseInt(form.autoDelayMs)
            : undefined,
        })
        toast("Template created")
      }
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save template"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Message Templates</h3>
          <p className="text-xs text-muted-foreground">
            Manage WhatsApp/SMS templates. Templates with trigger statuses
            auto-fire on lead status changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              resetForm()
              setDialogOpen(true)
            }}
          >
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
            Add Template
          </Button>
        </div>
      </div>

      {/* Seed default templates when none exist */}
      {templates && templates.length === 0 && (
        <div className="border border-dashed border-muted-foreground/30 bg-muted/30 p-4 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            No message templates yet. Seed the 14 default templates (English + Hindi) for site visits, follow-ups, booking, and more.
          </p>
          <Button
            size="sm"
            onClick={async () => {
              setSeeding(true)
              try {
                await seedTemplates()
                toast("14 default templates seeded")
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "Failed to seed templates"
                )
              } finally {
                setSeeding(false)
              }
            }}
            disabled={seeding}
          >
            {seeding ? "Seeding..." : "Seed Default Templates"}
          </Button>
        </div>
      )}

      <div className="space-y-1">
        {templates?.map((t) => (
          <div
            key={t._id}
            className="border p-3 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{t.name}</p>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {t.slug}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {t.triggerStatus && (
                  <Badge variant="outline" className="text-[10px]">
                    {t.triggerStatus}
                  </Badge>
                )}
                {t.triggerBehavior && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      t.triggerBehavior === "auto_schedule"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}
                  >
                    {t.triggerBehavior === "auto_schedule"
                      ? "Auto-schedule"
                      : "Auto-suggest"}
                  </Badge>
                )}
                {t.autoDelayMs !== undefined && t.autoDelayMs > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(t.autoDelayMs / 60000)}min delay
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={t.isActive}
                onCheckedChange={() => toggleActive({ templateId: t._id })}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(t)}
              >
                <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Template" : "Add Template"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="Thank You After Visit"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) =>
                    setForm({ ...form, slug: e.target.value })
                  }
                  placeholder="thank_you_visit"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">English Message</Label>
              <Textarea
                value={form.bodyEn}
                onChange={(e) =>
                  setForm({ ...form, bodyEn: e.target.value })
                }
                rows={3}
                placeholder="Hi {{leadName}}, ..."
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Hindi Message</Label>
              <Textarea
                value={form.bodyHi}
                onChange={(e) =>
                  setForm({ ...form, bodyHi: e.target.value })
                }
                rows={3}
                placeholder="नमस्ते {{leadName}}, ..."
              />
            </div>

            <p className="text-[10px] text-muted-foreground">
              Available placeholders: {"{{leadName}}"}, {"{{projectName}}"},
              {"{{projectLocation}}"}, {"{{salespersonName}}"},{" "}
              {"{{companyName}}"}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Trigger Status (optional)</Label>
                <Select
                  value={form.triggerStatus}
                  onValueChange={(v) =>
                    setForm({ ...form, triggerStatus: v === "none" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="Visit Done">Visit Done</SelectItem>
                    <SelectItem value="Booking Done">Booking Done</SelectItem>
                    <SelectItem value="Follow Up">Follow Up</SelectItem>
                    <SelectItem value="Visit Scheduled">
                      Visit Scheduled
                    </SelectItem>
                    <SelectItem value="No Response">No Response</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Trigger Behavior</Label>
                <Select
                  value={form.triggerBehavior}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      triggerBehavior: v === "none" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Manual" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Manual</SelectItem>
                    <SelectItem value="auto_schedule">
                      Auto-schedule
                    </SelectItem>
                    <SelectItem value="auto_suggest">Auto-suggest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.triggerBehavior === "auto_schedule" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Delay (ms)</Label>
                <Input
                  type="number"
                  value={form.autoDelayMs}
                  onChange={(e) =>
                    setForm({ ...form, autoDelayMs: e.target.value })
                  }
                  placeholder="3600000 (1 hour)"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
