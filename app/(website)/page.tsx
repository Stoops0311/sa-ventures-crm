"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

// Original homepage sections — kept for when RERA license is obtained:
// import { HeroSection } from "@/components/website/hero-section"
// import { FeaturedProjects } from "@/components/website/featured-projects"
// import { LocationsSection } from "@/components/website/locations-section"
// import { WhyChooseUs } from "@/components/website/why-choose-us"
// import { LatestArticles } from "@/components/website/latest-articles"
// import { CtaBanner } from "@/components/website/cta-banner"

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">
          SA Ventures
        </h1>
        <p className="text-lg text-muted-foreground">
          Premium residential properties in Navi Mumbai.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 border bg-muted/30 text-sm font-medium text-muted-foreground">
          Coming Soon
        </div>
        <p className="text-sm text-muted-foreground max-w-xs">
          Our website is under construction. Existing users can sign in to access the CRM.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/sign-in">Sign In</Link>
        </Button>
      </div>
    </div>
  )
}
