"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProfileDropdown from "@/components/ProfileDropdown"
import Image from "next/image"

interface MobileHeaderProps {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-3 py-2 h-12 bg-gradient-to-br from-[#0b0b0c]/80 via-[#0d1118]/70 to-[#0d1b2a]/70 border-b border-[#1a1d29]/50 backdrop-blur-sm shadow-md lg:hidden">
      
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-gray-400 hover:text-white hover:bg-white/10 transition-all"
      >
        <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>

      {/* Logo */}
      <div className="flex-1 flex justify-center">
        <Image
          src="/Linked Logo.png"
          alt="Linked Logo"
          width={85}
          height={35}
          className="object-contain"
        />
      </div>

      {/* Profile */}
      <div className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8">
        <ProfileDropdown />
      </div>
    </header>
  )
}
