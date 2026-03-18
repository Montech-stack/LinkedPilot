"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X } from "lucide-react"
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
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const openSignIn = () => {
    setAuthMode("login")
    setAuthOpen(true)
  }

  const openSignUp = () => {
    setAuthMode("signup")
    setAuthOpen(true)
  }

  const navLinks = [
    { name: "Features", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
  ]

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border/60 py-3"
          : "bg-transparent py-5"
      }`}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 overflow-hidden flex-shrink-0">
              <img src="/maxis.png" alt="Maxis" className="w-full h-full object-contain" />
            </div>
            <span className="font-display font-bold text-base text-foreground tracking-tight">
              Maxis
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {session ? (
              <>
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground h-9 px-4"
                  >
                    Go to Studio
                  </Button>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openSignIn}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
                >
                  Log in
                </button>
                <Button
                  onClick={openSignUp}
                  size="sm"
                  className="h-9 px-5 rounded-md bg-foreground text-background hover:bg-foreground/90 text-sm font-semibold transition-all duration-150"
                >
                  Start free
                </Button>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="flex flex-col p-5 gap-1">
                {navLinks.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="py-3 px-3 text-sm font-medium text-muted-foreground hover:text-foreground rounded transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </a>
                ))}

                <div className="h-px bg-border my-3" />

                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-sm text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>

                <div className="h-px bg-border my-1" />

                {session ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                      <Button className="w-full rounded-md" size="sm">
                        Go to Studio
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full rounded-md"
                      onClick={() => { signOut(); setIsOpen(false); }}
                    >
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full rounded-md"
                      onClick={() => { openSignIn(); setIsOpen(false); }}
                    >
                      Log in
                    </Button>
                    <Button
                      size="sm"
                      className="w-full rounded-md bg-foreground text-background hover:bg-foreground/90"
                      onClick={() => { openSignUp(); setIsOpen(false); }}
                    >
                      Start free
                    </Button>
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
