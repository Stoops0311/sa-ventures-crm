"use client"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { getInquiryStatusStyle, getInquiryTypeStyle } from "@/lib/constants"
import { toast } from "sonner"
import { useState } from "react"

interface InquiriesTableProps {
  statusFilter?: string
  typeFilter?: string
}

export function InquiriesTable({ statusFilter, typeFilter }: InquiriesTableProps) {
  const inquiries = useQuery(api.websiteInquiries.list, {
    status: statusFilter,
    type: typeFilter,
  })
  const updateStatus = useMutation(api.websiteInquiries.updateStatus)
  const [selectedInquiry, setSelectedInquiry] = useState<
    (typeof inquiries extends (infer T)[] | undefined ? T : never) | null
  >(null)

  const handleStatusUpdate = async (
    inquiryId: Id<"websiteInquiries">,
    status: string
  ) => {
    try {
      await updateStatus({ inquiryId, status })
      toast.success(`Inquiry marked as ${status}`)
      setSelectedInquiry(null)
    } catch {
      toast.error("Failed to update status")
    }
  }

  if (inquiries === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (inquiries.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No inquiries found.
      </div>
    )
  }

  return (
    <>
      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.map((inquiry) => {
              const statusStyle = getInquiryStatusStyle(inquiry.status)
              const typeStyle = getInquiryTypeStyle(inquiry.type)
              return (
                <TableRow
                  key={inquiry._id}
                  className="cursor-pointer"
                  onClick={() => setSelectedInquiry(inquiry)}
                >
                  <TableCell className="font-medium">{inquiry.name}</TableCell>
                  <TableCell>
                    <a
                      href={`tel:${inquiry.phone}`}
                      className="text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {inquiry.phone}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                    >
                      {typeStyle.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inquiry.projectName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {statusStyle.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(inquiry.createdAt).toLocaleDateString("en-IN")}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <Sheet
        open={!!selectedInquiry}
        onOpenChange={(open) => !open && setSelectedInquiry(null)}
      >
        <SheetContent className="w-96">
          <SheetHeader>
            <SheetTitle>Inquiry Details</SheetTitle>
          </SheetHeader>
          {selectedInquiry && (
            <div className="mt-6 space-y-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Type
                </p>
                <div className="mt-1">
                  {(() => {
                    const ts = getInquiryTypeStyle(selectedInquiry.type)
                    return (
                      <Badge
                        variant="outline"
                        className={`${ts.bg} ${ts.text} ${ts.border}`}
                      >
                        {ts.label}
                      </Badge>
                    )
                  })()}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Name
                </p>
                <p className="mt-1 font-medium">{selectedInquiry.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Phone
                </p>
                <a
                  href={`tel:${selectedInquiry.phone}`}
                  className="mt-1 block font-medium text-primary hover:underline"
                >
                  {selectedInquiry.phone}
                </a>
              </div>
              {selectedInquiry.email && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Email
                  </p>
                  <p className="mt-1">{selectedInquiry.email}</p>
                </div>
              )}
              {selectedInquiry.projectName && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Project Interest
                  </p>
                  <p className="mt-1 font-medium">
                    {selectedInquiry.projectName}
                  </p>
                </div>
              )}
              {selectedInquiry.message && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Message
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedInquiry.message}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Submitted
                </p>
                <p className="mt-1 text-sm">
                  {new Date(selectedInquiry.createdAt).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Update Status
                </p>
                <div className="flex gap-2">
                  {selectedInquiry.status !== "contacted" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleStatusUpdate(
                          selectedInquiry._id,
                          "contacted"
                        )
                      }
                    >
                      Mark Contacted
                    </Button>
                  )}
                  {selectedInquiry.status !== "closed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleStatusUpdate(selectedInquiry._id, "closed")
                      }
                    >
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
