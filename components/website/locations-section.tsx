import Link from "next/link"

const locations = [
  { name: "CBD Belapur", description: "Commercial hub of Navi Mumbai" },
  { name: "Kharghar", description: "Green hills and modern living" },
  { name: "Panvel", description: "Gateway to the new airport" },
  { name: "Ulwe", description: "Emerging waterfront destination" },
  { name: "Vashi", description: "The heart of Navi Mumbai" },
  { name: "Nerul", description: "Serene suburban living" },
]

export function LocationsSection() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Explore Navi Mumbai
          </h2>
          <p className="mt-3 text-muted-foreground">
            Premium properties across prime Navi Mumbai localities
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Link
              key={location.name}
              href={`/projects?location=${encodeURIComponent(location.name)}`}
            >
              <div className="group relative overflow-hidden border bg-white p-8 transition-all hover:border-primary/30 hover:shadow-md">
                {/* Accent corner */}
                <div className="absolute right-0 top-0 h-12 w-12 bg-primary/5 transition-all group-hover:h-16 group-hover:w-16 group-hover:bg-primary/10" />

                <h3 className="text-lg font-semibold group-hover:text-primary">
                  {location.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {location.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
