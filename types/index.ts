export type UserPlan = "free" | "pro" | "enterprise"
export type PostTone = "professional" | "friendly" | "assertive" | "inspirational" | "casual" | "thought-provoking"
export type PostLength = "short" | "medium" | "long"
export type EngagementLevel = "Very High" | "High" | "Medium" | "Low"

export interface GeneratedPost {
  id: number
  content: string
  tone: PostTone
  engagement: EngagementLevel
  score: number
}

export interface PlanLimit {
  maxPosts: number
  name: string
}

export interface MediaType {
  icon: any // Note: In a real application, this should be a specific type (e.g., React.ComponentType)
  label: string
  engagement: string
  color: string
  borderColor: string
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  profile: { firstName: string; lastName: string } | null
  accessToken: string | null
}

export interface PostData {
  content: string
  tone?: PostTone
  length?: PostLength
}

export interface PostResult {
  success: boolean
  postId?: string
  error?: string
}

export interface ToneOption {
  value: PostTone
  label: string
}

export interface LengthOption {
  value: PostLength
  label: string
}

export interface HeaderProps {
  showBackButton?: boolean
  onBack?: () => void
  onMenuClick?: () => void
}

export interface PerformanceOverviewProps {
  posts: GeneratedPost[]
}

export interface PostCardProps {
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

export interface LinkedInAuthButtonProps {
  onAuthenticated?: () => void
  className?: string
}

export interface PostToLinkedInButtonProps {
  content: string
  onSuccess?: (postId: string) => void
  onError?: (error: string) => void
  className?: string
}