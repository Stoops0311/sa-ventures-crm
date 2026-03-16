"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
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
import { toast } from "sonner"

interface ContactFormProps {
  preselectedProjectId?: Id<"projects">
}

export function ContactForm({ preselectedProjectId }: ContactFormProps) {
  const projects = useQuery(api.publicSite.listActiveProjectsForForm)
  const submitInquiry = useMutation(api.publicSite.submitInquiry)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [projectId, setProjectId] = useState<string>(
    preselectedProjectId ?? ""
  )
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name.trim() || !phone.trim()) {
      toast.error("Please fill in your name and phone number.")
      return
    }

    setSubmitting(true)
    try {
      await submitInquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        projectId: projectId
          ? (projectId as Id<"projects">)
          : undefined,
        message: message.trim() || undefined,
      })
      toast.success(
        "Thank you! Your inquiry has been submitted. We'll get back to you shortly."
      )
      setName("")
      setPhone("")
      setEmail("")
      if (!preselectedProjectId) setProjectId("")
      setMessage("")
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Something went wrong."
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Phone <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 XXXXX XXXXX"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project">Interested In</Label>
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects?.map((p) => (
              <SelectItem key={p._id} value={p._id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what you're looking for..."
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Submitting..." : "Send Inquiry"}
      </Button>
    </form>
  )
}
