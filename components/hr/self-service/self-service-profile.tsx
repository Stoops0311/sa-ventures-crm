"use client"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type ProfileData = {
  user: {
    name: string
    email?: string
    phone?: string
  }
  dateOfBirth?: string
  gender?: string
  bloodGroup?: string
  department?: string
  designation?: string
  dateOfJoining?: string
  panNumber?: string
  aadharNumber?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
}

function maskPan(value?: string) {
  if (!value || value.length < 10) return value
  return value.slice(0, 2) + "XXX" + value.slice(5)
}

function maskAadhar(value?: string) {
  if (!value || value.length < 8) return value
  const digits = value.replace(/\s/g, "")
  return "XXXX XXXX " + digits.slice(-4)
}

function maskAccount(value?: string) {
  if (!value || value.length <= 4) return value
  return "XXXX XXXX " + value.slice(-4)
}

function MaskedField({
  label,
  value,
  maskedValue,
}: {
  label: string
  value?: string
  maskedValue?: string
}) {
  if (!value) {
    return (
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm mt-0.5 text-muted-foreground italic">--</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-sm mt-0.5 font-mono cursor-default">
            {maskedValue ?? value}
          </p>
        </TooltipTrigger>
        <TooltipContent>{value}</TooltipContent>
      </Tooltip>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("text-sm mt-0.5", !value && "text-muted-foreground italic")}>
        {value || "--"}
      </p>
    </div>
  )
}

export function SelfServiceProfile({ data }: { data: ProfileData }) {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        <Field label="Name" value={data.user.name} />
        <Field label="Email" value={data.user.email} />
        <Field label="Phone" value={data.user.phone} />
        <Field label="Date of Birth" value={data.dateOfBirth} />
        <Field label="Gender" value={data.gender ? data.gender.charAt(0).toUpperCase() + data.gender.slice(1) : undefined} />
        <Field label="Blood Group" value={data.bloodGroup} />
        <Field label="Department" value={data.department} />
        <Field label="Designation" value={data.designation} />
        <Field label="Date of Joining" value={data.dateOfJoining} />
      </div>

      {/* Sensitive fields - masked */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        <MaskedField label="PAN Number" value={data.panNumber} maskedValue={maskPan(data.panNumber)} />
        <MaskedField label="Aadhar Number" value={data.aadharNumber} maskedValue={maskAadhar(data.aadharNumber)} />
        <Field label="Bank Name" value={data.bankName} />
        <MaskedField label="Account Number" value={data.accountNumber} maskedValue={maskAccount(data.accountNumber)} />
        <Field label="IFSC Code" value={data.ifscCode} />
      </div>

      {/* Emergency Contact */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Emergency Contact</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3">
          <Field label="Name" value={data.emergencyContactName} />
          <Field label="Phone" value={data.emergencyContactPhone} />
          <Field label="Relationship" value={data.emergencyContactRelation} />
        </div>
      </div>
    </div>
  )
}
