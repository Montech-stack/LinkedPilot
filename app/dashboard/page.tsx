"use client"

import React, { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, Zap, Plus, Minus, Crown, FileText, Trash2 } from "lucide-react"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"
import PerformanceOverview from "@/components/PerformanceOverview"
import PostCard from "@/components/PostCard"
import ScheduleModal from "@/components/ScheduleModal"
import { usePostGeneration } from "@/hooks/usePostGeneration"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { GeneratedPost, UserPlan, PostTone, PostLength, PlanLimit, ToneOption, LengthOption } from "@/types"

const PLAN_LIMITS: Record<UserPlan, PlanLimit> = {
  free: { maxPosts: 5, name: "Free Plan" },
  pro: { maxPosts: 50, name: "Pro Plan" },
  enterprise: { maxPosts: 100, name: "Enterprise Plan" },
}

const TONE_OPTIONS: ToneOption[] = [
  { value: "professional", label: "🎯 Professional" },
  { value: "friendly", label: "😊 Friendly" },
  { value: "assertive", label: "💪 Assertive" },
  { value: "inspirational", label: "✨ Inspirational" },
  { value: "casual", label: "😎 Casual" },
  { value: "thought-provoking", label: "🤔 Thought-Provoking" },
]

const LENGTH_OPTIONS: LengthOption[] = [
  { value: "short", label: "📝 Short (50-100 words)" },
  { value: "medium", label: "📄 Medium (100-200 words)" },
  { value: "long", label: "📚 Long (200+ words)" },
]

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export default function Dashboard() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [input, setInput] = useState("")
  const [tone, setTone] = useState<PostTone>("professional")
  const [postCount, setPostCount] = useState(1)
  const [postLength, setPostLength] = useState<PostLength>("medium")
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([])
  const [expandedPost, setExpandedPost] = useState<number | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedPostForSchedule, setSelectedPostForSchedule] = useState<GeneratedPost | null>(null)

  const { isGenerating, generationProgress, generatePosts, setIsGenerating } = usePostGeneration()

  const userPlan: UserPlan = "pro"
  const currentPlanLimit = PLAN_LIMITS[userPlan]

  // Load cached posts from localStorage on mount
  useEffect(() => {
    const cachedPosts = localStorage.getItem('generatedPosts')
    if (cachedPosts) {
      try {
        const parsedPosts = JSON.parse(cachedPosts)
        if (Array.isArray(parsedPosts)) {
          setGeneratedPosts(parsedPosts.map((post: GeneratedPost, index: number) => ({
            ...post,
            id: post.id || `post-${index + 1}`,
            content: post.content || '',
            engagement: post.engagement || 'Medium',
            score: Math.min(95, Math.max(70, post.score || 80)),
          })))
        }
      } catch (error) {
        console.error('Error loading cached posts:', error)
        localStorage.removeItem('generatedPosts')
        toast.error('Failed to load cached posts')
      }
    }
  }, [])

  // Save posts to localStorage whenever generatedPosts changes
  useEffect(() => {
    if (generatedPosts.length > 0) {
      try {
        localStorage.setItem('generatedPosts', JSON.stringify(generatedPosts))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
        toast.error('Failed to cache posts locally')
      }
    } else {
      localStorage.removeItem('generatedPosts')
    }
  }, [generatedPosts])

  // Load input from URL query
  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const inputParam = query.get("input")
    if (inputParam) {
      try {
        setInput(decodeURIComponent(inputParam))
      } catch (error) {
        console.error("Failed to decode input parameter:", error, "Raw input:", inputParam)
        setInput("")
      }
    }
  }, [])

  const handleGeneratePosts = useCallback(async () => {
    if (!input.trim()) {
      toast.error("Please enter a post idea")
      return
    }

    setIsGenerating(true)

    try {
      const newPosts = await generatePosts(input, tone, postCount, postLength)
      console.log("Generated posts:", newPosts)
      if (newPosts.length === 0) {
        throw new Error('No posts generated')
      }
      // Append new posts to existing ones
      setGeneratedPosts(prev => [
        ...prev,
        ...newPosts.map((post, index) => ({
          ...post,
          id: post.id || `${Date.now()}-${index}/${postCount}`,
          engagement: post.engagement || 'Medium',
          score: Math.min(95, Math.max(70, post.score || 80)),
        }))
      ])
      toast.success(`Generated ${newPosts.length} new post${newPosts.length > 1 ? 's' : ''}!`)
    } catch (error) {
      console.error("Error generating posts:", error)
      toast.error("Failed to generate posts")
    } finally {
      setIsGenerating(false)
    }
  }, [input, tone, postCount, postLength, generatePosts, setIsGenerating])

  const handleClearAllPosts = useCallback(() => {
    setGeneratedPosts([])
    localStorage.removeItem('generatedPosts')
    toast.success("All posts cleared!")
  }, [])

  const handleDeletePost = useCallback((postId: string) => {
    setGeneratedPosts(prev => {
      const updatedPosts = prev.filter(post => post.id !== postId)
      return updatedPosts
    })
    toast.success("Post deleted!")
  }, [])

  const handleCopyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success("Copied to clipboard!")
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  const handlePostSuccess = useCallback((postId: string) => {
    console.log("Successfully posted to LinkedIn:", postId)
    toast.success("Posted to LinkedIn!")
  }, [])

  const handlePostError = useCallback((error: string) => {
    console.error("Failed to post to LinkedIn:", error)
    toast.error("Failed to post to LinkedIn")
  }, [])

  const handleSchedulePost = useCallback((post: GeneratedPost) => {
    if (!post?.id || !post?.content) {
      console.error("Invalid post selected for scheduling:", post)
      toast.error("Invalid post selected for scheduling")
      return
    }
    setSelectedPostForSchedule(post)
    setShowScheduleModal(true)
  }, [])

  const handleSchedule = useCallback(async (scheduleData: {
    postId: string
    content: string
    scheduleTime: string
    recurring?: "daily" | "weekly" | "monthly" | null
  }) => {
    try {
      console.log("Sending schedule request:", scheduleData)
      const response = await fetch("/api/schedule-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to schedule post")
      }
      toast.success("Post scheduled successfully")
      setShowScheduleModal(false)
      setSelectedPostForSchedule(null)
    } catch (error) {
      console.error("Scheduling error:", error)
      toast.error("Failed to schedule post")
    }
  }, [])

  const handlePostCountChange = useCallback((delta: number) => {
    setPostCount(prev => 
      Math.min(currentPlanLimit.maxPosts, Math.max(1, prev + delta))
    )
  }, [currentPlanLimit.maxPosts])

  const handlePostCountInput = useCallback((value: string) => {
    const numValue = parseInt(value) || 1
    setPostCount(Math.min(currentPlanLimit.maxPosts, Math.max(1, numValue)))
  }, [currentPlanLimit.maxPosts])

  return (
    <div className="min-h-screen bg-[#1a1d29] text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 lg:ml-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
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

          {generatedPosts.length > 0 && (
            <motion.div
              className="mt-8 space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Generated Posts ({generatedPosts.length})
                </h2>
                <button
                  onClick={handleClearAllPosts}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Posts
                </button>
              </div>
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
                    onDelete={() => handleDeletePost(post.id)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {isGenerating && (
              <>
                <motion.div
                  className="fixed inset-0 bg-black/50 z-50 min-h-screen h-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.div
                  className="fixed inset-0 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    className="bg-[#2d3748] rounded-xl p-6 border border-[#374151] shadow-xl text-center w-[90%] sm:max-w-md max-h-[80vh] overflow-auto"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
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
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <ScheduleModal
            isOpen={showScheduleModal}
            onClose={() => {
              setShowScheduleModal(false)
              setSelectedPostForSchedule(null)
            }}
            onSchedule={handleSchedule}
            post={selectedPostForSchedule || { id: "", content: "" }}
          />
        </div>
      </div>
    </div>
  )
}