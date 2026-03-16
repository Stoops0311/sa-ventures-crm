import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden bg-primary py-20">
      {/* Geometric accents */}
      <div className="absolute -left-10 -top-10 h-40 w-40 rotate-12 bg-white/5" />
      <div className="absolute -bottom-8 -right-8 h-32 w-32 -rotate-6 bg-white/5" />
      <div className="absolute right-[20%] top-[20%] h-px w-48 rotate-45 bg-white/10" />

      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to Find Your Dream Home?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
          Get in touch with our team for expert guidance on premium residential
          properties across Navi Mumbai.
        </p>
        <div className="mt-8">
          <Button
            asChild
            size="lg"
            className="!bg-white px-8 text-base font-semibold !text-primary hover:!bg-white/90 hover:!text-primary"
          >
            <Link href="/contact">Contact Us Today</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
