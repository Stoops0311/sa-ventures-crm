import { AppShell } from "@/components/layout/app-shell"

export default function VehicleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell role="vehicle">{children}</AppShell>
}
