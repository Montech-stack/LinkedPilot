import { ImageIcon, Video, FileText } from "lucide-react"
import { EngagementLevel, PlanLimit, PostTone, PostLength, ToneOption, LengthOption, MediaType } from "../types"

export const PLAN_LIMITS: Record<string, PlanLimit> = {
  free: { maxPosts: 5, name: "Free Plan" },
  pro: { maxPosts: 50, name: "Pro Plan" },
  enterprise: { maxPosts: 100, name: "Enterprise Plan" },
}

export const TONE_OPTIONS: ToneOption[] = [
  { value: "professional", label: "🎯 Professional" },
  { value: "friendly", label: "😊 Friendly" },
  { value: "assertive", label: "💪 Assertive" },
  { value: "inspirational", label: "✨ Inspirational" },
  { value: "casual", label: "😎 Casual" },
  { value: "thought-provoking", label: "🤔 Thought-Provoking" },
]

export const LENGTH_OPTIONS: LengthOption[] = [
  { value: "short", label: "📝 Short (50-100 words)" },
  { value: "medium", label: "📄 Medium (100-200 words)" },
  { value: "long", label: "📚 Long (200+ words)" },
]

export const MEDIA_TYPES: MediaType[] = [
  { icon: ImageIcon, label: "Add Image", engagement: "+65% engagement", color: "text-[#0077B5]", borderColor: "border-[#0077B5]" },
  { icon: Video, label: "Add Video", engagement: "+120% engagement", color: "text-purple-400", borderColor: "border-purple-500" },
  { icon: FileText, label: "Add Document", engagement: "+45% engagement", color: "text-green-400", borderColor: "border-green-500" },
]

export const getEngagementColor = (engagement: EngagementLevel): string => {
  const colorMap: Record<EngagementLevel, string> = {
    "Very High": "text-green-400 bg-green-400/10 border-green-400/20",
    "High": "text-blue-400 bg-blue-400/10 border-blue-400/20",
    "Medium": "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    "Low": "text-gray-400 bg-gray-400/10 border-gray-400/20",
  }
  return colorMap[engagement] || colorMap.Low
}

export const getScoreColor = (score: number): string => {
  if (score >= 90) return "text-green-400"
  if (score >= 80) return "text-blue-400"
  if (score >= 70) return "text-yellow-400"
  return "text-gray-400"
}