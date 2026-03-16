import type { Metadata } from "next"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Home01Icon,
  UserGroupIcon,
  Shield01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about SA Ventures - your trusted partner for premium residential properties in Navi Mumbai.",
}

const values = [
  {
    icon: Shield01Icon,
    title: "Trust & Transparency",
    description:
      "We believe in honest dealings. Every price, every document, every timeline is shared upfront with our clients.",
  },
  {
    icon: Home01Icon,
    title: "Quality First",
    description:
      "We partner only with established developers who deliver quality construction, modern amenities, and timely possession.",
  },
  {
    icon: UserGroupIcon,
    title: "Client-Centric",
    description:
      "Your needs come first. We listen, understand, and curate options that match your lifestyle, budget, and aspirations.",
  },
  {
    icon: Location01Icon,
    title: "Local Expertise",
    description:
      "With deep roots in Navi Mumbai, we know every locality, every infrastructure project, and every upcoming development.",
  },
]

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-foreground py-24">
        <div className="absolute -right-20 -top-20 h-80 w-80 rotate-12 bg-primary/10" />
        <div className="absolute -bottom-10 -left-10 h-60 w-60 -rotate-6 bg-primary/5" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            About Us
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Building Dreams,
            <br />
            One Home at a Time
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            SA Ventures is a premier real estate advisory firm based in Navi
            Mumbai, dedicated to helping families and investors find their
            perfect residential property.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Our Story
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                SA Ventures was founded with a simple mission: to make the home
                buying experience transparent, stress-free, and rewarding. In a
                market often marred by information asymmetry and opaque
                practices, we set out to be the trusted bridge between
                homebuyers and premium residential projects.
              </p>
              <p>
                Based in Navi Mumbai — one of India&apos;s most thoughtfully
                planned cities — we have built deep relationships with reputed
                developers like Shree Infra and other established names. Our
                team brings together market knowledge, local expertise, and
                genuine care for our clients&apos; needs.
              </p>
              <p>
                From luxury apartments in CBD Belapur to family homes in
                Kharghar and emerging opportunities in Ulwe and Panvel, we cover
                every corner of Navi Mumbai. Our clients don&apos;t just buy a
                property — they make an informed investment decision backed by
                data, transparency, and years of market insight.
              </p>
              <p>
                With the upcoming Navi Mumbai International Airport, new metro
                lines, and world-class infrastructure development, this region
                is set for unprecedented growth. SA Ventures is here to ensure
                you&apos;re part of that story.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              What We Stand For
            </h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="border bg-white p-6">
                <div className="flex h-12 w-12 items-center justify-center bg-primary/5">
                  <HugeiconsIcon
                    icon={v.icon}
                    size={22}
                    className="text-primary"
                  />
                </div>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Our Areas of Operation
            </h2>
            <p className="mt-4 text-muted-foreground">
              We specialize in residential properties across Navi Mumbai&apos;s
              most sought-after localities:
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "CBD Belapur",
                "Kharghar",
                "Panvel",
                "Ulwe",
                "Vashi",
                "Nerul",
                "Seawoods",
                "Airoli",
              ].map((area) => (
                <div
                  key={area}
                  className="flex items-center gap-3 border p-4"
                >
                  <div className="h-2 w-2 bg-primary" />
                  <span className="font-medium">{area}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
