"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { validateStoredPhone, validatePhone } from "@/lib/phone-utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert01Icon,
  Edit02Icon,
  Tick01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface PhoneValidationBannerProps {
  leadId: string
  mobileNumber: string
}

export function PhoneValidationBanner({
  leadId,
  mobileNumber,
}: PhoneValidationBannerProps) {
  const typedLeadId = leadId as Id<"leads">
  const validation = validateStoredPhone(mobileNumber)
  const updatePhone = useMutation(api.leads.updatePhone)

  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState(false)

  // Valid number — show nothing
  if (validation.isValid) return null

  const handleStartEdit = () => {
    setEditValue(validation.normalized || mobileNumber)
    setEditing(true)
  }

  const handleSave = async () => {
    const newValidation = validatePhone(editValue)
    if (!newValidation.isValid) {
      toast.error("Number is still invalid: " + newValidation.issues[0])
      return
    }

    setSaving(true)
    try {
      await updatePhone({
        leadId: typedLeadId,
        mobileNumber: newValidation.normalized,
      })
      toast("Phone number updated")
      setEditing(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update phone"
      )
    } finally {
      setSaving(false)
    }
  }

  const handleAutoFix = async () => {
    if (!validation.normalized) return
    const fixedValidation = validatePhone(validation.normalized)
    if (!fixedValidation.isValid) {
      // Can't auto-fix, let user edit manually
      handleStartEdit()
      return
    }

    setSaving(true)
    try {
      await updatePhone({
        leadId: typedLeadId,
        mobileNumber: validation.normalized,
      })
      toast("Phone number fixed")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update phone"
      )
    } finally {
      setSaving(false)
    }
  }

  // Check if we can auto-fix (normalized version is valid)
  const canAutoFix =
    validation.normalized &&
    validation.normalized !== mobileNumber.replace(/\D/g, "") &&
    validatePhone(validation.normalized).isValid

  return (
    <div className="mx-4 mt-3 border border-amber-300 bg-amber-50 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <HugeiconsIcon
          icon={Alert01Icon}
          strokeWidth={2}
          className="size-4 text-amber-600 shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-xs font-medium text-amber-800">
            Phone number needs fixing before messages can be sent
          </p>

          <div className="text-[11px] text-amber-700 space-y-0.5">
            <p>
              <span className="font-medium">Current:</span>{" "}
              <span className="font-mono bg-amber-100 px-1">{mobileNumber}</span>
            </p>
            {validation.issues.map((issue, i) => (
              <p key={i}>
                <span className="font-medium">Issue:</span> {issue}
              </p>
            ))}
            {validation.suggestion && (
              <p>
                <span className="font-medium">Fix:</span>{" "}
                {validation.suggestion}
              </p>
            )}
            {validation.normalized && validation.normalized !== mobileNumber.replace(/\D/g, "") && (
              <p>
                <span className="font-medium">Suggested:</span>{" "}
                <span className="font-mono bg-green-100 text-green-800 px-1">
                  {validation.normalized}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="flex items-center gap-2 pl-6">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="919876543210"
            className="h-7 text-xs font-mono flex-1"
          />
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSave}
            disabled={saving}
          >
            <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => setEditing(false)}
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 pl-6">
          {canAutoFix && (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAutoFix}
              disabled={saving}
            >
              <HugeiconsIcon icon={Tick01Icon} strokeWidth={2} />
              {saving ? "Fixing..." : `Fix to ${validation.normalized}`}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={handleStartEdit}
          >
            <HugeiconsIcon icon={Edit02Icon} strokeWidth={2} />
            Edit manually
          </Button>
        </div>
      )}
    </div>
  )
}
