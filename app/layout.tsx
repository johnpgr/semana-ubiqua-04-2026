import { Space_Grotesk } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { OpenCredAiWidget } from "@/components/opencred-ai-widget"
import { cn } from "@/lib/utils"

import "./globals.css"
import { Providers } from "./providers"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        spaceGrotesk.variable,
        "font-sans",
        spaceGrotesk.variable
      )}
    >
      <body className="min-h-svh bg-background text-foreground">
        <Providers>
          {children}
          <OpenCredAiWidget />
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
