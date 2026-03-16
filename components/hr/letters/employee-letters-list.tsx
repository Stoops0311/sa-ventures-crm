"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download04Icon, Delete02Icon, File01Icon } from "@hugeicons/core-free-icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getLetterTypeStyle } from "@/lib/constants"
import { getRelativeTime } from "@/lib/date-utils"
import { format } from "date-fns"

interface EmployeeLettersListProps {
  userId: Id<"users">
  isHROrAdmin: boolean
  onGenerateLetter?: () => void
  onUploadDocument?: () => void
}

export function EmployeeLettersList({
  userId,
  isHROrAdmin,
  onGenerateLetter,
}: EmployeeLettersListProps) {
  const letters = useQuery(api.employeeLetters.listByUser, { userId })
  const removeLetter = useMutation(api.employeeLetters.remove)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<"employeeLetters">
    title: string
  } | null>(null)

  if (letters === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (letters.length === 0) {
    return (
      <EmptyState
        icon={File01Icon}
        title={isHROrAdmin ? "No letters on file" : "No letters yet"}
        description={
          isHROrAdmin
            ? "Generate a letter from a template or upload an existing document."
            : "Letters issued by HR will appear here. You can download them anytime."
        }
        action={
          isHROrAdmin && onGenerateLetter
            ? { label: "Generate Letter", onClick: onGenerateLetter }
            : undefined
        }
        className="py-8"
      />
    )
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await removeLetter({ letterId: deleteTarget.id })
      toast.success("Letter deleted.")
    } catch {
      toast.error("Couldn't delete letter. Please try again.")
    }
    setDeleteTarget(null)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="w-[120px]">Type</TableHead>
            {isHROrAdmin && (
              <TableHead className="w-[100px]">Source</TableHead>
            )}
            <TableHead className="w-[100px]">Date</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {letters.map((letter) => {
            const typeStyle = letter.templateType
              ? getLetterTypeStyle(letter.templateType)
              : null

            return (
              <TableRow key={letter._id}>
                <TableCell className="font-medium">{letter.title}</TableCell>
                <TableCell>
                  {typeStyle ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] font-mono border",
                        typeStyle.bg,
                        typeStyle.text,
                        typeStyle.border
                      )}
                    >
                      {typeStyle.label}
                    </Badge>
                  ) : isHROrAdmin ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-mono border bg-gray-100 text-gray-600 border-gray-200"
                    >
                      Document
                    </Badge>
                  )}
                </TableCell>
                {isHROrAdmin && (
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] font-mono border",
                        letter.isGenerated
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      )}
                    >
                      {letter.isGenerated ? "Generated" : "Uploaded"}
                    </Badge>
                  </TableCell>
                )}
                <TableCell className="text-xs text-muted-foreground">
                  <span title={getRelativeTime(letter.createdAt)}>
                    {format(new Date(letter.createdAt), "d MMM yyyy")}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {letter.url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        asChild
                      >
                        <a
                          href={letter.url}
                          download={letter.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <HugeiconsIcon
                            icon={Download04Icon}
                            className="size-4"
                          />
                        </a>
                      </Button>
                    )}
                    {isHROrAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setDeleteTarget({
                            id: letter._id,
                            title: letter.title,
                          })
                        }
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          className="size-4"
                        />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this letter and its PDF file. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
