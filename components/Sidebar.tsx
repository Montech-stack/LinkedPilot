"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Link2, Sparkles, Target, Calendar, CreditCard, Settings, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import ProfileDropdown from "@/components/ProfileDropdown"
import Image from "next/image"

const navigationItems = [
  { icon: Sparkles, label: "Studio", href: "/dashboard" },
  { icon: Link2, label: "Links", href: "/links" },
  { icon: Target, label: "Viral Ideas", href: "/hooks" },
  { icon: Calendar, label: "Schedules", href: "/scheduled" },
  { icon: CreditCard, label: "Billing", href: "/billing" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(isOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
          <motion.aside
            className="fixed left-0 top-0 h-screen w-64 sm:w-72 bg-gradient-to-br from-[#0b0b0c] via-[#0c0f15] to-[#0d1b2a] border-r border-[#1a1d29] shadow-2xl z-50 lg:sticky lg:z-auto"
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#1a1d29]">
              <Image
                src="/Linked Logo.png"
                alt="Linked Logo"
                width={75}
                height={35}
                className="object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 sm:p-6">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        className={`flex items-center gap-3 px-4 py-3 sm:py-4 rounded-xl cursor-pointer transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-[#00b4ff] to-[#ffb347] text-white shadow-md"
                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                        }`}
                        whileHover={{ scale: 1.03, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <item.icon
                          className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:text-[#ffb347]"}`}
                        />
                        <span className="font-medium text-sm sm:text-base">
                          {item.label}
                        </span>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* User */}
            <div className="p-4 sm:p-6 border-t border-[#1a1d29] mt-auto bg-[#0d0e11]/70 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <ProfileDropdown />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">User</div>
                  <div className="text-xs text-gray-400 truncate">user@example.com</div>
                  <div className="text-xs text-[#00b4ff] font-medium">Free Plan</div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[#2d2f3e] text-gray-300 hover:bg-gradient-to-r hover:from-[#00b4ff] hover:to-[#ffb347] hover:text-white transition-all"
              >
                📝 Leave a Review
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
