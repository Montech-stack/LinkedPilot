"use client"
import React, { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Header from "@/components/Header"
import PerformanceOverview from "@/components/PerformanceOverview"
import PostCard from "@/components/PostCard"
import { usePostGeneration } from "@/hooks/usePostGeneration"
import { GeneratedPost, PostTone, PostLength, UserPlan } from "@/types"
import { PLAN_LIMITS, TONE_OPTIONS, LENGTH_OPTIONS } from "@/utils/constants"
import { Plus, Minus, Loader2, Zap, FileText, Mic, Hash, Camera, Crown, Sparkles } from "lucide-react"
// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export default function Dashboard() {
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [input, setInput] = useState("")
  const [tone, setTone] = useState<PostTone>("professional")
  const [postCount, setPostCount] = useState(3)
  const [postLength, setPostLength] = useState<PostLength>("medium")
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [showResults, setShowResults] = useState(false)
  const [expandedPost, setExpandedPost] = useState<number | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedPostForSchedule, setSelectedPostForSchedule] = useState<GeneratedPost | null>(null)

  // Custom hooks
  const { isGenerating, generationProgress, generatePosts, resetGeneration, setIsGenerating } = usePostGeneration()

  // Configuration
  const userPlan: UserPlan = "pro"
  const currentPlanLimit = PLAN_LIMITS[userPlan]

  // Event handlers
  const handleGeneratePosts = useCallback(async () => {
    if (!input.trim()) return

    const posts = await generatePosts(input, tone, postCount, postLength)
    setGeneratedPosts(posts)
    
    setTimeout(() => {
      setShowResults(true)
      setIsGenerating(false)
    }, 500)
  }, [input, tone, postCount, postLength, generatePosts, setIsGenerating])

  const handleCopyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      // TODO: Add toast notification
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }, [])

  const handlePostSuccess = useCallback((postId: string) => {
    console.log("Successfully posted to LinkedIn:", postId)
    // TODO: Add success notification/toast
  }, [])

  const handlePostError = useCallback((error: string) => {
    console.error("Failed to post to LinkedIn:", error)
    // TODO: Add error notification/toast
  }, [])

  const handleSchedulePost = useCallback((post: GeneratedPost) => {
    setSelectedPostForSchedule(post)
    setShowScheduleModal(true)
  }, [])

  const handlePostCountChange = useCallback((delta: number) => {
    setPostCount(prev => 
      Math.min(currentPlanLimit.maxPosts, Math.max(1, prev + delta))
    )
  }, [currentPlanLimit.maxPosts])

  const handleBackToGenerator = useCallback(() => {
    setShowResults(false)
    resetGeneration()
  }, [resetGeneration])

  const handlePostCountInput = useCallback((value: string) => {
    const numValue = parseInt(value) || 1
    setPostCount(Math.min(currentPlanLimit.maxPosts, Math.max(1, numValue)))
  }, [currentPlanLimit.maxPosts])

  // Results View
  if (showResults) {
    return (
      <div className="min-h-screen bg-[#1a1d29] text-white">
        <Header showBackButton onBack={handleBackToGenerator} />
        
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <motion.div className="text-center mb-8" {...fadeInUp}>
            <div className="inline-block px-4 py-2 border border-[#0077B5] text-[#0077B5] rounded-full text-sm mb-4 shadow-lg bg-[#0077B5]/5">
              ✨ Generated {generatedPosts.length} Posts
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
              Your Viral Posts Are <span className="text-[#0077B5]">Ready to Go</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Each post uses proven psychological triggers and engagement patterns. Choose your favorite or schedule them all!
            </p>
          </motion.div>

          <PerformanceOverview posts={generatedPosts} />

          <div className="space-y-6">
            {generatedPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                totalPosts={generatedPosts.length}
                isExpanded={expandedPost === post.id}
                onToggleExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                onSchedule={() => handleSchedulePost(post)}
                onCopy={() => handleCopyToClipboard(post.content)}
                onPostSuccess={handlePostSuccess}
                onPostError={handlePostError}
              />
            ))}
          </div>

          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <button
              onClick={handleBackToGenerator}
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 text-lg shadow-lg rounded-lg transform hover:scale-105 transition-all duration-300 flex items-center mx-auto"
            >
              <Plus className="w-5 h-5 mr-2" />
              Generate More Posts
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Generator View
  return (
    <div className="min-h-screen bg-[#1a1d29] text-white flex">
      <div className="flex-1 lg:ml-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-3 sm:p-4 lg:p-8 max-w-4xl mx-auto">
          <motion.div className="text-center mb-8" {...fadeInUp}>
            <div className="inline-block px-4 py-2 border border-[#0077B5] text-[#0077B5] rounded-full text-sm mb-4 shadow-lg bg-[#0077B5]/5">
              🚀 AI Content Generator
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
              What topic do you want to create viral content about?
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Transform your ideas into engaging LinkedIn posts that stop the scroll and drive meaningful conversations
            </p>
          </motion.div>

          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-[#2d3748] rounded-xl p-3 sm:p-4 lg:p-6 border border-[#374151] shadow-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-[#0077B5]" />
                    Select Tone
                  </label>
                  <select 
                    value={tone} 
                    onChange={(e) => setTone(e.target.value as PostTone)}
                    className="w-full bg-[#1a1d29] border border-[#374151] text-white focus:border-[#0077B5] transition-all duration-300 h-11 rounded-lg px-3"
                  >
                    {TONE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#0077B5]" />
                    Number of Posts
                    {userPlan === "free" && (
                      <Crown className="w-4 h-4 text-yellow-400" title="Upgrade for more posts" />
                    )}
                  </label>
                  <div className="flex items-center gap-2 h-11">
                    <button
                      onClick={() => handlePostCountChange(-1)}
                      disabled={postCount <= 1}
                      className="border border-[#374151] text-gray-300 hover:bg-[#374151] bg-transparent disabled:opacity-50 h-11 w-11 flex-shrink-0 rounded-lg flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <input
                        type="number"
                        min="1"
                        max={currentPlanLimit.maxPosts}
                        value={postCount}
                        onChange={(e) => handlePostCountInput(e.target.value)}
                        className="text-center bg-[#1a1d29] border border-[#374151] text-white focus:border-[#0077B5] h-11 w-full rounded-lg"
                      />
                    </div>
                    <button
                      onClick={() => handlePostCountChange(1)}
                      disabled={postCount >= currentPlanLimit.maxPosts}
                      className="border border-[#374151] text-gray-300 hover:bg-[#374151] bg-transparent disabled:opacity-50 h-11 w-11 flex-shrink-0 rounded-lg flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Max {currentPlanLimit.maxPosts} posts ({currentPlanLimit.name})
                    {userPlan === "free" && <span className="text-yellow-400 ml-1">• Upgrade for more</span>}
                  </p>
                </div>
              </div>

              <div className="relative mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0077B5]" />
                  Your Post Idea
                </label>
                <textarea
                  placeholder={`Describe your post idea in detail... 

Examples:
• Share a lesson learned from a recent project failure
• Discuss the future of remote work in tech
• Give career advice for new graduates
• Share insights about industry trends
• Tell a story about overcoming challenges`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[160px] sm:min-h-[200px] bg-[#1a1d29] border border-[#374151] text-white placeholder-gray-400 focus:border-[#0077B5] resize-none text-base sm:text-lg leading-relaxed shadow-lg transition-all duration-300 w-full rounded-lg p-4"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                  {input.length}/500 characters
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {[Camera, Mic, Hash].map((Icon, index) => (
                    <button 
                      key={index}
                      className="w-10 h-10 bg-[#1a1d29] rounded-full flex items-center justify-center hover:bg-[#374151] transition-all duration-300 shadow-lg group"
                    >
                      <Icon className="w-5 h-5 text-gray-400 group-hover:text-[#0077B5] group-hover:scale-110 transition-all" />
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0077B5]" />
                      Post Length
                    </label>
                    <select 
                      value={postLength} 
                      onChange={(e) => setPostLength(e.target.value as PostLength)}
                      className="w-full bg-[#1a1d29] border border-[#374151] text-white focus:border-[#0077B5] transition-all duration-300 h-11 rounded-lg px-3"
                    >
                      {LENGTH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="text-left sm:text-right order-2 sm:order-1">
                      <div className="text-gray-400 text-sm">Credits: ∞</div>
                      <div className="text-xs text-gray-500">{currentPlanLimit.name}</div>
                    </div>
                    <div className="order-1 sm:order-2 w-full sm:w-auto">
                      <button
                        onClick={handleGeneratePosts}
                        disabled={!input.trim() || isGenerating}
                        className="w-full px-6 py-3 bg-[#0077B5] hover:bg-[#004182] rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform hover:scale-105 transition-all duration-300 text-base font-medium text-white flex items-center justify-center"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            <span className="hidden sm:inline">Generating...</span>
                            <span className="sm:hidden">Generating...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 mr-2" />
                            <span className="hidden sm:inline">
                              Generate {postCount} Post{postCount > 1 ? "s" : ""}
                            </span>
                            <span className="sm:hidden">Generate {postCount}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {isGenerating && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-[#2d3748] rounded-xl p-8 border border-[#374151] shadow-xl text-center">
                  <div className="inline-flex items-center gap-3 mb-4">
                    <Loader2 className="w-8 h-8 text-[#0077B5] animate-spin" />
                    <span className="text-xl font-semibold text-[#0077B5]">Generating your viral posts...</span>
                  </div>

                  <div className="w-full bg-[#374151] rounded-full h-2 mb-4">
                    <motion.div
                      className="bg-[#0077B5] h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>

                  <p className="text-gray-400 mb-4">
                    Creating {postCount} unique {postLength} posts with {tone} tone...
                  </p>

                  <div className="flex justify-center gap-4 text-sm text-gray-500">
                    <span>✨ Analyzing trends</span>
                    <span>🎯 Optimizing engagement</span>
                    <span>🚀 Crafting hooks</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}