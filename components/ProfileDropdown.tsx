"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, CreditCard, LogOut, Crown, User, Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBillingStore, SUBSCRIPTION_PLANS } from "@/lib/billing-store"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSession, signOut } from "next-auth/react"
import Image from "next/image"

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Get user info from NextAuth session
  const { data: session, status } = useSession()
  const user = session?.user

  // Get billing info
  const { currentPlan, tokensRemaining } = useBillingStore()

  // Get plan details
  const planData = SUBSCRIPTION_PLANS.find(p => p.id === currentPlan)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Handle logout
  const handleLogout = async () => {
    setLoggingOut(true)
    setIsOpen(false)

    try {
      await signOut({ redirect: false })
      toast.success("Logged out successfully")
      
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 100)
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to logout")
      setLoggingOut(false)
    }
  }

  // Get user initials for avatar
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.split(" ")
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return name[0].toUpperCase()
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return "U"
  }

  const userInitials = getInitials(user?.name, user?.email)

  // Determine if user should see upgrade option
  const shouldShowUpgrade = currentPlan === "payg" || currentPlan === "starter"

  const menuItems = [
    ...(shouldShowUpgrade
      ? [{
          icon: Crown,
          label: "Upgrade to Pro",
          href: "/billing",
          color: "text-yellow-400",
          badge: "UPGRADE",
          onClick: () => {
            setIsOpen(false)
            router.push("/billing")
          },
        }]
      : []),
    {
      icon: CreditCard,
      label: "Billing & Usage",
      href: "/billing",
      color: "text-gray-300",
      onClick: () => {
        setIsOpen(false)
        router.push("/billing")
      },
    },
    {
      icon: Star,
      label: "Leave Review",
      href: "/review",
      color: "text-blue-400",
      onClick: () => {
        setIsOpen(false)
        window.open("https://www.trustpilot.com", "_blank") // Replace with your review link
      },
    },
    {
      icon: LogOut,
      label: "Logout",
      color: "text-red-400",
      onClick: handleLogout,
      loading: loggingOut,
    },
  ]

  // Don't render if no session
  if (status === "loading") {
    return (
      <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
    )
  }

  if (!session || !user) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-full flex items-center justify-center font-bold text-white text-sm hover:from-[#004182] hover:to-[#0077B5] shadow-lg transition-all"
      >
        {userInitials}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-72 bg-[#1a1d29] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* User Info Section */}
            <div className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-white text-base backdrop-blur-sm">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">
                    {user.name || "User"}
                  </p>
                  <p className="text-blue-100 text-xs truncate">
                    {user.email || "no-email@example.com"}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-blue-100 text-xs font-medium">
                  {planData?.name || "Free Plan"}
                </span>
                {tokensRemaining !== undefined && (
                  <span className="text-white text-xs font-bold bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    {tokensRemaining === -1 ? "∞" : tokensRemaining} tokens
                  </span>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  disabled={item.loading}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {item.loading ? (
                    <Loader2 className={`w-4 h-4 ${item.color} animate-spin`} />
                  ) : (
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  )}
                  <span className="text-gray-200 text-sm flex-1 text-left">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] font-bold bg-yellow-500 text-black px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Plan Info Footer (for non-unlimited users) */}
            {tokensRemaining !== -1 && tokensRemaining < 10 && (
              <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-3">
                <p className="text-red-400 text-xs font-medium">
                  Low on tokens! Upgrade or buy more.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}