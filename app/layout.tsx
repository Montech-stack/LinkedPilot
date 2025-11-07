import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast";
import AuthSessionProvider from "@/components/SessionProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LinkedPilot - AI LinkedIn Content Generator",
  description: "Create professional LinkedIn content in minutes with AI-powered post generation",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
        <Toaster  />
      </body>
    </html>
  )
}
