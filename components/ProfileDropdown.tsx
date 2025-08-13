"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, CreditCard, LogOut, Crown, User, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const menuItems = [
    { icon: User, label: "Profile", href: "/profile", color: "text-gray-300" },
    { icon: Crown, label: "Upgrade to Pro", href: "/billing", color: "text-yellow-400" },
    { icon: Settings, label: "Settings", href: "/settings", color: "text-gray-300" },
    { icon: CreditCard, label: "Billing", href: "/billing", color: "text-gray-300" },
    { icon: Star, label: "Leave Review", href: "/review", color: "text-blue-400" },
    { icon: LogOut, label: "Logout", href: "/auth/signin", color: "text-red-400" },
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-full flex items-center justify-center font-bold text-white text-sm hover:from-[#004182] hover:to-[#0077B5] shadow-lg"
      >
        M
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute right-0 top-12 w-64 gradient-card border border-[#2d3748] rounded-xl shadow-xl z-50"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* User Info */}
            <div className="p-4 border-b border-[#2d3748]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-full flex items-center justify-center font-bold text-white shadow-lg">
                  M
                </div>
                <div>
                  <div className="font-medium text-white">User</div>
                  <div className="text-sm text-gray-400">user@example.com</div>
                  <div className="text-xs text-[#0077B5] font-medium">Free Plan</div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {menuItems.map((item, index) => (
                <Link key={index} href={item.href}>
                  <motion.div
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className={`w-5 h-5 ${item.color} group-hover:scale-110 transition-transform`} />
                    <span className={`font-medium ${item.color} group-hover:text-white transition-colors`}>
                      {item.label}
                    </span>
                    {item.label === "Upgrade to Pro" && (
                      <span className="ml-auto bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs px-2 py-1 rounded-full font-bold">
                        NEW
                      </span>
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
