"use client"

import { HeroSection } from "@/components/website/hero-section"
import { FeaturedProjects } from "@/components/website/featured-projects"
import { LocationsSection } from "@/components/website/locations-section"
import { WhyChooseUs } from "@/components/website/why-choose-us"
import { LatestArticles } from "@/components/website/latest-articles"
import { CtaBanner } from "@/components/website/cta-banner"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedProjects />
      <LocationsSection />
      <WhyChooseUs />
      <LatestArticles />
      <CtaBanner />
    </>
  )
}
