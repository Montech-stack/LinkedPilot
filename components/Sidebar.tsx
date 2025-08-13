"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Target, FileText, Calendar, CreditCard, Settings, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import ProfileDropdown from "@/components/ProfileDropdown"

const navigationItems = [
  { icon: Sparkles, label: "Generate", href: "/dashboard" },
  { icon: Target, label: "Hooks", href: "/hooks" },
  { icon: FileText, label: "Posts", href: "/posts" },
  { icon: Calendar, label: "Scheduled", href: "/scheduled" },
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
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || (typeof window !== "undefined" && window.innerWidth >= 1024)) && (
          <motion.aside
            className="fixed left-0 top-0 h-screen w-64 sm:w-72 gradient-bg z-50 lg:sticky lg:z-auto border-r border-[#1a1d29] shadow-2xl"
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#374151]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg">
                  LP
                </div>
                <span className="font-bold text-white gradient-text text-lg">LinkedPilot</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden text-gray-400 hover:text-white hover:bg-white/10 w-10 h-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 sm:p-6">
              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        className={`flex items-center gap-3 px-4 py-3 sm:py-4 rounded-xl transition-all cursor-pointer group ${
                          isActive
                            ? "bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg"
                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                        }`}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <item.icon
                          className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:text-[#0077B5]"} transition-colors`}
                        />
                        <span className="font-medium text-sm sm:text-base">{item.label}</span>
                        {isActive && (
                          <motion.div
                            className="ml-auto w-2 h-2 bg-white rounded-full"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </nav>

            {/* User Section */}
            <div className="p-4 sm:p-6 border-t border-[#374151] mt-auto">
              <div className="flex items-center gap-3 mb-4">
                <ProfileDropdown />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white text-sm truncate">User</div>
                  <div className="text-xs text-gray-400 truncate">user@example.com</div>
                  <div className="text-xs text-[#0077B5] font-medium">Free Plan</div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-[#374151] text-gray-300 hover:bg-gradient-to-r hover:from-[#0077B5] hover:to-[#00A0DC] hover:text-white hover:border-transparent bg-transparent text-xs transition-all duration-300"
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
