import { AppShell } from "@/components/layout/app-shell"

export default function ReceptionistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell role="receptionist">{children}</AppShell>
}
