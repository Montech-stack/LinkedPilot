"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Settings, CreditCard, LogOut, Crown, User, Star, Loader2, Sparkles } from "lucide-react"
import { useBillingStore, SUBSCRIPTION_PLANS } from "@/lib/billing-store"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSession, signOut } from "next-auth/react"

export default function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const { data: session, status } = useSession()
  const user = session?.user

  const { currentPlan, tokensRemaining } = useBillingStore()
  const planData = SUBSCRIPTION_PLANS.find(p => p.id === currentPlan)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    setIsOpen(false)
    try {
      await signOut({ redirect: false })
      toast.success("Logged out")
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 100)
    } catch {
      toast.error("Failed to logout")
      setLoggingOut(false)
    }
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.split(" ")
      return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name[0].toUpperCase()
    }
    return email ? email[0].toUpperCase() : "U"
  }

  const userInitials = getInitials(user?.name, user?.email)
  const shouldShowUpgrade = currentPlan === "payg" || currentPlan === "starter"

  const menuItems = [
    ...(shouldShowUpgrade ? [{
      icon: Crown,
      label: "Upgrade to Pro",
      badge: "PRO",
      color: "text-amber-400",
      badgeColor: "bg-amber-400 text-black",
      onClick: () => { router.push("/billing"); setIsOpen(false); }
    }] : []),
    {
      icon: CreditCard,
      label: "Billing & Usage",
      color: "text-gray-400",
      onClick: () => { router.push("/billing"); setIsOpen(false); }
    },
    {
      icon: Settings,
      label: "Settings",
      color: "text-gray-400",
      onClick: () => { router.push("/settings"); setIsOpen(false); } // Assuming settings page exists or will be added
    },
    {
      icon: LogOut,
      label: "Sign Out",
      color: "text-red-400",
      onClick: handleLogout,
      loading: loggingOut
    }
  ]

  if (status === "loading") return <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
  if (!session || !user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group w-9 h-9 rounded-full font-semibold text-sm flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg ring-2 ring-transparent hover:ring-blue-500/50 transition-all overflow-hidden"
      >
        {user.image ? (
          <img src={user.image} alt="User" className="w-full h-full object-cover" />
        ) : (
          <span>{userInitials}</span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-72 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold text-sm">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user.name || "Creator"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg p-2.5 flex items-center justify-between border border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span>Tokens</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">
                    {tokensRemaining === -1 || tokensRemaining === undefined ? "∞" : tokensRemaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu */}
            <div className="p-2 space-y-0.5">
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  disabled={item.loading}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors group"
                >
                  {item.loading ? (
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                  ) : (
                    <item.icon className={`w-4 h-4 transition-colors ${item.color.replace('text-gray-400', 'text-muted-foreground')} group-hover:text-foreground`} />
                  )}

                  <span className="flex-1 text-left text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.label}
                  </span>

                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-muted/50 border-t border-border text-[10px] text-center text-muted-foreground">
              v1.2.0 • Maxis
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}