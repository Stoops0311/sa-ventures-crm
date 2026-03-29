import { Geist, JetBrains_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { cn } from "@/lib/utils"

import "./globals.css"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
      appearance={{
        variables: {
          borderRadius: "0px",
          fontFamily:
            "var(--font-sans), var(--font-mono), system-ui, sans-serif",
          fontFamilyButtons:
            "var(--font-sans), var(--font-mono), system-ui, sans-serif",
          colorPrimary: "#c23d22",
          colorBackground: "#ffffff",
          colorForeground: "#1a1a1a",
          colorNeutral: "#6b7280",
          colorDanger: "#dc2626",
        },
        elements: {
          card: {
            boxShadow: "none",
            border: "1px solid #e5e7eb",
            borderRadius: "0px",
          },
          formButtonPrimary: {
            borderRadius: "0px",
            fontWeight: "500",
          },
          formFieldInput: {
            borderRadius: "0px",
          },
          footerActionLink: {
            color: "#c23d22",
          },
        },
      }}
    >
      <html
        lang="en"
        className={cn(
          "antialiased",
          fontSans.variable,
          "font-mono",
          jetbrainsMono.variable
        )}
      >
        <body className="bg-background text-foreground">
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
