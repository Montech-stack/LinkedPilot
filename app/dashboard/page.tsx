"use client"

import { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, Camera, Mic, Eye, Clock, Edit3, Share2, Copy, 
  Loader2, Sparkles, Zap, TrendingUp, BarChart3, Hash, 
  ImageIcon, Video, FileText, Plus, Minus, Crown 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import Sidebar from "@/components/Sidebar"
import ScheduleModal from "@/components/ScheduleModal"
import ProfileDropdown from "@/components/ProfileDropdown"

// Types and Interfaces
interface GeneratedPost {
  id: number
  content: string
  tone: PostTone
  engagement: EngagementLevel
  score: number
}

type UserPlan = "free" | "pro" | "enterprise"
type PostTone = "professional" | "friendly" | "assertive" | "inspirational" | "casual" | "thought-provoking"
type PostLength = "short" | "medium" | "long"
type EngagementLevel = "Very High" | "High" | "Medium" | "Low"

interface PlanLimit {
  maxPosts: number
  name: string
}

interface Template {
  title: string
  desc: string
  emoji: string
  prompt: string
}

interface MediaType {
  icon: typeof ImageIcon
  label: string
  engagement: string
  color: string
  borderColor: string
}

// Constants
const PLAN_LIMITS: Record<UserPlan, PlanLimit> = {
  free: { maxPosts: 5, name: "Free Plan" },
  pro: { maxPosts: 50, name: "Pro Plan" },
  enterprise: { maxPosts: 100, name: "Enterprise Plan" },
} as const

const POST_TEMPLATES: Template[] = [
  { title: "Lesson Learned", desc: "Share a valuable lesson from experience", emoji: "💡", prompt: "Write a lesson learned post about " },
  { title: "Industry Insight", desc: "Discuss trends in your field", emoji: "📊", prompt: "Write an industry insight post about " },
  { title: "Career Advice", desc: "Help others with professional growth", emoji: "🚀", prompt: "Write a career advice post about " },
  { title: "Behind the Scenes", desc: "Show your work process", emoji: "🎬", prompt: "Write a behind the scenes post about " },
  { title: "Hot Take", desc: "Share a controversial opinion", emoji: "🔥", prompt: "Write a hot take post about " },
  { title: "Success Story", desc: "Celebrate achievements", emoji: "🏆", prompt: "Write a success story post about " },
] as const

const TONE_OPTIONS = [
  { value: "professional", label: "🎯 Professional" },
  { value: "friendly", label: "😊 Friendly" },
  { value: "assertive", label: "💪 Assertive" },
  { value: "inspirational", label: "✨ Inspirational" },
  { value: "casual", label: "😎 Casual" },
  { value: "thought-provoking", label: "🤔 Thought-Provoking" },
] as const

const LENGTH_OPTIONS = [
  { value: "short", label: "📝 Short (50-100 words)" },
  { value: "medium", label: "📄 Medium (100-200 words)" },
  { value: "long", label: "📚 Long (200+ words)" },
] as const

const MEDIA_TYPES: MediaType[] = [
  { icon: ImageIcon, label: "Add Image", engagement: "+65% engagement", color: "text-[#0077B5]", borderColor: "border-[#0077B5]" },
  { icon: Video, label: "Add Video", engagement: "+120% engagement", color: "text-purple-400", borderColor: "border-purple-500" },
  { icon: FileText, label: "Add Document", engagement: "+45% engagement", color: "text-green-400", borderColor: "border-green-500" },
] as const

const MOCK_POSTS = [
  "🚀 Just shipped a game-changing feature that reduces load times by 60%! The journey wasn't easy - 3 weeks of debugging, countless coffee cups, and moments of doubt. But here's what I learned: Every 'impossible' problem has a solution waiting to be discovered. What's the most challenging technical problem you've solved recently? 👇",
  "💡 The best career advice I wish I knew 5 years ago: Your network is your net worth, but authenticity is your currency. Stop trying to impress everyone and start being genuinely helpful. Share knowledge, celebrate others' wins, and ask thoughtful questions. The opportunities will follow naturally.",
  "🎯 Unpopular opinion: Most productivity hacks are just procrastination in disguise. I spent years optimizing my workflow instead of actually working. The real game-changer? Time blocking and saying no to everything that doesn't align with my top 3 priorities. Simple beats complex every time."
] as const

// Animation variants
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

// Utility functions
const getEngagementColor = (engagement: EngagementLevel): string => {
  const colorMap: Record<EngagementLevel, string> = {
    "Very High": "text-green-400 bg-green-400/10 border-green-400/20",
    "High": "text-blue-400 bg-blue-400/10 border-blue-400/20",
    "Medium": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    "Low": "text-gray-400 bg-gray-400/10 border-gray-400/20",
  }
  return colorMap[engagement] || colorMap.Low
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return "text-green-400"
  if (score >= 80) return "text-blue-400"
  if (score >= 70) return "text-yellow-400"
  return "text-gray-400"
}

const generateMockPost = (index: number, tone: PostTone): GeneratedPost => ({
  id: index + 1,
  content: MOCK_POSTS[index] || MOCK_POSTS[0],
  tone,
  engagement: (["Very High", "High", "Medium"] as const)[Math.floor(Math.random() * 3)],
  score: Math.floor(Math.random() * 20) + 80,
})

// Custom hooks
const usePostGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  const generatePosts = useCallback(async (
    input: string,
    tone: PostTone,
    postCount: number,
    postLength: PostLength
  ): Promise<GeneratedPost[]> => {
    if (!input.trim()) return []

    setIsGenerating(true)
    setGenerationProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      // TODO: Replace with actual API call
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: input, tone, count: postCount, length: postLength }),
      })

      if (response.ok) {
        const data = await response.json()
        const posts = data.posts?.slice(0, postCount).map((content: string, index: number) => 
          generateMockPost(index, tone)
        ) || []
        
        setGenerationProgress(100)
        return posts
      }
    } catch (error) {
      console.error("Error generating posts:", error)
    } finally {
      // Fallback to mock data for demo
      setTimeout(() => {
        setGenerationProgress(100)
        clearInterval(progressInterval)
      }, 1000)
    }

    // Return mock data
    return Array.from({ length: postCount }, (_, index) => generateMockPost(index, tone))
  }, [])

  const resetGeneration = useCallback(() => {
    setIsGenerating(false)
    setGenerationProgress(0)
  }, [])

  return { isGenerating, generationProgress, generatePosts, resetGeneration, setIsGenerating }
}

// Components
const Header: React.FC<{
  showBackButton?: boolean
  onBack?: () => void
  onMenuClick?: () => void
}> = ({ showBackButton, onBack, onMenuClick }) => (
  <motion.header
    className="sticky top-0 z-40 flex items-center justify-between p-4 bg-[#2d3748] border-b border-[#374151] backdrop-blur-md shadow-xl"
    {...fadeInUp}
  >
    {showBackButton ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Generator
      </Button>
    ) : (
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden text-gray-400 hover:text-white hover:bg-white/10"
      >
        <Sparkles className="w-6 h-6" />
      </Button>
    )}
    
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-[#0077B5] rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg">
        LP
      </div>
      <span className="font-semibold text-[#0077B5] hidden sm:block">LinkedPilot</span>
    </div>
    
    <ProfileDropdown />
  </motion.header>
)

const PerformanceOverview: React.FC<{ posts: GeneratedPost[] }> = ({ posts }) => {
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

const PostCard: React.FC<{
  post: GeneratedPost
  index: number
  totalPosts: number
  isExpanded: boolean
  onToggleExpand: () => void
  onSchedule: () => void
  onCopy: () => void
}> = ({ post, index, totalPosts, isExpanded, onToggleExpand, onSchedule, onCopy }) => {
  const shouldShowMore = post.content.length > 200

  return (
    <motion.div
      className="bg-[#2d3748] rounded-xl p-6 border border-[#374151] shadow-xl hover:shadow-2xl transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.01, y: -2 }}
    >
      {/* Post Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-[#0077B5] text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
            Post {post.id}/{totalPosts}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEngagementColor(post.engagement)}`}>
            {post.engagement} Engagement
          </span>
          <div className="flex items-center gap-1">
            <Zap className={`w-4 h-4 ${getScoreColor(post.score)}`} />
            <span className={`text-sm font-bold ${getScoreColor(post.score)}`}>{post.score}/100</span>
          </div>
        </div>
        <button
          className="flex items-center gap-2 text-[#0077B5] text-sm hover:underline transition-colors"
          onClick={onToggleExpand}
        >
          <Eye className="w-4 h-4" />
          {isExpanded ? "Collapse" : "Full View"}
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-6">
        <div className={`text-gray-300 leading-relaxed text-lg ${isExpanded ? "" : "line-clamp-4"}`}>
          {post.content}
        </div>
        {shouldShowMore && (
          <button
            className="text-[#0077B5] text-sm mt-2 hover:underline transition-colors"
            onClick={onToggleExpand}
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>

      {/* Media Attachment Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-[#0077B5] rounded-full"></div>
          <span className="text-[#0077B5] text-sm font-medium">Media Attachment</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MEDIA_TYPES.map((media, index) => {
            const IconComponent = media.icon
            return (
              <div
                key={index}
                className={`border-2 border-dashed ${media.borderColor} rounded-lg p-4 text-center bg-[#1a1d29] hover:bg-[#374151]/20 transition-colors cursor-pointer group`}
              >
                <IconComponent className={`w-8 h-8 ${media.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                <p className="text-gray-300 text-sm">{media.label}</p>
                <p className="text-xs text-gray-500">{media.engagement}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Button
          className="bg-[#0077B5] hover:bg-[#004182] text-white shadow-lg transition-all duration-300 text-sm sm:text-base"
          onClick={onSchedule}
        >
          <Clock className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Schedule</span>
          <span className="sm:hidden">Schedule</span>
        </Button>

        <Button
          variant="outline"
          className="border-[#374151] bg-[#2d3748] text-white hover:bg-[#374151] transition-all duration-300 text-sm sm:text-base"
        >
          <Edit3 className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Edit</span>
          <span className="sm:hidden">Edit</span>
        </Button>

        <Button className="bg-green-500 hover:bg-green-600 text-white shadow-lg transition-all duration-300 text-sm sm:text-base">
          <Share2 className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Post Now</span>
          <span className="sm:hidden">Post</span>
        </Button>

        <Button
          variant="outline"
          className="border-[#374151] bg-[#2d3748] text-white hover:bg-[#374151] transition-all duration-300 text-sm sm:text-base"
          onClick={onCopy}
        >
          <Copy className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Copy</span>
          <span className="sm:hidden">Copy</span>
        </Button>
      </div>
    </motion.div>
  )
}

const QuickTemplates: React.FC<{ onTemplateSelect: (prompt: string) => void }> = ({ onTemplateSelect }) => (
  <motion.div
    className="bg-[#2d3748] rounded-xl p-4 sm:p-6 border border-[#374151] shadow-xl"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
  >
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <Sparkles className="w-5 h-5 text-[#0077B5]" />
      Quick Templates
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {POST_TEMPLATES.map((template, index) => (
        <button
          key={index}
          onClick={() => onTemplateSelect(template.prompt)}
          className="p-3 sm:p-4 bg-[#1a1d29] rounded-lg border border-[#374151] hover:border-[#0077B5] transition-all duration-300 text-left group hover:scale-105"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{template.emoji}</span>
            <span className="font-medium text-white group-hover:text-[#0077B5] transition-colors text-sm sm:text-base">
              {template.title}
            </span>
          </div>
          <p className="text-xs text-gray-400">{template.desc}</p>
        </button>
      ))}
    </div>
  </motion.div>
)

// Main Component
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

  const handleTemplateSelect = useCallback((prompt: string) => {
    setInput(prompt)
  }, [])

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
          {/* Results Header */}
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

          {/* Generated Posts */}
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
              />
            ))}
          </div>

          {/* Generate More Button */}
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleBackToGenerator}
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 text-lg shadow-lg rounded-lg transform hover:scale-105 transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2" />
              Generate More Posts
            </Button>
          </motion.div>
        </div>

        {/* Schedule Modal */}
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false)
            setSelectedPostForSchedule(null)
          }}
          onSchedule={(scheduleData) => {
            console.log("Scheduled:", scheduleData, "for post:", selectedPostForSchedule)
            setShowScheduleModal(false)
            setSelectedPostForSchedule(null)
          }}
        />
      </div>
    )
  }

  // Generator View
  return (
    <div className="min-h-screen bg-[#1a1d29] text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-3 sm:p-4 lg:p-8 max-w-4xl mx-auto">
          {/* Main Header */}
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
            {/* Controls Section */}
            <div className="bg-[#2d3748] rounded-xl p-3 sm:p-4 lg:p-6 border border-[#374151] shadow-xl">
              {/* Top Row: Tone and Number of Posts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Tone Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                    <Mic className="w-4 h-4 text-[#0077B5]" />
                    Select Tone
                  </label>
                  <Select value={tone} onValueChange={(value: PostTone) => setTone(value)}>
                    <SelectTrigger className="w-full bg-[#1a1d29] border-[#374151] text-white focus:border-[#0077B5] transition-all duration-300 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2d3748] border-[#374151]">
                      {TONE_OPTIONS.map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value} 
                          className="text-white hover:bg-[#374151]"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Post Count Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-[#0077B5]" />
                    Number of Posts
                    {userPlan === "free" && (
                      <Crown className="w-4 h-4 text-yellow-400" title="Upgrade for more posts" />
                    )}
                  </label>
                  <div className="flex items-center gap-2 h-11">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePostCountChange(-1)}
                      disabled={postCount <= 1}
                      className="border-[#374151] text-gray-300 hover:bg-[#374151] bg-transparent disabled:opacity-50 h-11 w-11 flex-shrink-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <Input
                        type="number"
                        min="1"
                        max={currentPlanLimit.maxPosts}
                        value={postCount}
                        onChange={(e) => handlePostCountInput(e.target.value)}
                        className="text-center bg-[#1a1d29] border-[#374151] text-white focus:border-[#0077B5] h-11"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePostCountChange(1)}
                      disabled={postCount >= currentPlanLimit.maxPosts}
                      className="border-[#374151] text-gray-300 hover:bg-[#374151] bg-transparent disabled:opacity-50 h-11 w-11 flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Max {currentPlanLimit.maxPosts} posts ({currentPlanLimit.name})
                    {userPlan === "free" && <span className="text-yellow-400 ml-1">• Upgrade for more</span>}
                  </p>
                </div>
              </div>

              {/* Input Area */}
              <div className="relative mb-6">
                <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0077B5]" />
                  Your Post Idea
                </label>
                <Textarea
                  placeholder={`Describe your post idea in detail... 

Examples:
• Share a lesson learned from a recent project failure
• Discuss the future of remote work in tech
• Give career advice for new graduates
• Share insights about industry trends
• Tell a story about overcoming challenges`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-[160px] sm:min-h-[200px] bg-[#1a1d29] border-[#374151] text-white placeholder-gray-400 focus:border-[#0077B5] resize-none text-base sm:text-lg leading-relaxed shadow-lg transition-all duration-300"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                  {input.length}/500 characters
                </div>
              </div>

              {/* Bottom Toolbar */}
              <div className="space-y-4">
                {/* Media Tools Row */}
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

                {/* Bottom Controls Row */}
                <div className="flex flex-col gap-4">
                  {/* Post Length */}
                  <div className="w-full">
                    <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0077B5]" />
                      Post Length
                    </label>
                    <Select value={postLength} onValueChange={(value: PostLength) => setPostLength(value)}>
                      <SelectTrigger className="w-full bg-[#1a1d29] border-[#374151] text-white focus:border-[#0077B5] transition-all duration-300 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2d3748] border-[#374151]">
                        {LENGTH_OPTIONS.map((option) => (
                          <SelectItem 
                            key={option.value} 
                            value={option.value} 
                            className="text-white hover:bg-[#374151]"
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Credits and Generate Button Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="text-left sm:text-right order-2 sm:order-1">
                      <div className="text-gray-400 text-sm">Credits: ∞</div>
                      <div className="text-xs text-gray-500">{currentPlanLimit.name}</div>
                    </div>
                    <div className="order-1 sm:order-2 w-full sm:w-auto">
                      <Button
                        onClick={handleGeneratePosts}
                        disabled={!input.trim() || isGenerating}
                        className="w-full px-6 py-3 bg-[#0077B5] hover:bg-[#004182] rounded-full disabled:opacity-50 disabled:cursor-not-allowed shadow-xl transform hover:scale-105 transition-all duration-300 text-base font-medium text-white"
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
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <QuickTemplates onTemplateSelect={handleTemplateSelect} />
          </motion.div>

          {/* Loading State */}
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

                  {/* Progress Bar */}
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