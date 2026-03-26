"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function DSMCommissionsPage() {
  const { user } = useCurrentUser()
  const userId = user?._id as Id<"users"> | undefined

  const summary = useQuery(
    api.dsmCommissions.getSummary,
    userId ? { dsmUserId: userId } : "skip"
  )
  const entries = useQuery(
    api.dsmCommissions.getByDsm,
    userId ? { dsmUserId: userId } : "skip"
  )
  const bankDetails = useQuery(
    api.dsmCommissions.getBankDetails,
    userId ? { dsmUserId: userId } : "skip"
  )

  const updateBankDetails = useMutation(api.dsmCommissions.updateBankDetails)

  const [bankName, setBankName] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [ifscCode, setIfscCode] = useState("")
  const [holderName, setHolderName] = useState("")
  const [bankEditing, setBankEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize bank form when data loads
  const bankLoaded = bankDetails !== undefined
  if (bankLoaded && !bankEditing && bankName === "" && bankDetails) {
    setBankName(bankDetails.bankName ?? "")
    setAccountNumber(bankDetails.bankAccountNumber ?? "")
    setIfscCode(bankDetails.bankIfscCode ?? "")
    setHolderName(bankDetails.bankAccountHolderName ?? "")
  }

  async function handleSaveBankDetails() {
    setIsSaving(true)
    try {
      await updateBankDetails({
        bankName: bankName || undefined,
        bankAccountNumber: accountNumber || undefined,
        bankIfscCode: ifscCode || undefined,
        bankAccountHolderName: holderName || undefined,
      })
      toast.success("Bank details updated")
      setBankEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update bank details")
    } finally {
      setIsSaving(false)
    }
  }

  // Compute running balance for ledger table
  let runningBalance = 0
  const entriesWithBalance = entries
    ? [...entries]
        .reverse()
        .map((entry) => {
          if (!entry.isVoided) {
            if (entry.type === "credit") {
              runningBalance += entry.amount
            } else {
              runningBalance -= entry.amount
            }
          }
          return { ...entry, runningBalance }
        })
        .reverse()
    : []

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="font-sans text-lg font-semibold">My Commissions</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Earned</p>
            <p className="text-xl font-semibold font-mono text-green-600">
              {summary ? formatINR(summary.totalCredits) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Received</p>
            <p className="text-xl font-semibold font-mono">
              {summary ? formatINR(summary.totalDebits) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-xl font-semibold font-mono text-primary">
              {summary ? formatINR(summary.balance) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {entriesWithBalance.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No commission entries yet. Submit leads and close deals to earn commissions.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium text-right">Credit</th>
                    <th className="pb-2 font-medium text-right">Debit</th>
                    <th className="pb-2 font-medium text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {entriesWithBalance.map((entry) => (
                    <tr
                      key={entry._id}
                      className={`border-b last:border-0 ${entry.isVoided ? "opacity-40 line-through" : ""}`}
                    >
                      <td className="py-2 font-mono text-xs">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="py-2">
                        {entry.description}
                        {entry.isVoided && (
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            Voided
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 text-right font-mono text-green-600">
                        {entry.type === "credit" ? formatINR(entry.amount) : ""}
                      </td>
                      <td className="py-2 text-right font-mono text-red-600">
                        {entry.type === "debit" ? formatINR(entry.amount) : ""}
                      </td>
                      <td className="py-2 text-right font-mono font-medium">
                        {formatINR(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-sans text-base">Bank Details</CardTitle>
          {!bankEditing && bankLoaded && (
            <Button variant="outline" size="sm" onClick={() => setBankEditing(true)}>
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!bankLoaded ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : bankEditing || (!bankDetails?.bankName && !bankDetails?.bankAccountNumber) ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Account Holder Name</Label>
                  <Input
                    value={holderName}
                    onChange={(e) => { setHolderName(e.target.value); setBankEditing(true) }}
                    placeholder="Full name as on bank account"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input
                    value={bankName}
                    onChange={(e) => { setBankName(e.target.value); setBankEditing(true) }}
                    placeholder="e.g. State Bank of India"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Number</Label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => { setAccountNumber(e.target.value); setBankEditing(true) }}
                    placeholder="Account number"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>IFSC Code</Label>
                  <Input
                    value={ifscCode}
                    onChange={(e) => { setIfscCode(e.target.value); setBankEditing(true) }}
                    placeholder="e.g. SBIN0001234"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveBankDetails} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Bank Details"}
                </Button>
                {bankEditing && bankDetails?.bankName && (
                  <Button variant="outline" onClick={() => {
                    setBankEditing(false)
                    setBankName(bankDetails.bankName ?? "")
                    setAccountNumber(bankDetails.bankAccountNumber ?? "")
                    setIfscCode(bankDetails.bankIfscCode ?? "")
                    setHolderName(bankDetails.bankAccountHolderName ?? "")
                  }}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Account Holder</p>
                <p className="font-medium">{bankDetails.bankAccountHolderName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Bank</p>
                <p className="font-medium">{bankDetails.bankName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Account Number</p>
                <p className="font-mono">{bankDetails.bankAccountNumber || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">IFSC Code</p>
                <p className="font-mono">{bankDetails.bankIfscCode || "—"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
