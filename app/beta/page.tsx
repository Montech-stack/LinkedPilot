"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ImageIcon, Bot, Zap, Calendar, Lock, Sparkles } from "lucide-react"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"

const betaFeatures = [
  {
    id: 1,
    icon: ImageIcon,
    name: "AI Image Generation",
    description:
      "Create stunning, context-aware images for your posts with a single click. Our AI analyzes your text and generates relevant visuals to boost engagement.",
    status: "beta",
    premium: true,
  },
  {
    id: 2,
    icon: Bot,
    name: "Full Agent Mode",
    description:
      "Your personal AI content strategist. It will research trending topics, generate post ideas, create content, and schedule it for you, all on autopilot.",
    status: "dropping-soon",
    premium: true,
  },
  {
    id: 3,
    icon: Zap,
    name: "Smart Hashtag Generator",
    description:
      "Automatically generate trending and relevant hashtags based on your content and industry to maximize reach and discoverability.",
    status: "beta",
    premium: true,
  },
  {
    id: 4,
    icon: Calendar,
    name: "Content Calendar",
    description:
      "Plan and visualize your content strategy with an intelligent calendar that suggests optimal posting times and content themes.",
    status: "dropping-soon",
    premium: false,
  },
]

export default function BetaFeatures() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#1a1d29] text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 max-w-4xl mx-auto">
          {/* Header */}
          <motion.div className="mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-4">Beta Features</h1>
            <p className="text-gray-400 leading-relaxed">
              Exclusive access to the next generation of LinkedPilot tools. These features are currently in development
              and will be available for our Premium users soon.
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {betaFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                className="bg-[#2d3748] rounded-xl p-6 border border-[#374151] hover:border-[#0077B5] transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Icon and Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#0077B5] rounded-full flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        feature.status === "beta"
                          ? "bg-[#0077B5] bg-opacity-20 text-[#0077B5] border border-[#0077B5] border-opacity-30"
                          : "bg-orange-500 bg-opacity-20 text-orange-400 border border-orange-500 border-opacity-30"
                      }`}
                    >
                      {feature.status === "beta" ? "Beta" : "Dropping Soon"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-3">{feature.name}</h3>
                <p className="text-gray-400 leading-relaxed mb-4">{feature.description}</p>

                {/* Premium Badge */}
                {feature.premium && (
                  <div className="flex items-center gap-2 text-orange-400">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Available for Premium users</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Coming Soon Section */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-gradient-to-r from-[#0077B5] to-[#1a1d29] rounded-xl p-8">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">More Features Coming Soon</h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                We're constantly working on new features to make LinkedPilot the ultimate LinkedIn content creation
                platform. Stay tuned for more exciting updates!
              </p>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0077B5]">5+</div>
                  <div className="text-sm text-gray-400">Features in Development</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#0077B5]">Q2 2025</div>
                  <div className="text-sm text-gray-400">Next Major Release</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
