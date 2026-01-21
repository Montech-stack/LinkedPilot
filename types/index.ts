export type UserPlan = "free" | "starter" | "creator" | "pro" | "enterprise"
export type PostPlatform = "LinkedIn" | "Twitter" | "Instagram" | "Facebook"
export type PostTone = "professional" | "friendly" | "assertive" | "inspirational" | "casual" | "thought-provoking"
export type PostLength = "short" | "medium" | "long"

export interface GeneratedPost {
  id?: string | number
  content: string
  platform?: string
  tone?: PostTone
  length?: PostLength
  media?: string | null
  mediaType?: "image" | "video" | null
  createdAt?: string
}

export interface PlanLimit {
  maxPosts: number
  name: string
}

export interface ToneOption {
  value: PostTone
  label: string
}

export interface LengthOption {
  value: PostLength
  label: string
}
