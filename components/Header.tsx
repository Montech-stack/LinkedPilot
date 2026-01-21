"use client"
import React from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Sparkles } from "lucide-react"
import { HeaderProps } from "../types"
import { ThemeToggle } from "./theme-toggle"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const Header: React.FC<HeaderProps> = ({ showBackButton, onBack, onMenuClick }) => (
  <motion.header
    className="sticky top-0 z-40 flex items-center justify-between p-4 bg-background/80 border-b border-border backdrop-blur-md shadow-sm"
    {...fadeInUp}
  >
    {showBackButton ? (
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 px-3 py-2 rounded-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Generator
      </button>
    ) : (
      <button
        onClick={onMenuClick}
        className="lg:hidden text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-lg"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    )}

    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-border">
        <img src="/maxis.png" alt="Maxis Logo" className="w-full h-full object-contain" />
      </div>
      <span className="font-bold text-lg text-foreground hidden sm:block">Maxis</span>
    </div>

    <div className="flex items-center gap-4">
      <ThemeToggle />
      <div className="w-8 h-8 bg-muted rounded-full"></div>
    </div>
  </motion.header >
)

export default Header