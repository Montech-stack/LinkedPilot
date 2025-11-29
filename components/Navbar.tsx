"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import ThemeToggle from "./ThemeToggle"
import { AuthModal } from "@/components/auth-modal"
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")

  const { data: session } = useSession() // <-- NextAuth session

  const openSignIn = () => {
    setAuthMode("login")
    setAuthOpen(true)
  }
  const openTryLinked = () => {
    setAuthMode("signup")
    setAuthOpen(true)
  }

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
  ]

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 app-surface bg-opacity-80 backdrop-blur-lg border-b border-[#1f2330] shadow-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/Linked Logo.png"
              alt="Linked Logo"
              width={55}
              height={35}
              className="object-contain"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white transition relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#00b4ff] to-[#ffb347] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          {/* CTA / User */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            {session ? (
              <div className="flex items-center gap-3">
                <span className="text-gray-2 text-center font-medium hidden sm:inline">
                  {session.user?.name || session.user?.email}
                </span>
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="User Avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-300" />
                )}
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>    </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={openSignIn}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  Sign In
                </Button>
                <Button
                  onClick={openTryLinked}
                  className="bg-gradient-to-r from-[#00b4ff] to-[#ffb347] text-white shadow-md hover:opacity-90 transition"
                >
                  Try Linked
                </Button>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <motion.div
            className="md:hidden mt-2 bg-[#0b0b0c]/95 backdrop-blur-lg border border-[#1a1d29] rounded-lg shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-3 py-3 space-y-2">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}

              <div className="pt-3 space-y-2">
                <ThemeToggle />
                {session ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-gray-200 font-medium">
                      {session.user?.name || session.user?.email}
                    </span>
                    <Button
                      variant="ghost"
                      className="w-full text-gray-300 hover:text-white hover:bg-white/10"
                      onClick={() => signOut()}
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="w-full text-gray-300 hover:text-white hover:bg-white/10"
                      onClick={openSignIn}
                    >
                      Sign In
                    </Button>
                    <Button
                      className="w-full bg-gradient-to-r from-[#00b4ff] to-[#ffb347] text-white hover:opacity-90"
                      onClick={openTryLinked}
                    >
                      Try Linked
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Auth modal */}
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} />
    </motion.nav>
  )
}
