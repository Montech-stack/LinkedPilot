"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "FAQ", href: "#faq" },
  ]

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0a0b0f]/95 via-[#1a1d29]/95 to-[#0a0b0f]/95 backdrop-blur-md border-b border-[#1a1d29]"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg">
              LP
            </div>
            <span className="font-bold text-white text-lg gradient-text">LinkedPilot</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-white transition-colors duration-200 relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] transition-all duration-300 group-hover:w-full"></span>
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white shadow-lg glow-button">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
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

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            className="md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-2 pt-1 pb-2 space-y-1 gradient-card rounded-lg mt-2 border border-[#2d3748]">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <Link href="/auth/signin" className="block">
                  <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
                <Link href="/dashboard" className="block">
                  <Button className="w-full bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
