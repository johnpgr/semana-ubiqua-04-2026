import { Space_Grotesk } from "next/font/google"

import "./globals.css"
import { Providers } from "./providers"
import { cn } from "@/lib/utils"

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
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        spaceGrotesk.variable,
        "font-sans",
        spaceGrotesk.variable
      )}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
