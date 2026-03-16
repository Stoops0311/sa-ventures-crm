"use client"

import { useState, useEffect } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { USER_ROLES } from "@/lib/constants"

interface UserData {
  _id: string
  name: string
  email?: string
  phone?: string
  role: string
}

interface UserDialogProps {
  user?: UserData
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserDialog({ user, open, onOpenChange }: UserDialogProps) {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("salesperson")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateUser = useMutation(api.users.updateUser)

  // Pre-fill for edit mode
  useEffect(() => {
    if (user) {
      setName(user.name)
      setPhone(user.phone ?? "")
      setRole(user.role)
    } else {
      setName("")
      setPhone("")
      setRole("salesperson")
    }
  }, [user])

  const canSubmit = name.trim() !== ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !user) return

    setIsSubmitting(true)
    try {
      await updateUser({
        userId: user._id as Id<"users">,
        name: name.trim(),
        phone: phone.trim() || undefined,
        role,
      })
      toast.success("User updated successfully")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">
            {user ? "Edit User" : "User Details"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="user-name">Name *</Label>
            <Input
              id="user-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          {user?.email && (
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user.email} disabled />
              <p className="text-[10px] text-muted-foreground">
                Email is managed through Clerk and cannot be changed here.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="user-phone">Phone</Label>
            <Input
              id="user-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
