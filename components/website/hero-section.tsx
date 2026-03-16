import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-foreground">
      {/* Geometric background */}
      <div className="absolute inset-0">
        {/* Large diagonal shape */}
        <div
          className="absolute -right-20 -top-20 h-[600px] w-[600px] rotate-12 bg-primary/20"
          style={{ clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
        />
        {/* Medium angular shape */}
        <div
          className="absolute -bottom-10 -left-10 h-[400px] w-[500px] -rotate-6 bg-primary/15"
          style={{ clipPath: "polygon(0% 0%, 100% 20%, 80% 100%, 0% 100%)" }}
        />
        {/* Accent lines */}
        <div className="absolute right-[20%] top-[15%] h-px w-40 rotate-45 bg-primary/30" />
        <div className="absolute bottom-[25%] left-[30%] h-px w-60 -rotate-12 bg-primary/20" />
        <div className="absolute right-[35%] top-[60%] h-px w-32 rotate-[30deg] bg-primary/25" />
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Small geometric accents */}
        <div className="absolute right-[15%] top-[30%] h-16 w-16 rotate-45 border border-primary/20" />
        <div className="absolute bottom-[20%] left-[15%] h-10 w-10 rotate-12 border border-primary/15" />
        <div className="absolute right-[40%] top-[20%] h-6 w-6 bg-primary/10" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8 lg:py-44">
        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            SA Ventures Group
          </p>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Premium Residential
            <br />
            <span className="text-primary">Properties</span> in
            <br />
            Navi Mumbai
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/60">
            Discover handpicked 2 &amp; 3 BHK homes in prime locations across
            Navi Mumbai. Expert guidance from site visits to possession.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              asChild
              size="lg"
              className="px-8 text-base font-semibold"
            >
              <Link href="/contact">Get in Touch</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/20 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/projects">View Projects</Link>
            </Button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 flex flex-wrap gap-12 border-t border-white/10 pt-8">
          <div>
            <p className="text-3xl font-bold text-white">500+</p>
            <p className="mt-1 text-sm text-white/50">Happy Families</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">10+</p>
            <p className="mt-1 text-sm text-white/50">Premium Projects</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white">5+</p>
            <p className="mt-1 text-sm text-white/50">Years of Trust</p>
          </div>
        </div>
      </div>
    </section>
  )
}
