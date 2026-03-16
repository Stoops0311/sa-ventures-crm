import { HugeiconsIcon } from "@hugeicons/react"
import {
  Shield01Icon,
  Home01Icon,
  UserCheck01Icon,
  MoneyBag02Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

const features: {
  icon: IconSvgElement
  title: string
  description: string
}[] = [
  {
    icon: Shield01Icon,
    title: "Trusted by Families",
    description:
      "Over 500 families have found their perfect home through SA Ventures. Our reputation is built on trust and transparency.",
  },
  {
    icon: Home01Icon,
    title: "Premium Properties",
    description:
      "We curate only the finest residential projects from reputed developers, ensuring quality construction and timely possession.",
  },
  {
    icon: UserCheck01Icon,
    title: "End-to-End Support",
    description:
      "From your first site visit to key handover, our dedicated team guides you through every step of your home buying journey.",
  },
  {
    icon: MoneyBag02Icon,
    title: "Transparent Dealings",
    description:
      "No hidden costs, no surprises. We provide complete price transparency and help you make informed investment decisions.",
  },
]

export function WhyChooseUs() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why Choose SA Ventures
          </h2>
          <p className="mt-3 text-muted-foreground">
            Your reliable partner in finding the perfect home
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title} className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center bg-primary/5">
                <HugeiconsIcon
                  icon={feature.icon}
                  size={28}
                  className="text-primary"
                />
              </div>
              <h3 className="mt-5 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
