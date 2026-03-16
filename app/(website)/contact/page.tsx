"use client"

import { ContactForm } from "@/components/website/contact-form"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Location01Icon,
  Call02Icon,
  Message01Icon,
} from "@hugeicons/core-free-icons"

export default function ContactPage() {
  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-3 text-muted-foreground">
            Get in touch with our team for expert property guidance
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            <div className="border bg-white p-8">
              <h2 className="mb-6 text-lg font-semibold">Send us a message</h2>
              <ContactForm />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-8 lg:col-span-2">
            <div className="border bg-white p-8">
              <h2 className="mb-6 text-lg font-semibold">Get in Touch</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/5">
                    <HugeiconsIcon
                      icon={Location01Icon}
                      size={18}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Office</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Navi Mumbai, Maharashtra, India
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/5">
                    <HugeiconsIcon
                      icon={Call02Icon}
                      size={18}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <a
                      href="tel:+919167592831"
                      className="mt-1 block text-sm text-muted-foreground hover:text-primary"
                    >
                      +91 91675 92831
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/5">
                    <HugeiconsIcon
                      icon={Message01Icon}
                      size={18}
                      className="text-primary"
                    />
                  </div>
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <a
                      href="https://wa.me/919167592831"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-sm text-muted-foreground hover:text-primary"
                    >
                      Chat with us
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="border bg-primary/5 p-8">
              <h3 className="font-semibold">Working Hours</h3>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>Monday - Saturday: 10:00 AM - 7:00 PM</p>
                <p>Sunday: By appointment only</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
