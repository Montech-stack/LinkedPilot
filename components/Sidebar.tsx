"use client"
import React from "react"
import { ThemeToggle } from "@/components/theme-toggle"

import { motion, AnimatePresence } from "framer-motion"
import { Link2, Settings2Icon, HomeIcon, Target, Calendar, CreditCard, X, Dna, BarChart3, MessageCircle, Lock, PenLine } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import ProfileDropdown from "@/components/ProfileDropdown"
import { useSession } from "next-auth/react"
import { useBillingStore, SUBSCRIPTION_PLANS } from "@/lib/billing-store"
import { cn } from "@/lib/utils"

type FeatureAccess = 'free' | 'paid';

interface NavItem {
  icon: any;
  label: string;
  href: string;
  access: FeatureAccess;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: "Create",
    items: [
      { icon: PenLine, label: "Studio", href: "/dashboard", access: 'free' },
      { icon: Dna, label: "Voice Profile", href: "/writingdna", access: 'paid' },
      { icon: Target, label: "Labs", href: "/hooks", access: 'free' },
    ]
  },
  {
    title: "Grow",
    items: [
      { icon: Calendar, label: "Schedule", href: "/scheduled", access: 'paid' },
      { icon: Settings2Icon, label: "Automations", href: "/automations", access: 'paid' },
      { icon: BarChart3, label: "Analytics", href: "/analytics", access: 'paid' },
      { icon: MessageCircle, label: "Engagement", href: "/engagement", access: 'paid' },
    ]
  },
  {
    title: "Account",
    items: [
      { icon: Link2, label: "Connected Accounts", href: "/dashboard/links", access: 'free' },
      { icon: CreditCard, label: "Billing", href: "/billing", access: 'free' },
      { icon: HomeIcon, label: "Homepage", href: "/", access: 'free' },
    ]
  }
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

  const [isDesktop, setIsDesktop] = React.useState(false)

  React.useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

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
        {(isOpen || isDesktop) && (
          <motion.aside
            className={cn(
              "fixed left-0 top-0 h-screen w-64 bg-sidebar-background border-r border-sidebar-border shadow-sm z-[100] lg:sticky lg:z-auto flex flex-col",
            )}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 pb-3">
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-8 h-8 overflow-hidden flex-shrink-0">
                  <img src="/maxis.png" alt="Maxis" className="w-full h-full object-contain" />
                </div>
                <span className="font-display font-bold text-base text-sidebar-foreground tracking-tight group-hover:text-brand transition-colors duration-150">
                  Maxis
                </span>
              </Link>

              <div className="flex items-center gap-1">
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="lg:hidden text-muted-foreground hover:text-foreground h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
              {navigationGroups.map((group, groupIndex) => (
                <div key={group.title || groupIndex}>
                  {group.title && (
                    <p className="px-3 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.14em] mb-1.5">
                      {group.title}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href
                      const isPaidFeature = item.access === 'paid'
                      const isLocked = isPaidFeature && currentPlan === 'free'
                      const targetHref = isLocked ? '/billing' : item.href

                      return (
                        <Link key={item.href} href={targetHref} onClick={() => window.innerWidth < 1024 && onClose()}>
                          <motion.div
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 group relative",
                              isActive && !isLocked
                                ? "bg-brand/10 text-brand"
                                : isLocked
                                  ? "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isActive && !isLocked && (
                              <motion.div
                                layoutId="activeTab"
                                className="absolute left-0 top-1 bottom-1 w-0.5 bg-brand rounded-r-full"
                              />
                            )}
                            <item.icon
                              className={cn(
                                "w-4 h-4 flex-shrink-0 transition-colors",
                                isActive && !isLocked
                                  ? "text-brand"
                                  : isLocked
                                    ? "text-muted-foreground/40"
                                    : "text-muted-foreground group-hover:text-foreground"
                              )}
                              strokeWidth={1.75}
                            />
                            <span className="font-medium text-sm flex-1">
                              {item.label}
                            </span>
                            {isLocked && (
                              <Lock className="w-3 h-3 text-muted-foreground/30" />
                            )}
                          </motion.div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Plan Card */}
            {currentPlan === 'free' && (
              <div className="px-3 mb-3">
                <div className="p-4 rounded-md bg-brand/5 border border-brand/15">
                  <h4 className="font-semibold text-foreground text-xs mb-1">Free plan</h4>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Upgrade to publish to all platforms and unlock scheduling.
                  </p>
                  <Link href="/billing">
                    <Button
                      size="sm"
                      className="w-full text-xs h-8 rounded-md bg-brand text-white hover:bg-brand/90 border-0 transition-colors"
                    >
                      Upgrade plan
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* User Footer */}
            <div className="px-3 py-3 border-t border-sidebar-border">
              <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/60 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-medium border border-border overflow-hidden flex-shrink-0">
                  {user?.image ? (
                    <img src={user.image} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs">{user?.name?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {user?.name || "Account"}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user?.email || ""}
                  </p>
                </div>
                <ProfileDropdown showIconOnly />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
