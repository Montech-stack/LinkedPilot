"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Search, Copy, Lightbulb, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"

// Mock data for hooks with engagement scores and keywords for matching
const mockHooks = [
  {
    id: 1,
    category: "Controversial",
    hook: "Unpopular opinion: Your LinkedIn profile is more important than your resume.",
    engagement: "Very High",
    score: 95,
    likes: 567,
    comments: 89,
    shares: 34,
    keywords: ["career", "profile", "resume", "job search", "professional", "opinion"],
  },
  {
    id: 2,
    category: "Lesson Learned",
    hook: "The $50K mistake that taught me everything about business:",
    engagement: "Very High",
    score: 92,
    likes: 678,
    comments: 123,
    shares: 45,
    keywords: ["business", "mistake", "lesson", "entrepreneur", "failure", "learning"],
  },
  {
    id: 3,
    category: "Question",
    hook: "What's the biggest mistake you see professionals make on LinkedIn?",
    engagement: "High",
    score: 88,
    likes: 234,
    comments: 45,
    shares: 12,
    keywords: ["linkedin", "professional", "mistake", "networking", "career"],
  },
  {
    id: 4,
    category: "Story",
    hook: "3 years ago, I was rejected from my dream job. Here's what happened next...",
    engagement: "High",
    score: 85,
    likes: 445,
    comments: 67,
    shares: 23,
    keywords: ["job", "rejection", "career", "story", "motivation", "success"],
  },
  {
    id: 5,
    category: "Behind the Scenes",
    hook: "Here's what my typical workday actually looks like (spoiler: it's not glamorous):",
    engagement: "High",
    score: 82,
    likes: 312,
    comments: 52,
    shares: 19,
    keywords: ["workday", "behind the scenes", "reality", "work life", "productivity"],
  },
  {
    id: 6,
    category: "List",
    hook: "5 LinkedIn features you're not using (but should be):",
    engagement: "Medium",
    score: 75,
    likes: 189,
    comments: 28,
    shares: 8,
    keywords: ["linkedin", "features", "tips", "networking", "professional"],
  },
  {
    id: 7,
    category: "Question",
    hook: "What would you do if you had unlimited resources for one project?",
    engagement: "High",
    score: 80,
    likes: 298,
    comments: 41,
    shares: 15,
    keywords: ["project", "resources", "creativity", "innovation", "business"],
  },
  {
    id: 8,
    category: "Controversial",
    hook: "Hot take: Remote work is killing company culture (and here's why that's good):",
    engagement: "Very High",
    score: 90,
    likes: 523,
    comments: 78,
    shares: 29,
    keywords: ["remote work", "company culture", "work from home", "opinion", "workplace"],
  },
  {
    id: 9,
    category: "Success Story",
    hook: "From 0 to 100K followers in 6 months: Here's my exact strategy",
    engagement: "Very High",
    score: 94,
    likes: 892,
    comments: 156,
    shares: 67,
    keywords: ["growth", "followers", "strategy", "social media", "success"],
  },
  {
    id: 10,
    category: "Productivity",
    hook: "I tried every productivity hack for 30 days. Only 3 actually worked:",
    engagement: "High",
    score: 87,
    likes: 445,
    comments: 78,
    shares: 34,
    keywords: ["productivity", "hacks", "efficiency", "time management", "work"],
  },
  {
    id: 11,
    category: "Career Advice",
    hook: "The one skill that got me promoted 3 times in 2 years:",
    engagement: "High",
    score: 83,
    likes: 356,
    comments: 67,
    shares: 28,
    keywords: ["career", "promotion", "skill", "advancement", "professional development"],
  },
  {
    id: 12,
    category: "Industry Insight",
    hook: "Why 90% of startups fail (and the 10% that don't do this differently):",
    engagement: "High",
    score: 86,
    likes: 567,
    comments: 89,
    shares: 45,
    keywords: ["startup", "failure", "success", "business", "entrepreneur"],
  },
]

export default function HooksLibrary() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [displayCount, setDisplayCount] = useState(10)

  // Filter and sort hooks based on user input
  const processedHooks = useMemo(() => {
    if (!userInput.trim()) {
      // No input: show hooks sorted by performance score
      return mockHooks.sort((a, b) => b.score - a.score)
    }

    // With input: calculate relevance score and sort by it
    const keywords = userInput
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 2)

    const hooksWithRelevance = mockHooks.map((hook) => {
      let relevanceScore = 0

      keywords.forEach((keyword) => {
        // Check if keyword matches hook keywords
        const keywordMatches = hook.keywords.filter(
          (hookKeyword) => hookKeyword.includes(keyword) || keyword.includes(hookKeyword),
        ).length

        // Check if keyword appears in hook text
        const textMatches = hook.hook.toLowerCase().includes(keyword) ? 1 : 0

        // Check if keyword matches category
        const categoryMatch = hook.category.toLowerCase().includes(keyword) ? 1 : 0

        relevanceScore += keywordMatches * 3 + textMatches * 2 + categoryMatch
      })

      // Combine relevance with performance score (weighted)
      const combinedScore = relevanceScore * 0.7 + hook.score * 0.3

      return {
        ...hook,
        relevanceScore,
        combinedScore,
      }
    })

    // Filter out hooks with no relevance and sort by combined score
    return hooksWithRelevance
      .filter((hook) => hook.relevanceScore > 0)
      .sort((a, b) => b.combinedScore - a.combinedScore)
  }, [userInput])

  const displayedHooks = processedHooks.slice(0, displayCount)
  const hasMore = processedHooks.length > displayCount

  const copyHook = (hook: string) => {
    navigator.clipboard.writeText(hook)
    // Add toast notification here
  }

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case "Very High":
        return "text-green-400 bg-green-400/10 border-green-400/20"
      case "High":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20"
      case "Medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400"
    if (score >= 80) return "text-blue-400"
    if (score >= 70) return "text-yellow-400"
    return "text-gray-400"
  }

  return (
    <div className="min-h-screen gradient-bg text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 gradient-text">Hook Library</h1>
            <p className="text-gray-400 text-lg">
              Get personalized hooks that stop the scroll and drive engagement on LinkedIn
            </p>
          </motion.div>

          {/* Input Section */}
          <motion.div
            className="gradient-card rounded-xl p-6 mb-8 border border-[#2d3748] shadow-xl glow-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-full flex items-center justify-center shadow-lg">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Find Your Perfect Hook</h2>
                <p className="text-gray-400 text-sm">Describe your post idea and get matching hooks</p>
              </div>
            </div>

            <Textarea
              placeholder="Describe your post idea or topic (e.g., 'career advice for developers', 'startup failure story', 'productivity tips')..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="min-h-[100px] bg-[#0a0b0f] border-[#2d3748] text-white placeholder-gray-400 focus:border-[#0077B5] focus:ring-[#0077B5] resize-none text-base leading-relaxed shadow-lg"
            />

            {userInput && (
              <motion.div
                className="mt-4 p-3 bg-gradient-to-r from-[#0077B5]/10 to-[#00A0DC]/10 border border-[#0077B5]/20 rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <div className="flex items-center gap-2 text-[#0077B5]">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Found {processedHooks.length} matching hooks, sorted by relevance to your idea
                  </span>
                </div>
              </motion.div>
            )}

            {!userInput && (
              <motion.div
                className="mt-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <div className="flex items-center gap-2 text-purple-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">Showing top performing hooks sorted by engagement score</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Hooks Grid */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {displayedHooks.map((hook, index) => (
              <motion.div
                key={hook.id}
                className="gradient-card rounded-xl p-6 border border-[#2d3748] hover:border-[#0077B5] transition-all duration-300 shadow-lg hover:shadow-xl group glow-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01, y: -2 }}
              >
                {/* Hook Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white rounded-full text-sm font-medium shadow-lg">
                      #{index + 1}
                    </span>
                    <span className="px-3 py-1 bg-[#0077B5] bg-opacity-20 text-[#0077B5] rounded-full text-sm font-medium border border-[#0077B5]/20">
                      {hook.category}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getEngagementColor(hook.engagement)}`}
                    >
                      {hook.engagement} Engagement
                    </span>
                    <div className="flex items-center gap-1">
                      <Zap className={`w-4 h-4 ${getScoreColor(hook.score)}`} />
                      <span className={`text-sm font-bold ${getScoreColor(hook.score)}`}>{hook.score}/100</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyHook(hook.hook)}
                    className="text-gray-400 hover:text-white hover:bg-[#2d3748] group-hover:bg-gradient-to-r group-hover:from-[#0077B5] group-hover:to-[#00A0DC] transition-all duration-300 shadow-lg"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                {/* Hook Content */}
                <div className="mb-4">
                  <p className="text-lg text-gray-100 leading-relaxed font-medium">{hook.hook}</p>
                </div>

                {/* Performance Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <span className="text-red-400">❤️</span>
                    <span>{hook.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-blue-400">💬</span>
                    <span>{hook.comments}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-green-400">🔄</span>
                    <span>{hook.shares}</span>
                  </div>
                  <div className="ml-auto text-xs text-gray-500">
                    Based on {hook.likes + hook.comments + hook.shares} interactions
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Show More Button */}
          {hasMore && (
            <motion.div
              className="text-center mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={() => setDisplayCount((prev) => prev + 10)}
                className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white px-8 py-3 text-lg shadow-lg glow-button"
              >
                Show 10 More Hooks ({processedHooks.length - displayCount} remaining)
              </Button>
            </motion.div>
          )}

          {/* Empty State */}
          {processedHooks.length === 0 && userInput && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No matching hooks found</h3>
              <p className="text-gray-400 mb-6">Try describing your topic differently or use broader keywords</p>
              <Button
                onClick={() => setUserInput("")}
                className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white shadow-lg"
              >
                Clear Search
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
