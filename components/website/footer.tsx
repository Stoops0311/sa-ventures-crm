import Link from "next/link"

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/projects", label: "Projects" },
  { href: "/articles", label: "Articles" },
  { href: "/contact", label: "Contact Us" },
]

const legalLinks = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
]

export function Footer() {
  return (
    <footer className="border-t bg-foreground text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div>
            <div className="mb-4 flex items-center gap-1">
              <span className="text-xl font-bold tracking-tight text-primary">
                SA
              </span>
              <span className="text-xl font-bold tracking-tight">
                Ventures
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/70">
              Your trusted partner for premium residential properties in Navi
              Mumbai. We help families find their dream homes with transparency
              and expertise.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
              Contact Us
            </h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li>Navi Mumbai, Maharashtra, India</li>
              <li>
                <a
                  href="tel:+919167592831"
                  className="transition-colors hover:text-white"
                >
                  +91 91675 92831
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/919167592831"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Legal + Partner */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white/50">
              Legal
            </h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link
                href="/partner"
                className="inline-block border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                Become a Channel Partner
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-white/40">
          &copy; {new Date().getFullYear()} SA Ventures. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
