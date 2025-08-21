import React from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Sparkles } from "lucide-react"

interface HeaderProps {
  showBackButton?: boolean
  onBack?: () => void
  onMenuClick?: () => void
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const Header: React.FC<HeaderProps> = ({ showBackButton, onBack, onMenuClick }) => (
  <motion.header
    className="sticky top-0 z-40 flex items-center justify-between p-4 bg-[#2d3748] border-b border-[#374151] backdrop-blur-md shadow-xl"
    {...fadeInUp}
  >
    {showBackButton ? (
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300 px-3 py-2 rounded-lg"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Generator
      </button>
    ) : (
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    )}
    
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-[#0077B5] rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg">
        LP
      </div>
      <span className="font-semibold text-[#0077B5] hidden sm:block">LinkedPilot</span>
    </div>
    
    <div className="w-8 h-8 bg-gray-600 rounded-full"></div>
  </motion.header>
)

export default Header