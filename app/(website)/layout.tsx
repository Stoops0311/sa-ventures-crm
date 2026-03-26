import type { Metadata } from "next"
import { Navbar } from "@/components/website/navbar"
import { Footer } from "@/components/website/footer"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: {
    default: "SA Ventures - Premium Residential Properties in Navi Mumbai",
    template: "%s | SA Ventures",
  },
  description:
    "Discover premium residential properties in Navi Mumbai. SA Ventures offers expert guidance for 2 & 3 BHK homes in CBD Belapur, Kharghar, Panvel, and more.",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "SA Ventures",
  },
}

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Navbar and Footer hidden until RERA license obtained */}
      {/* <Navbar /> */}
      <main className="min-h-screen">{children}</main>
      {/* <Footer /> */}
      <Toaster position="top-right" />
    </>
  )
}
