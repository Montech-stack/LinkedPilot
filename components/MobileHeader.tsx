"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProfileDropdown from "@/components/ProfileDropdown"

interface MobileHeaderProps {
  onMenuClick: () => void
}

export default function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between p-3 sm:p-4 bg-[#0a0b0f]/90 border-b border-[#1a1d29] backdrop-blur-md shadow-lg lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-gray-400 hover:text-white hover:bg-white/10 w-10 h-10 sm:w-12 sm:h-12"
      >
        <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
      </Button>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#0077B5] to-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-md">
          L
        </div>
        <span className="font-extrabold bg-gradient-to-r from-[#0077B5] to-purple-500 bg-clip-text text-transparent text-base sm:text-lg">
          Linked
        </span>
      </div>
      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
        <ProfileDropdown />
      </div>
    </header>
  )
}
