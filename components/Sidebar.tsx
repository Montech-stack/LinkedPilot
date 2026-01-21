"use client"
import { ThemeToggle } from "@/components/theme-toggle"

import { motion, AnimatePresence } from "framer-motion"
import { Link2, Settings2Icon, HomeIcon, Sparkles, Target, Calendar, CreditCard, Settings, X, LogOut, User, Mic, BarChart3, MessageCircle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import ProfileDropdown from "@/components/ProfileDropdown"
import { useSession } from "next-auth/react"
import { useBillingStore, SUBSCRIPTION_PLANS } from "@/lib/billing-store"
import { cn } from "@/lib/utils"

const navigationItems = [
  { icon: Sparkles, label: "Studio", href: "/dashboard" },
  { icon: Link2, label: "Links", href: "/dashboard/links" },
  { icon: Target, label: "Viral Ideas", href: "/hooks" },
  { icon: Calendar, label: "Schedules", href: "/scheduled" },
  { icon: Settings2Icon, label: "Automations", href: "/automations" },
  { icon: CreditCard, label: "Billing", href: "/billing" },
  { icon: Mic, label: "Voice Clone", href: "/voice-clone" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: MessageCircle, label: "Engagement", href: "/engagement" },
  { icon: HomeIcon, label: "HomePage", href: "/" },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()

  const { data: session } = useSession()
  const user = session?.user

  const { currentPlan } = useBillingStore()
  const planData = SUBSCRIPTION_PLANS.find(p => p.id === currentPlan)

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-md"
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
            className={cn(
              "fixed left-0 top-0 h-screen w-72 bg-card border-r border-border shadow-2xl z-[100] lg:sticky lg:z-auto flex flex-col",
              // "bg-gradient-to-b from-[#0F1116] to-[#0b0c10]" // Removed specific gradient for cleaner theme support
            )}
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-2">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden transition-all border border-gold/30 group-hover:border-gold/60 bg-gold/5">
                  <img src="/Linked logo.png" alt="Maxis Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="font-bold text-xl text-foreground tracking-tight group-hover:text-gold transition-colors">Maxis</h1>
                  <p className="text-[10px] text-gold font-medium tracking-wider uppercase">AI Studio</p>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="lg:hidden text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Menu</p>
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => window.innerWidth < 1024 && onClose()}>
                    <motion.div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group relative overflow-hidden",
                        isActive
                          ? "bg-gold/10 text-gold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute left-0 top-0 bottom-0 w-1 bg-gold rounded-r-full shadow-[0_0_10px_0_rgba(251,191,36,0.5)]"
                        />
                      )}
                      <item.icon
                        className={cn(
                          "w-5 h-5 transition-colors",
                          isActive ? "text-gold" : "text-muted-foreground group-hover:text-gold/80"
                        )}
                      />
                      <span className="font-medium text-sm">
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                )
              })}
            </nav>

            {/* Plan Card */}
            <div className="p-4 mx-4 mb-2 rounded-2xl bg-card border border-border/50 hover:border-gold/30 transition-colors relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity duration-500">
                <Sparkles className="w-16 h-16 text-gold/20" />
              </div>
              <h4 className="font-semibold text-foreground text-sm mb-1">{planData?.name || "Free Plan"}</h4>
              <p className="text-xs text-muted-foreground mb-3">
                {currentPlan === 'free' ? 'Upgrade to unlock infinite viral posts.' : 'You are strictly business.'}
              </p>
              <Link href="/billing">
                <Button size="sm" variant="secondary" className="w-full text-xs h-8 bg-muted hover:bg-gold/10 hover:text-gold text-foreground border border-border hover:border-gold/30 transition-all">
                  Manage Subscription
                </Button>
              </Link>
            </div>

            {/* User Footer */}
            <div className="p-4 border-t border-border bg-card">
              <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-medium border border-border overflow-hidden">
                  {user?.image ? (
                    <img src={user.image} alt="User" />
                  ) : (
                    <span className="text-sm">{user?.name?.[0] || "U"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {user?.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
                <ProfileDropdown />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}