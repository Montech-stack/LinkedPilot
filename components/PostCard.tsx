import React from "react"
import { motion } from "framer-motion"
import { GeneratedPost } from "../types"
import { getEngagementColor, getScoreColor, MEDIA_TYPES } from "../utils/constants"
import { Eye, Clock, Edit3, Copy, Zap } from "lucide-react"
import PostToLinkedInButton from "./PostToLinkedInButton"

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
          className="text-sm sm:text-base"
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

export default PostCard