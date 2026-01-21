"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, User, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AuthModal } from "@/components/auth-modal"
import { useSession, signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [scrolled, setScrolled] = useState(false)

  const { data: session } = useSession()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const openSignIn = () => {
    setAuthMode("login")
    setAuthOpen(true)
  }
  const openTryMaxis = () => {
    setAuthMode("signup")
    setAuthOpen(true)
  }

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
  ]

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/80 backdrop-blur-md border-b border-border py-3" : "bg-transparent py-5"
        }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-white/10 transition-all">
              <img src="/maxis.png" alt="Maxis Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">Maxis</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* CTA / User */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {session ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Go to Studio</Button>
                </Link>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-800 flex items-center justify-center border border-white/10">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={openSignIn}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Log in
                </button>
                <Button
                  onClick={openTryMaxis}
                  className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5 py-2 h-auto text-sm font-semibold shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all"
                >
                  Start Free
                </Button>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden absolute top-full left-0 right-0 bg-[#050505] border-b border-white/10 p-4 shadow-2xl"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-300 hover:text-white py-2 block"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}

                <div className="h-px bg-white/10 my-2" />

                <div className="flex items-center justify-between px-2">
                  <span className="text-sm text-gray-400">Theme</span>
                  <ThemeToggle />
                </div>

                {session ? (
                  <div className="flex flex-col gap-3">
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">Dashboard</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => signOut()}>Sign Out</Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button variant="ghost" onClick={() => { openSignIn(); setIsOpen(false); }}>Log in</Button>
                    <Button onClick={() => { openTryMaxis(); setIsOpen(false); }}>Start Free</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} />
    </motion.nav>
  )
}
