"use client"

import { cn } from "@/lib/utils"

type ProfileData = {
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

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p
        className={cn(
          "text-sm mt-0.5",
          !value && "text-muted-foreground italic"
        )}
      >
        {value || "--"}
      </p>
    </div>
  )
}

function maskAccount(value?: string) {
  if (!value || value.length <= 4) return value
  return "XXXX XXXX " + value.slice(-4)
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

export function EmployeeProfileView({
  profile,
  section,
}: {
  profile: ProfileData
  section: "personal" | "banking" | "emergency" | "employment"
}) {
  if (section === "employment") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3">
        <Field label="Designation" value={profile.designation} />
        <Field label="Department" value={profile.department} />
        <Field label="Date of Joining" value={profile.dateOfJoining} />
      </div>
    )
  }

  if (section === "personal") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
        <Field label="Date of Birth" value={profile.dateOfBirth} />
        <Field label="Gender" value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : undefined} />
        <Field label="Father's Name" value={profile.fatherName} />
        <Field label="Mother's Name" value={profile.motherName} />
        <Field label="Marital Status" value={profile.maritalStatus ? profile.maritalStatus.charAt(0).toUpperCase() + profile.maritalStatus.slice(1) : undefined} />
        <Field label="Blood Group" value={profile.bloodGroup} />
        <Field label="PAN Number" value={maskPan(profile.panNumber)} />
        <Field label="Aadhar Number" value={maskAadhar(profile.aadharNumber)} />
        <Field label="Address" value={profile.address} />
      </div>
    )
  }

  if (section === "banking") {
    return (
      <div className="space-y-3">
        <Field label="Bank Name" value={profile.bankName} />
        <Field label="Account Number" value={maskAccount(profile.accountNumber)} />
        <Field label="IFSC Code" value={profile.ifscCode} />
      </div>
    )
  }

  // emergency
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
      <Field label="Contact Name" value={profile.emergencyContactName} />
      <Field label="Relationship" value={profile.emergencyContactRelation} />
      <Field label="Phone Number" value={profile.emergencyContactPhone} />
    </div>
  )
}
