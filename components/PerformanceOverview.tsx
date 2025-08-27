"use client"
import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { TrendingUp, BarChart3, Sparkles } from "lucide-react"
import { PerformanceOverviewProps } from "../types"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const PerformanceOverview: React.FC<PerformanceOverviewProps> = ({ posts }) => {
  const stats = useMemo(() => ({
    avgScore: Math.round(posts.reduce((acc, post) => acc + post.score, 0) / posts.length || 0),
    highEngagement: posts.filter(p => p.engagement === "Very High").length,
    totalPosts: posts.length,
  }), [posts])

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {[
        { icon: TrendingUp, value: stats.avgScore, label: "Avg Score", color: "text-[#0077B5]" },
        { icon: BarChart3, value: stats.highEngagement, label: "High Engagement", color: "text-green-400" },
        { icon: Sparkles, value: stats.totalPosts, label: "Posts Generated", color: "text-purple-400" },
      ].map((stat, index) => (
        <motion.div
          key={index}
          className="bg-[#2d3748] rounded-xl p-6 border border-[#374151] shadow-lg"
          variants={fadeInUp}
        >
          <div className="flex items-center gap-3">
            <stat.icon className={`w-8 h-8 ${stat.color}`} />
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default PerformanceOverview