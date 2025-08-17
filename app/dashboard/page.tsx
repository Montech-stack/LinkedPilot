"use client"
import React, { useState, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, Camera, Mic, Eye, Clock, Edit3, Share2, Copy, 
  Loader2, Sparkles, Zap, TrendingUp, BarChart3, Hash, 
  ImageIcon, Video, FileText, Plus, Minus, Crown, CheckCircle, AlertCircle
} from "lucide-react"

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

interface MediaType {
  icon: typeof ImageIcon
  label: string
  engagement: string
  color: string
  borderColor: string
}

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  profile: { firstName: string; lastName: string } | null
  accessToken: string | null
}

interface PostData {
  content: string
  tone?: PostTone
  length?: PostLength
}

interface PostResult {
  success: boolean
  postId?: string
  error?: string
}

interface ToneOption {
  value: PostTone
  label: string
}

interface LengthOption {
  value: PostLength
  label: string
}

// Real LinkedIn integration components
const useLinkedInAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    profile: null,
    accessToken: null
  })

  const authenticate = () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    // LinkedIn OAuth 2.0 Authorization URL
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || 'YOUR_LINKEDIN_CLIENT_ID'
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/linkedin/callback')
    const scope = encodeURIComponent('profile openid email w_member_social')
    const state = Math.random().toString(36).substring(7) // Generate random state for security
    
    // Store state in localStorage for validation
    localStorage.setItem('linkedin_oauth_state', state)
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`
    
    // Open LinkedIn authorization in a popup window
    const popup = window.open(authUrl, 'linkedin-auth', 'width=500,height=600,scrollbars=yes,resizable=yes')
    
    // Listen for the popup to close or receive a message
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        setAuthState(prev => ({ ...prev, isLoading: false }))
      }
    }, 1000)
    
    // Listen for messages from the popup (authorization code)
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
        clearInterval(checkClosed)
        popup?.close()
        window.removeEventListener('message', messageListener)
        
        // Exchange authorization code for access token
        exchangeCodeForToken(event.data.code, state)
      } else if (event.data.type === 'LINKEDIN_AUTH_ERROR') {
        clearInterval(checkClosed)
        popup?.close()
        window.removeEventListener('message', messageListener)
        setAuthState(prev => ({ ...prev, isLoading: false }))
        console.error('LinkedIn authentication error:', event.data.error)
      }
    }
    
    window.addEventListener('message', messageListener)
  }
  
  const exchangeCodeForToken = async (code: string, state: string) => {
    try {
      // Verify state parameter
      const storedState = localStorage.getItem('linkedin_oauth_state')
      if (state !== storedState) {
        throw new Error('Invalid state parameter')
      }
      localStorage.removeItem('linkedin_oauth_state')
      
      // Exchange code for access token via your backend API
      const response = await fetch('/api/auth/linkedin/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to exchange code for token')
      }
      
      const data = await response.json()
      
      // Get user profile information
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      })
      
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile')
      }
      
      const profile = await profileResponse.json()
      
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        profile: {
          firstName: profile.given_name,
          lastName: profile.family_name,
        },
        accessToken: data.access_token,
      })
      
      // Store token securely (consider using secure storage)
      localStorage.setItem('linkedin_access_token', data.access_token)
      
    } catch (error) {
      console.error('Error exchanging code for token:', error)
      setAuthState(prev => ({ ...prev, isLoading: false }))
    }
  }
  
  // Check for existing token on component mount
  React.useEffect(() => {
    const storedToken = localStorage.getItem('linkedin_access_token')
    if (storedToken) {
      // Validate token by fetching user profile
      fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
        },
      })
      .then(response => response.json())
      .then(profile => {
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          profile: {
            firstName: profile.given_name,
            lastName: profile.family_name,
          },
          accessToken: storedToken,
        })
      })
      .catch(error => {
        console.error('Invalid stored token:', error)
        localStorage.removeItem('linkedin_access_token')
      })
    }
  }, [])

  return { ...authState, authenticate }
}

const useLinkedInPosting = () => {
  const [isPosting, setIsPosting] = useState(false)
  
  const postToLinkedIn = async (postData: PostData): Promise<PostResult> => {
    setIsPosting(true)
    
    try {
      const token = localStorage.getItem('linkedin_access_token')
      if (!token) {
        throw new Error('No access token available')
      }
      
      // First, get the user's LinkedIn person URN
      const profileResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch user profile')
      }
      
      const profile = await profileResponse.json()
      const personUrn = `urn:li:person:${profile.sub}`
      
      // Create the post using LinkedIn's UGC API
      const postPayload = {
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postData.content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      }
      
      const postResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(postPayload)
      })
      
      if (!postResponse.ok) {
        const errorData = await postResponse.json()
        throw new Error(errorData.message || 'Failed to post to LinkedIn')
      }
      
      const postResult = await postResponse.json()
      
      setIsPosting(false)
      
      return { 
        success: true, 
        postId: postResult.id 
      }
      
    } catch (error) {
      setIsPosting(false)
      console.error('Error posting to LinkedIn:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to post to LinkedIn' 
      }
    }
  }

  return { postToLinkedIn, isPosting }
}

interface LinkedInAuthButtonProps {
  onAuthenticated?: () => void
  className?: string
}

const LinkedInAuthButton: React.FC<LinkedInAuthButtonProps> = ({ onAuthenticated, className }) => {
  const { isAuthenticated, isLoading, authenticate, profile } = useLinkedInAuth()

  if (isLoading) {
    return (
      <button disabled className={`${className} opacity-50 cursor-not-allowed`}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking...
      </button>
    )
  }

  if (isAuthenticated && profile) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-400">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        Connected as {profile.firstName} {profile.lastName}
      </div>
    )
  }

  return (
    <button onClick={authenticate} className={`${className} bg-[#0077B5] hover:bg-[#004182] text-white px-4 py-2 rounded-lg flex items-center transition-colors`}>
      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Connect LinkedIn
    </button>
  )
}

interface PostToLinkedInButtonProps {
  content: string
  onSuccess?: (postId: string) => void
  onError?: (error: string) => void
  className?: string
}

const PostToLinkedInButton: React.FC<PostToLinkedInButtonProps> = ({ content, onSuccess, onError, className }) => {
  const { isAuthenticated, isLoading: authLoading, authenticate } = useLinkedInAuth()
  const { postToLinkedIn, isPosting } = useLinkedInPosting()
  const [postStatus, setPostStatus] = useState<'idle' | 'success' | 'error' | 'needs_auth'>('idle')

  const handlePost = async () => {
    console.log("Post button clicked, checking authentication...")
    
    // First check if user is authenticated
    if (!isAuthenticated) {
      console.log("User not authenticated, showing auth prompt")
      setPostStatus('needs_auth')
      return
    }

    console.log("User authenticated, starting post to LinkedIn...")
    
    try {
      const result = await postToLinkedIn({ content })
      
      console.log("Post result:", result)

      if (result.success && result.postId) {
        setPostStatus('success')
        onSuccess?.(result.postId)
        
        setTimeout(() => {
          setPostStatus('idle')
        }, 3000)
      } else {
        setPostStatus('error')
        onError?.(result.error || 'Unknown error occurred')
        
        setTimeout(() => {
          setPostStatus('idle')
        }, 3000)
      }
    } catch (error) {
      console.error("Error posting to LinkedIn:", error)
      setPostStatus('error')
      onError?.('Failed to post')
      
      setTimeout(() => {
        setPostStatus('idle')
      }, 3000)
    }
  }

  const handleAuthenticate = () => {
    console.log("Authenticating user...")
    authenticate()
    setPostStatus('idle')
  }

  const handleCancelAuth = () => {
    setPostStatus('idle')
  }

  if (authLoading) {
    return (
      <button disabled className={`${className} opacity-50 cursor-not-allowed`}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </button>
    )
  }

  // Show authentication prompt when needed
  if (postStatus === 'needs_auth') {
    return (
      <div className="space-y-2">
        <div className="text-xs text-yellow-400 text-center mb-2">
          Connect LinkedIn to post
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAuthenticate}
            className="flex-1 bg-[#0077B5] hover:bg-[#004182] text-white px-3 py-2 rounded-lg flex items-center justify-center text-sm transition-colors"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Connect
          </button>
          <button 
            onClick={handleCancelAuth}
            className="px-3 py-2 border border-gray-500 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const getButtonContent = () => {
    if (isPosting) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          <span className="hidden sm:inline">Posting...</span>
          <span className="sm:hidden">Posting...</span>
        </>
      )
    }

    if (postStatus === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
          <span className="hidden sm:inline">Posted Successfully!</span>
          <span className="sm:hidden">Posted!</span>
        </>
      )
    }

    // Default state (including error state - button remains as "Post Now")
    return (
      <>
        <Share2 className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">Post Now</span>
        <span className="sm:hidden">Post</span>
      </>
    )
  }

  const getButtonStyles = () => {
    if (postStatus === 'success') {
      return "bg-green-500 hover:bg-green-600 text-white"
    }
    // Default style for all other states (idle, error, posting)
    return "bg-green-500 hover:bg-green-600 text-white"
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePost}
        disabled={isPosting || postStatus === 'success'}
        className={`${getButtonStyles()} shadow-lg transition-all duration-300 px-4 py-2 rounded-lg flex items-center ${className}`}
      >
        {getButtonContent()}
      </button>
      
      {/* Error message display */}
      {postStatus === 'error' && (
        <div className="flex items-center gap-1 text-red-400 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>Failed to post to LinkedIn</span>
        </div>
      )}
    </div>
  )
}

// Constants
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

const MEDIA_TYPES: MediaType[] = [
  { icon: ImageIcon, label: "Add Image", engagement: "+65% engagement", color: "text-[#0077B5]", borderColor: "border-[#0077B5]" },
  { icon: Video, label: "Add Video", engagement: "+120% engagement", color: "text-purple-400", borderColor: "border-purple-500" },
  { icon: FileText, label: "Add Document", engagement: "+45% engagement", color: "text-green-400", borderColor: "border-green-500" },
]

const MOCK_POSTS: string[] = [
  "🚀 Just shipped a game-changing feature that reduces load times by 60%! The journey wasn't easy - 3 weeks of debugging, countless coffee cups, and moments of doubt. But here's what I learned: Every 'impossible' problem has a solution waiting to be discovered. What's the most challenging technical problem you've solved recently? 👇",
  "💡 The best career advice I wish I knew 5 years ago: Your network is your net worth, but authenticity is your currency. Stop trying to impress everyone and start being genuinely helpful. Share knowledge, celebrate others' wins, and ask thoughtful questions. The opportunities will follow naturally.",
  "🎯 Unpopular opinion: Most productivity hacks are just procrastination in disguise. I spent years optimizing my workflow instead of actually working. The real game-changer? Time blocking and saying no to everything that doesn't align with my top 3 priorities. Simple beats complex every time."
]

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
  engagement: (["Very High", "High", "Medium"] as EngagementLevel[])[Math.floor(Math.random() * 3)],
  score: Math.floor(Math.random() * 20) + 80,
})

// Custom hooks
const usePostGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  const generatePosts = useCallback(async (input: string, tone: PostTone, postCount: number, postLength: PostLength): Promise<GeneratedPost[]> => {
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

    // Simulate API call delay
    setTimeout(() => {
      setGenerationProgress(100)
      clearInterval(progressInterval)
    }, 1000)

    // Return mock data
    return Array.from({ length: postCount }, (_, index) => generateMockPost(index, tone))
  }, [])

  const resetGeneration = useCallback(() => {
    setIsGenerating(false)
    setGenerationProgress(0)
  }, [])

  return { isGenerating, generationProgress, generatePosts, resetGeneration, setIsGenerating }
}

// Component Interfaces
interface HeaderProps {
  showBackButton?: boolean
  onBack?: () => void
  onMenuClick?: () => void
}

interface PerformanceOverviewProps {
  posts: GeneratedPost[]
}

interface PostCardProps {
  post: GeneratedPost
  index: number
  totalPosts: number
  isExpanded: boolean
  onToggleExpand: () => void
  onSchedule: () => void
  onCopy: () => void
  onPostSuccess: (postId: string) => void
  onPostError: (error: string) => void
}

// Components
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

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  index, 
  totalPosts, 
  isExpanded, 
  onToggleExpand, 
  onSchedule, 
  onCopy,
  onPostSuccess,
  onPostError
}) => {
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
        <button
          className="bg-[#0077B5] hover:bg-[#004182] text-white shadow-lg transition-all duration-300 text-sm sm:text-base px-4 py-2 rounded-lg flex items-center justify-center"
          onClick={onSchedule}
        >
          <Clock className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Schedule</span>
          <span className="sm:hidden">Schedule</span>
        </button>

        <button className="border border-[#374151] bg-[#2d3748] text-white hover:bg-[#374151] transition-all duration-300 text-sm sm:text-base px-4 py-2 rounded-lg flex items-center justify-center">
          <Edit3 className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Edit</span>
          <span className="sm:hidden">Edit</span>
        </button>

        <PostToLinkedInButton
          content={post.content}
          onSuccess={onPostSuccess}
          onError={onPostError}
          className="shadow-lg transition-all duration-300 text-sm sm:text-base"
        />

        <button
          className="border border-[#374151] bg-[#2d3748] text-white hover:bg-[#374151] transition-all duration-300 text-sm sm:text-base px-4 py-2 rounded-lg flex items-center justify-center"
          onClick={onCopy}
        >
          <Copy className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Copy</span>
          <span className="sm:hidden">Copy</span>
        </button>
      </div>
    </motion.div>
  )
}

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
                onPostSuccess={handlePostSuccess}
                onPostError={handlePostError}
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

              {/* Input Area */}
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

                  {/* Credits and Generate Button Row */}
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