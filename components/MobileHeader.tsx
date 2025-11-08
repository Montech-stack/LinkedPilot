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
    <header className="sticky top-0 z-40 flex items-center justify-between px-2 bg-gradient-to-br from-[#0b0b0c]/95 via-[#0d1118]/90 to-[#0d1b2a]/90 border-b border-[#1a1d29] backdrop-blur-md shadow-lg lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-gray-400 hover:text-white hover:bg-white/10"
      >
        <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>

      <Image
        src="/Linked Logo.png"
        alt="Linked Logo"
        width={75}
        height={35}
        className="object-contain"
      />

      <div className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8">
        <ProfileDropdown />
      </div>
    </header>
  )
}
