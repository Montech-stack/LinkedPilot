"use client"

import { Menu, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProfileDropdown from "@/components/ProfileDropdown"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

interface MobileHeaderProps {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-16 bg-background/80 backdrop-blur-md border-b border-gold/20 lg:hidden shadow-sm shadow-gold/5 transition-all duration-300">

        {/* Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-muted-foreground hover:text-gold transition-colors -ml-2"
        >
          <Menu className="w-6 h-6" />
        </Button>

        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-gold/30 group-hover:border-gold/60 transition-colors bg-gold/5">
            <img src="/Linked logo.png" alt="Maxis Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg text-foreground tracking-tight group-hover:text-gold transition-colors">Maxis</span>
        </Link>

        {/* Profile & Theme */}
        <div className="flex items-center justify-end gap-2">
          <ThemeToggle />
          <ProfileDropdown />
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 w-full lg:hidden flex-shrink-0" />
    </>
  )
}
