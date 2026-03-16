import { AppShell } from "@/components/layout/app-shell"

export default function DSMLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell role="dsm">{children}</AppShell>
}
