"use client"

import { use, useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
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

export default function AdminDsmLedgerPage({
  params,
}: {
  params: Promise<{ dsmUserId: string }>
}) {
  const { dsmUserId } = use(params)
  const router = useRouter()
  const dsmId = dsmUserId as Id<"users">

  const summary = useQuery(api.dsmCommissions.getSummary, { dsmUserId: dsmId })
  const entries = useQuery(api.dsmCommissions.getByDsm, { dsmUserId: dsmId })
  const bankDetails = useQuery(api.dsmCommissions.getBankDetails, { dsmUserId: dsmId })

  const recordPayment = useMutation(api.dsmCommissions.recordPayment)
  const recordManualCredit = useMutation(api.dsmCommissions.recordManualCredit)
  const voidEntry = useMutation(api.dsmCommissions.voidEntry)

  // Payment dialog
  const [payDialog, setPayDialog] = useState(false)
  const [payAmount, setPayAmount] = useState("")
  const [payDesc, setPayDesc] = useState("")
  const [paySubmitting, setPaySubmitting] = useState(false)

  // Credit dialog
  const [creditDialog, setCreditDialog] = useState(false)
  const [creditAmount, setCreditAmount] = useState("")
  const [creditDesc, setCreditDesc] = useState("")
  const [creditSubmitting, setCreditSubmitting] = useState(false)

  // Void dialog
  const [voidDialog, setVoidDialog] = useState<Id<"dsmCommissionEntries"> | null>(null)
  const [voidReason, setVoidReason] = useState("")
  const [voidSubmitting, setVoidSubmitting] = useState(false)

  // Get DSM name from balances data
  const dsmUser = useQuery(api.dsmCommissions.getAllDsmBalances)
  const dsm = dsmUser?.find((d) => d._id === dsmId)
  const dsmName = dsm?.name ?? "DSM"

  async function handlePay() {
    const amount = parseFloat(payAmount)
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return }
    if (!payDesc.trim()) { toast.error("Description is required"); return }
    setPaySubmitting(true)
    try {
      await recordPayment({ dsmUserId: dsmId, amount, description: payDesc.trim() })
      toast.success("Payment recorded")
      setPayDialog(false)
      setPayAmount("")
      setPayDesc("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setPaySubmitting(false)
    }
  }

  async function handleCredit() {
    const amount = parseFloat(creditAmount)
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return }
    if (!creditDesc.trim()) { toast.error("Description is required"); return }
    setCreditSubmitting(true)
    try {
      await recordManualCredit({ dsmUserId: dsmId, amount, description: creditDesc.trim() })
      toast.success("Manual credit added")
      setCreditDialog(false)
      setCreditAmount("")
      setCreditDesc("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setCreditSubmitting(false)
    }
  }

  async function handleVoid() {
    if (!voidDialog) return
    if (!voidReason.trim()) { toast.error("Reason is required"); return }
    setVoidSubmitting(true)
    try {
      await voidEntry({ entryId: voidDialog, reason: voidReason.trim() })
      toast.success("Entry voided")
      setVoidDialog(null)
      setVoidReason("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    } finally {
      setVoidSubmitting(false)
    }
  }

  // Compute running balance
  let runningBalance = 0
  const entriesWithBalance = entries
    ? [...entries]
        .reverse()
        .map((entry) => {
          if (!entry.isVoided) {
            if (entry.type === "credit") runningBalance += entry.amount
            else runningBalance -= entry.amount
          }
          return { ...entry, runningBalance }
        })
        .reverse()
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => router.push("/admin/commissions")}>
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        </Button>
        <h1 className="font-sans text-lg font-semibold">{dsmName} — Commission Ledger</h1>
      </div>

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
            <p className="text-xs text-muted-foreground">Total Paid</p>
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

      {/* Bank Details (read-only for admin) */}
      {bankDetails && (bankDetails.bankName || bankDetails.bankAccountNumber) && (
        <Card>
          <CardHeader>
            <CardTitle className="font-sans text-base">Bank Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Holder</p>
                <p className="font-medium">{bankDetails.bankAccountHolderName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Bank</p>
                <p className="font-medium">{bankDetails.bankName || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Account</p>
                <p className="font-mono">{bankDetails.bankAccountNumber || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">IFSC</p>
                <p className="font-mono">{bankDetails.bankIfscCode || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={() => setPayDialog(true)}>Record Payment</Button>
        <Button variant="outline" onClick={() => setCreditDialog(true)}>
          Add Manual Credit
        </Button>
      </div>

      {/* Ledger Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {entriesWithBalance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
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
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entriesWithBalance.map((entry) => (
                    <tr
                      key={entry._id}
                      className={`border-b last:border-0 ${entry.isVoided ? "opacity-40" : ""}`}
                    >
                      <td className="py-2 font-mono text-xs">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="py-2">
                        <span className={entry.isVoided ? "line-through" : ""}>
                          {entry.description}
                        </span>
                        {entry.isAutoGenerated && (
                          <Badge variant="secondary" className="ml-1.5 text-[10px]">
                            Auto
                          </Badge>
                        )}
                        {entry.isVoided && (
                          <Badge variant="outline" className="ml-1.5 text-[10px]">
                            Voided
                          </Badge>
                        )}
                        {entry.isVoided && entry.voidReason && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Reason: {entry.voidReason}
                          </p>
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
                      <td className="py-2 text-right">
                        {!entry.isVoided && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground"
                            onClick={() => setVoidDialog(entry._id)}
                          >
                            Void
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Record Payment Dialog */}
      <Dialog open={payDialog} onOpenChange={setPayDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans">Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount (INR)</Label>
              <Input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Enter amount"
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={payDesc}
                onChange={(e) => setPayDesc(e.target.value)}
                placeholder="e.g. Bank transfer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(false)}>Cancel</Button>
            <Button onClick={handlePay} disabled={paySubmitting}>
              {paySubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Credit Dialog */}
      <Dialog open={creditDialog} onOpenChange={setCreditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans">Add Manual Credit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount (INR)</Label>
              <Input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Enter amount"
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={creditDesc}
                onChange={(e) => setCreditDesc(e.target.value)}
                placeholder="e.g. Bonus, adjustment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialog(false)}>Cancel</Button>
            <Button onClick={handleCredit} disabled={creditSubmitting}>
              {creditSubmitting ? "Adding..." : "Add Credit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <Dialog open={!!voidDialog} onOpenChange={(open) => !open && setVoidDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans">Void Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will void the entry. The amount will no longer count toward the balance.
            </p>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Why is this entry being voided?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleVoid} disabled={voidSubmitting}>
              {voidSubmitting ? "Voiding..." : "Void Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
