"use client"

import { PartnerForm } from "@/components/website/partner-form"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  MoneyBag02Icon,
  CustomerSupportIcon,
  Award02Icon,
} from "@hugeicons/core-free-icons"

const benefits = [
  {
    icon: MoneyBag02Icon,
    title: "Attractive Commission",
    description:
      "Earn competitive commissions on every successful deal you close with us.",
  },
  {
    icon: CustomerSupportIcon,
    title: "Dedicated Support",
    description:
      "Get a dedicated point of contact and full support from our sales team.",
  },
  {
    icon: UserGroupIcon,
    title: "Expand Your Network",
    description:
      "Access premium Navi Mumbai projects and grow your real estate portfolio.",
  },
  {
    icon: Award02Icon,
    title: "Brand Association",
    description:
      "Partner with a trusted name that families rely on for their dream homes.",
  },
]

export default function PartnerPage() {
  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Become a Channel Partner
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-muted-foreground">
            Join SA Ventures as a channel partner and unlock exclusive access to
            premium residential projects across Navi Mumbai.
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="border bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center bg-primary/5">
                <HugeiconsIcon
                  icon={benefit.icon}
                  size={18}
                  className="text-primary"
                />
              </div>
              <h3 className="mt-4 font-semibold">{benefit.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        {/* Form Section */}
        <div className="mt-16 grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="border bg-white p-8">
              <h2 className="mb-2 text-lg font-semibold">
                Submit Your Interest
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Fill out the form below and our team will review your application
                and get back to you within 2-3 business days.
              </p>
              <PartnerForm />
            </div>
          </div>

          <div className="space-y-8 lg:col-span-2">
            <div className="border bg-white p-8">
              <h2 className="mb-4 text-lg font-semibold">How It Works</h2>
              <ol className="space-y-4 text-sm">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-xs font-bold text-white">
                    1
                  </span>
                  <span className="text-muted-foreground">
                    Submit your interest through the form with your details and
                    experience.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-xs font-bold text-white">
                    2
                  </span>
                  <span className="text-muted-foreground">
                    Our team reviews your application and reaches out to discuss
                    terms.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-xs font-bold text-white">
                    3
                  </span>
                  <span className="text-muted-foreground">
                    Once approved, you receive access to our CRM and project
                    inventory.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary text-xs font-bold text-white">
                    4
                  </span>
                  <span className="text-muted-foreground">
                    Start referring clients and earning commissions on every
                    successful deal.
                  </span>
                </li>
              </ol>
            </div>

            <div className="border bg-primary/5 p-8">
              <h3 className="font-semibold">Have Questions?</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Call us or send a WhatsApp message for immediate assistance.
              </p>
              <div className="mt-4 space-y-2 text-sm">
                <a
                  href="tel:+919167592831"
                  className="block text-muted-foreground hover:text-primary"
                >
                  +91 91675 92831
                </a>
                <a
                  href="https://wa.me/919167592831"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-muted-foreground hover:text-primary"
                >
                  WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
