"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

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
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-br from-[#0b0b0c] via-[#0d1118] to-[#0d1b2a]/95 backdrop-blur-lg border-b border-[#1f2330] shadow-lg"
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
              width={75}
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

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/signin">
              <Button
                variant="ghost"
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-[#00b4ff] to-[#ffb347] text-white shadow-md hover:opacity-90 transition">
                Get Started
              </Button>
            </Link>
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
                <Link href="/auth/signin" className="block">
                  <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
                <Link href="/dashboard" className="block">
                  <Button className="w-full bg-gradient-to-r from-[#00b4ff] to-[#ffb347] text-white hover:opacity-90">
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
