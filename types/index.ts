export interface GeneratedPost {
  id: number
  content: string
  tone: PostTone
  engagement: EngagementLevel
  score: number
}

export type UserPlan = "free" | "pro" | "enterprise"
export type PostTone = "professional" | "friendly" | "assertive" | "inspirational" | "casual" | "thought-provoking"
export type PostLength = "short" | "medium" | "long"
export type EngagementLevel = "Very High" | "High" | "Medium" | "Low"

export interface PlanLimit {
  maxPosts: number
  name: string
}

export interface MediaType {
  icon: any // Using any due to Lucide icon typing
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