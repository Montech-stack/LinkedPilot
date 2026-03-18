import type React from "react";
import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Providers from "@/components/providers";
import CommandBar from "@/components/CommandBar";
import ClientOnly from "@/components/ClientOnly";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Maxis — Social Media for Professionals",
  description: "Write in your voice. Post on every platform. Track what works.",
  icons: {
    icon: [
      {
        url: "/maxis.png",
        type: "image/svg+xml",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`min-h-screen font-sans antialiased ${inter.variable} ${bricolage.variable}`}>
        <Providers>
          {children}
          <ClientOnly>
            <CommandBar />
          </ClientOnly>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
