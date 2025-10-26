import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { QueryProvider } from "@/providers/query-provider"
import { ThemeProvider } from "@/providers/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Yin Pwint Mel - Let's Open Up",
    template: "%s | Yin Pwint Mel",
  },
  description:
    "Yin Pwint Mel (Let's Open Up) - A space for authentic voices and meaningful stories. Share your thoughts, discover perspectives, and connect through the power of words.",
  keywords: [
    "blog",
    "writing",
    "stories",
    "community",
    "authentic voices",
    "personal narratives",
    "open dialogue",
  ],
  authors: [{ name: "Yin Pwint Mel Community" }],
  creator: "Yin Pwint Mel",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://yinpwintmel.com",
    title: "Yin Pwint Mel - Let's Open Up",
    description:
      "A space for authentic voices and meaningful stories. Share your thoughts, discover perspectives, and connect through the power of words.",
    siteName: "Yin Pwint Mel",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yin Pwint Mel - Let's Open Up",
    description:
      "A space for authentic voices and meaningful stories. Share your thoughts, discover perspectives, and connect through the power of words.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <QueryProvider>{children}</QueryProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
