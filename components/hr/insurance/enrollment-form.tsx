"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowDown01Icon,
  CheckmarkCircle01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons"
type Dependent = { name: string; relation: string; dob: string }

export function EnrollmentForm({
  onCancel,
  onSuccess,
  initialData,
}: {
  onCancel: () => void
  onSuccess: () => void
  initialData?: {
    nomineeName: string
    nomineeRelation: string
    nomineeDob: string
    existingConditions: boolean
    dependents?: string
    preExistingDetails?: string
    preferredHospital?: string
    sumInsured?: number
  }
}) {
  const enroll = useMutation(api.insurance.enroll)

  const [nomineeName, setNomineeName] = useState(initialData?.nomineeName ?? "")
  const [nomineeRelation, setNomineeRelation] = useState(initialData?.nomineeRelation ?? "")
  const [nomineeDob, setNomineeDob] = useState(initialData?.nomineeDob ?? "")
  const [hasConditions, setHasConditions] = useState(initialData?.existingConditions ?? false)
  const [conditionDetails, setConditionDetails] = useState(initialData?.preExistingDetails ?? "")

  // Optional fields
  const [dependents, setDependents] = useState<Dependent[]>(
    initialData?.dependents ? JSON.parse(initialData.dependents) : []
  )
  const [preExistingDetails, setPreExistingDetails] = useState(initialData?.preExistingDetails ?? "")
  const [preferredHospital, setPreferredHospital] = useState(initialData?.preferredHospital ?? "")
  const [sumInsured, setSumInsured] = useState(initialData?.sumInsured?.toString() ?? "")

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const requiredFilled = [nomineeName, nomineeRelation, nomineeDob].filter(Boolean).length + (hasConditions ? (conditionDetails ? 1 : 0) : 1)
  const totalRequired = hasConditions ? 4 : 3

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!nomineeName.trim()) errs.nomineeName = "Required"
    if (!nomineeRelation) errs.nomineeRelation = "Required"
    if (!nomineeDob) errs.nomineeDob = "Required"
    if (hasConditions && !conditionDetails.trim()) errs.conditionDetails = "Required when conditions are indicated"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      await enroll({
        nomineeName: nomineeName.trim(),
        nomineeRelation,
        nomineeDob,
        existingConditions: hasConditions,
        dependents: dependents.length > 0 ? JSON.stringify(dependents) : undefined,
        preExistingDetails: preExistingDetails.trim() || undefined,
        preferredHospital: preferredHospital.trim() || undefined,
        sumInsured: sumInsured ? Number(sumInsured) : undefined,
      })
      setSuccess(true)
      toast.success("Insurance enrollment submitted")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit enrollment")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card className="max-w-2xl">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-12 text-green-600 mb-4" />
          <h3 className="font-sans text-lg font-semibold">Enrollment submitted successfully</h3>
          <p className="text-sm text-muted-foreground mt-1">
            HR will process your enrollment and update your policy details
          </p>
          <Button variant="outline" className="mt-6" onClick={onSuccess}>
            Back to My HR
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="font-sans text-lg">Insurance Enrollment</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fill in your nominee details to enroll in the company insurance plan
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required Section */}
        <div className="space-y-4">
          <div>
            <Label className="text-xs">
              Nominee Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="Full legal name of your nominee"
              value={nomineeName}
              onChange={(e) => { setNomineeName(e.target.value); setErrors((p) => ({ ...p, nomineeName: "" })) }}
              autoFocus
            />
            {errors.nomineeName && (
              <p className="text-xs text-destructive mt-1 animate-in fade-in duration-150">{errors.nomineeName}</p>
            )}
          </div>

          <div>
            <Label className="text-xs">
              Nominee Relation <span className="text-destructive">*</span>
            </Label>
            <Select value={nomineeRelation} onValueChange={(v) => { setNomineeRelation(v); setErrors((p) => ({ ...p, nomineeRelation: "" })) }}>
              <SelectTrigger>
                <SelectValue placeholder="Select relation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Spouse">Spouse</SelectItem>
                <SelectItem value="Parent">Parent</SelectItem>
                <SelectItem value="Child">Child</SelectItem>
                <SelectItem value="Sibling">Sibling</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.nomineeRelation && (
              <p className="text-xs text-destructive mt-1 animate-in fade-in duration-150">{errors.nomineeRelation}</p>
            )}
          </div>

          <div>
            <Label className="text-xs">
              Nominee Date of Birth <span className="text-destructive">*</span>
            </Label>
            <Input
              type="date"
              value={nomineeDob}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => { setNomineeDob(e.target.value); setErrors((p) => ({ ...p, nomineeDob: "" })) }}
            />
            {errors.nomineeDob && (
              <p className="text-xs text-destructive mt-1 animate-in fade-in duration-150">{errors.nomineeDob}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Do you have any existing medical conditions?</Label>
              <Switch checked={hasConditions} onCheckedChange={setHasConditions} />
            </div>
            {hasConditions && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <Label className="text-xs">Please describe your conditions</Label>
                <Textarea
                  placeholder="Briefly describe any pre-existing conditions..."
                  value={conditionDetails}
                  onChange={(e) => { setConditionDetails(e.target.value); setErrors((p) => ({ ...p, conditionDetails: "" })) }}
                  rows={3}
                />
                {errors.conditionDetails && (
                  <p className="text-xs text-destructive mt-1 animate-in fade-in duration-150">{errors.conditionDetails}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Optional Section */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-sm">
              Additional Details <span className="text-muted-foreground">(Optional)</span>
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-4 transition-transform duration-200" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="space-y-4 bg-muted/30 p-4 border mt-2">
              {/* Dependents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">Dependents</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={dependents.length >= 5}
                    onClick={() =>
                      setDependents([...dependents, { name: "", relation: "", dob: "" }])
                    }
                  >
                    Add Dependent
                  </Button>
                </div>
                {dependents.map((dep, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 mt-2 animate-in slide-in-from-left-2 duration-200"
                  >
                    <Input
                      placeholder="Name"
                      value={dep.name}
                      onChange={(e) => {
                        const next = [...dependents]
                        next[i] = { ...next[i], name: e.target.value }
                        setDependents(next)
                      }}
                      className="flex-1"
                    />
                    <Select
                      value={dep.relation}
                      onValueChange={(v) => {
                        const next = [...dependents]
                        next[i] = { ...next[i], relation: v }
                        setDependents(next)
                      }}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="date"
                      value={dep.dob}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        const next = [...dependents]
                        next[i] = { ...next[i], dob: e.target.value }
                        setDependents(next)
                      }}
                      className="w-36"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-destructive shrink-0"
                      onClick={() => setDependents(dependents.filter((_, j) => j !== i))}
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                    </Button>
                  </div>
                ))}
                {dependents.length >= 5 && (
                  <p className="text-xs text-muted-foreground mt-1">Maximum 5 dependents</p>
                )}
              </div>

              <div>
                <Label className="text-xs">Additional medical history</Label>
                <Textarea
                  placeholder="Any surgeries, chronic conditions, ongoing treatments..."
                  value={preExistingDetails}
                  onChange={(e) => setPreExistingDetails(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This helps the insurance provider assess coverage
                </p>
              </div>

              <div>
                <Label className="text-xs">Preferred Hospital</Label>
                <Input
                  placeholder="Name of your preferred network hospital"
                  value={preferredHospital}
                  onChange={(e) => setPreferredHospital(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Preferred Sum Insured (INR)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 500000"
                  value={sumInsured}
                  onChange={(e) => setSumInsured(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Final sum insured will be determined by the policy
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Progress indicator */}
        <p className="text-xs text-muted-foreground text-right">
          {Math.min(requiredFilled, totalRequired)} of {totalRequired} required fields completed
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Enrollment"}
        </Button>
      </CardFooter>
    </Card>
  )
}
