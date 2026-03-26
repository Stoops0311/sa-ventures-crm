"use client"

import { useState, useRef } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileUploadIcon, Cancel01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface StepCompleteProps {
  processId: Id<"afterSalesProcesses">
  stepKey: string
  stepLabel: string
  nextStepLabel?: string
  existingDocuments?: Array<{
    storageId: string
    fileName: string
    uploadedAt: number
    url?: string | null
  }> | null
}

export function AfterSalesStepComplete({
  processId,
  stepKey,
  stepLabel,
  nextStepLabel,
  existingDocuments,
}: StepCompleteProps) {
  const completeStep = useMutation(api.afterSales.completeStep)
  const uploadDocument = useMutation(api.afterSales.uploadDocument)
  const removeDocument = useMutation(api.afterSales.removeDocument)
  const generateUploadUrl = useMutation(api.afterSales.generateUploadUrl)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [remark, setRemark] = useState("")

  // Step-specific fields
  const [amount, setAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState("")
  const [bankName, setBankName] = useState("")
  const [loanAmount, setLoanAmount] = useState("")
  const [sanctionDate, setSanctionDate] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [registrationDate, setRegistrationDate] = useState("")
  const [disbursementAmount, setDisbursementAmount] = useState("")
  const [disbursementDate, setDisbursementDate] = useState("")
  const [bookingAmount, setBookingAmount] = useState("")

  const isFinancialStep =
    stepKey === "ocr_payment_collection" || stepKey === "stamp_duty_payment"
  const isLoanStep = stepKey === "loan_processing"
  const isRegistrationStep = stepKey === "registration"
  const isDisbursementStep = stepKey === "bank_disbursement"
  const isBookingFormStep = stepKey === "booking_form_fillup"

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 20MB limit
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large. Maximum 20MB.")
      return
    }

    setUploading(true)
    try {
      const url = await generateUploadUrl()
      const result = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })
      if (!result.ok) throw new Error("Upload failed")
      const { storageId } = await result.json()
      await uploadDocument({
        processId,
        stepKey,
        storageId,
        fileName: file.name,
      })
      toast.success(`Uploaded: ${file.name}`)
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveDocument = async (storageId: string) => {
    try {
      await removeDocument({ processId, stepKey, storageId })
      toast.success("Document removed")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove document"
      )
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    try {
      await completeStep({
        processId,
        stepKey,
        remark: remark.trim() || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        paymentMode: paymentMode || undefined,
        bankName: bankName || undefined,
        loanAmount: loanAmount ? parseFloat(loanAmount) : undefined,
        sanctionDate: sanctionDate || undefined,
        registrationNumber: registrationNumber || undefined,
        registrationDate: registrationDate || undefined,
        disbursementAmount: disbursementAmount
          ? parseFloat(disbursementAmount)
          : undefined,
        disbursementDate: disbursementDate || undefined,
        bookingAmount: bookingAmount ? parseFloat(bookingAmount) : undefined,
      })
      toast.success(`Completed: ${stepLabel}`)
      setRemark("")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete step"
      )
    } finally {
      setLoading(false)
    }
  }

  const docs = existingDocuments ?? []

  return (
    <div className="space-y-3 mt-2">
      {/* Step-specific fields */}
      {isBookingFormStep && (
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">
            Booking Amount (optional)
          </Label>
          <Input
            type="number"
            placeholder="e.g. 500000"
            value={bookingAmount}
            onChange={(e) => setBookingAmount(e.target.value)}
            className="h-7 text-xs"
          />
        </div>
      )}

      {isFinancialStep && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Amount (optional)
            </Label>
            <Input
              type="number"
              placeholder="e.g. 250000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Payment Mode (optional)
            </Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isLoanStep && (
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Bank Name (optional)
            </Label>
            <Input
              placeholder="e.g. SBI"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Loan Amount (optional)
            </Label>
            <Input
              type="number"
              placeholder="e.g. 3500000"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Sanction Date (optional)
            </Label>
            <Input
              type="date"
              value={sanctionDate}
              onChange={(e) => setSanctionDate(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}

      {isRegistrationStep && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Registration No. (optional)
            </Label>
            <Input
              placeholder="e.g. REG-2026-XXXX"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Registration Date (optional)
            </Label>
            <Input
              type="date"
              value={registrationDate}
              onChange={(e) => setRegistrationDate(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}

      {isDisbursementStep && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Amount (optional)
            </Label>
            <Input
              type="number"
              placeholder="e.g. 3500000"
              value={disbursementAmount}
              onChange={(e) => setDisbursementAmount(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">
              Date (optional)
            </Label>
            <Input
              type="date"
              value={disbursementDate}
              onChange={(e) => setDisbursementDate(e.target.value)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}

      {/* Document upload — available on ALL steps */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label className="text-[10px] text-muted-foreground">
            Documents (optional)
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 text-[10px] gap-1 px-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className="size-3 animate-spin"
                />
                Uploading...
              </>
            ) : (
              <>
                <HugeiconsIcon
                  icon={FileUploadIcon}
                  strokeWidth={2}
                  className="size-3"
                />
                Upload
              </>
            )}
          </Button>
        </div>

        {/* Uploaded documents list */}
        {docs.length > 0 && (
          <div className="space-y-1">
            {docs.map((doc) => (
              <div
                key={doc.storageId}
                className="flex items-center gap-2 text-[10px] bg-muted/50 px-2 py-1"
              >
                <a
                  href={doc.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate flex-1"
                >
                  {doc.fileName}
                </a>
                <button
                  onClick={() => handleRemoveDocument(doc.storageId)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    strokeWidth={2}
                    className="size-3"
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remark */}
      <Textarea
        placeholder="Add a remark (optional)"
        value={remark}
        onChange={(e) => setRemark(e.target.value)}
        rows={2}
        className="text-xs min-h-[2rem] max-h-[4rem] resize-none"
      />

      {/* Complete button with confirmation */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" className="w-full" disabled={loading}>
            {loading ? "Completing..." : "Complete Step"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete &ldquo;{stepLabel}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {nextStepLabel
                ? `This will advance the process to "${nextStepLabel}".`
                : "This will mark the after-sales process as completed and the lead will move to Closed Won."}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={loading}>
              {loading ? "Completing..." : "Complete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
