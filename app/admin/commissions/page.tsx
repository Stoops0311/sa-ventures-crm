"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import Link from "next/link"
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
import type { Id } from "@/convex/_generated/dataModel"

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AdminCommissionsPage() {
  const dsmBalances = useQuery(api.dsmCommissions.getAllDsmBalances)

  const [paymentDialog, setPaymentDialog] = useState<{
    dsmUserId: Id<"users">
    dsmName: string
  } | null>(null)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDescription, setPaymentDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const recordPayment = useMutation(api.dsmCommissions.recordPayment)

  async function handleRecordPayment() {
    if (!paymentDialog) return
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (!paymentDescription.trim()) {
      toast.error("Description is required")
      return
    }

    setIsSubmitting(true)
    try {
      await recordPayment({
        dsmUserId: paymentDialog.dsmUserId,
        amount,
        description: paymentDescription.trim(),
      })
      toast.success(`Payment of ${formatINR(amount)} recorded for ${paymentDialog.dsmName}`)
      setPaymentDialog(null)
      setPaymentAmount("")
      setPaymentDescription("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Totals
  const totalOwed = dsmBalances?.reduce((sum, d) => sum + Math.max(0, d.balance), 0) ?? 0
  const totalEarned = dsmBalances?.reduce((sum, d) => sum + d.totalCredits, 0) ?? 0
  const totalPaid = dsmBalances?.reduce((sum, d) => sum + d.totalDebits, 0) ?? 0

  return (
    <div className="space-y-6">
      <h1 className="font-sans text-lg font-semibold">DSM Commissions</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Earned (All DSMs)</p>
            <p className="text-xl font-semibold font-mono text-green-600">
              {formatINR(totalEarned)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-xl font-semibold font-mono">
              {formatINR(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">Total Outstanding</p>
            <p className="text-xl font-semibold font-mono text-primary">
              {formatINR(totalOwed)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* DSM Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-sans text-base">DSM Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {!dsmBalances ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : dsmBalances.length === 0 ? (
            <p className="text-sm text-muted-foreground">No DSM users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">DSM Name</th>
                    <th className="pb-2 font-medium text-right">Earned</th>
                    <th className="pb-2 font-medium text-right">Paid</th>
                    <th className="pb-2 font-medium text-right">Balance</th>
                    <th className="pb-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dsmBalances.map((dsm) => (
                    <tr key={dsm._id} className="border-b last:border-0">
                      <td className="py-2.5">
                        <Link
                          href={`/admin/commissions/${dsm._id}`}
                          className="font-medium hover:underline"
                        >
                          {dsm.name}
                        </Link>
                        {dsm.phone && (
                          <p className="text-xs text-muted-foreground">{dsm.phone}</p>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono text-green-600">
                        {formatINR(dsm.totalCredits)}
                      </td>
                      <td className="py-2.5 text-right font-mono">
                        {formatINR(dsm.totalDebits)}
                      </td>
                      <td className="py-2.5 text-right font-mono font-medium">
                        {dsm.balance > 0 ? (
                          <Badge variant="outline" className="font-mono text-primary border-primary/30">
                            {formatINR(dsm.balance)}
                          </Badge>
                        ) : dsm.balance < 0 ? (
                          <Badge variant="outline" className="font-mono text-red-600 border-red-200">
                            {formatINR(dsm.balance)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">{formatINR(0)}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setPaymentDialog({
                                dsmUserId: dsm._id,
                                dsmName: dsm.name,
                              })
                            }
                          >
                            Pay
                          </Button>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/commissions/${dsm._id}`}>
                              View
                            </Link>
                          </Button>
                        </div>
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
      <Dialog open={!!paymentDialog} onOpenChange={(open) => !open && setPaymentDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans">
              Record Payment — {paymentDialog?.dsmName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Amount (INR)</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                min={1}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={paymentDescription}
                onChange={(e) => setPaymentDescription(e.target.value)}
                placeholder="e.g. Bank transfer on 24 Mar 2026"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={isSubmitting}>
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
