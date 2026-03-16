"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  GENDERS,
  MARITAL_STATUSES,
  BLOOD_GROUPS,
  HR_DEPARTMENTS,
  EMERGENCY_CONTACT_RELATIONS,
} from "@/convex/lib/constants"

type ProfileData = {
  userId: Id<"users">
  dateOfBirth?: string
  gender?: string
  fatherName?: string
  motherName?: string
  maritalStatus?: string
  bloodGroup?: string
  panNumber?: string
  aadharNumber?: string
  address?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  designation?: string
  department?: string
  dateOfJoining?: string
}

export function EmployeeProfileForm({
  profile,
  section,
  isHROrAdmin: _isHROrAdmin,
  onCancel,
  onSaved,
}: {
  profile: ProfileData
  section: "personal" | "banking" | "emergency" | "employment"
  isHROrAdmin: boolean
  onCancel: () => void
  onSaved: () => void
}) {
  const upsert = useMutation(api.employeeProfiles.upsert)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    if (section === "employment") {
      init.designation = profile.designation ?? ""
      init.department = profile.department ?? ""
      init.dateOfJoining = profile.dateOfJoining ?? ""
    } else if (section === "personal") {
      init.dateOfBirth = profile.dateOfBirth ?? ""
      init.gender = profile.gender ?? ""
      init.fatherName = profile.fatherName ?? ""
      init.motherName = profile.motherName ?? ""
      init.maritalStatus = profile.maritalStatus ?? ""
      init.bloodGroup = profile.bloodGroup ?? ""
      init.panNumber = profile.panNumber ?? ""
      init.aadharNumber = profile.aadharNumber ?? ""
      init.address = profile.address ?? ""
    } else if (section === "banking") {
      init.bankName = profile.bankName ?? ""
      init.accountNumber = profile.accountNumber ?? ""
      init.ifscCode = profile.ifscCode ?? ""
    } else {
      init.emergencyContactName = profile.emergencyContactName ?? ""
      init.emergencyContactPhone = profile.emergencyContactPhone ?? ""
      init.emergencyContactRelation = profile.emergencyContactRelation ?? ""
    }
    return init
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function update(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (section === "personal") {
      if (fields.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(fields.panNumber)) {
        errs.panNumber = "PAN must be in format ABCDE1234F"
      }
      if (fields.aadharNumber) {
        const digits = fields.aadharNumber.replace(/\s/g, "")
        if (!/^\d{12}$/.test(digits)) {
          errs.aadharNumber = "Aadhar must be 12 digits"
        }
      }
    }
    if (section === "banking") {
      if (fields.ifscCode && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(fields.ifscCode)) {
        errs.ifscCode = "IFSC must be in format ABCD0123456"
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    setSaving(true)
    try {
      const data: Record<string, string | undefined> = {}
      for (const [key, value] of Object.entries(fields)) {
        data[key] = value || undefined
      }
      await upsert({ userId: profile.userId, ...data } as Parameters<typeof upsert>[0])
      toast.success("Profile updated")
      onSaved()
    } catch (err) {
      toast.error("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }

  if (section === "employment") {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Designation</Label>
            <Input
              value={fields.designation ?? ""}
              onChange={(e) => update("designation", e.target.value)}
              placeholder="e.g. Sales Executive"
            />
          </div>
          <div>
            <Label>Department</Label>
            <Select value={fields.department ?? ""} onValueChange={(v) => update("department", v)}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {HR_DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date of Joining</Label>
            <Input type="date" value={fields.dateOfJoining ?? ""} onChange={(e) => update("dateOfJoining", e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    )
  }

  if (section === "personal") {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={fields.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
            />
          </div>
          <div>
            <Label>Gender</Label>
            <Select value={fields.gender} onValueChange={(v) => update("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Father's Name</Label>
            <Input value={fields.fatherName} onChange={(e) => update("fatherName", e.target.value)} />
          </div>
          <div>
            <Label>Mother's Name</Label>
            <Input value={fields.motherName} onChange={(e) => update("motherName", e.target.value)} />
          </div>
          <div>
            <Label>Marital Status</Label>
            <Select value={fields.maritalStatus} onValueChange={(v) => update("maritalStatus", v)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {MARITAL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Blood Group</Label>
            <Select value={fields.bloodGroup} onValueChange={(v) => update("bloodGroup", v)}>
              <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>PAN Number</Label>
            <Input
              value={fields.panNumber}
              onChange={(e) => update("panNumber", e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
            />
            {errors.panNumber && <p className="text-xs text-destructive mt-1">{errors.panNumber}</p>}
          </div>
          <div>
            <Label>Aadhar Number</Label>
            <Input
              value={fields.aadharNumber}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "").slice(0, 12)
                const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ")
                update("aadharNumber", formatted)
              }}
              placeholder="1234 5678 9012"
              inputMode="numeric"
            />
            {errors.aadharNumber && <p className="text-xs text-destructive mt-1">{errors.aadharNumber}</p>}
          </div>
        </div>
        <div>
          <Label>Address</Label>
          <Textarea
            value={fields.address}
            onChange={(e) => update("address", e.target.value)}
            rows={3}
            placeholder="Full residential address"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    )
  }

  if (section === "banking") {
    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div>
          <Label>Bank Name</Label>
          <Input value={fields.bankName} onChange={(e) => update("bankName", e.target.value)} placeholder="e.g. State Bank of India" />
        </div>
        <div>
          <Label>Account Number</Label>
          <Input value={fields.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} placeholder="Savings account number" inputMode="numeric" />
        </div>
        <div>
          <Label>IFSC Code</Label>
          <Input
            value={fields.ifscCode}
            onChange={(e) => update("ifscCode", e.target.value.toUpperCase())}
            placeholder="e.g. SBIN0001234"
          />
          {errors.ifscCode && <p className="text-xs text-destructive mt-1">{errors.ifscCode}</p>}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    )
  }

  // Emergency contact
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Contact Name</Label>
          <Input value={fields.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <Label>Phone Number</Label>
          <Input value={fields.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} placeholder="10-digit mobile" type="tel" inputMode="numeric" />
        </div>
        <div>
          <Label>Relationship</Label>
          <Select value={fields.emergencyContactRelation} onValueChange={(v) => update("emergencyContactRelation", v)}>
            <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
            <SelectContent>
              {EMERGENCY_CONTACT_RELATIONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
