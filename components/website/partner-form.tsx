"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function PartnerForm() {
  const submitPartnerInquiry = useMutation(api.publicSite.submitPartnerInquiry)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name.trim() || !phone.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.")
      return
    }

    setSubmitting(true)
    try {
      await submitPartnerInquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: message.trim(),
      })
      toast.success(
        "Thank you! Your request has been submitted. Our team will review it and get back to you."
      )
      setName("")
      setPhone("")
      setEmail("")
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
        <Label htmlFor="partner-name">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="partner-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="partner-phone">
          Phone <span className="text-destructive">*</span>
        </Label>
        <Input
          id="partner-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 XXXXX XXXXX"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="partner-email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="partner-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="partner-message">
          Why do you want to become a Channel Partner?{" "}
          <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="partner-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your experience in real estate, your network, and why you'd like to partner with SA Ventures..."
          rows={5}
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  )
}
