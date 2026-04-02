import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"
import { Navigation } from "@/components/navigation"

export const metadata: Metadata = {
  title: "Trading Backtest Journal",
  description: "Professional trading backtesting and analytics platform",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon.png",
        type: "image/svg+xml",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased">
        <Providers>
          <div className="min-h-screen bg-background">
            <Navigation />
            <main className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-7xl">{children}</main>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
