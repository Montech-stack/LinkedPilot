// components/PostToLinkedInButton.tsx
import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Share2, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useLinkedInAuth } from '../hooks/useLinkedInAuth'
import { useLinkedInPosting } from '../hooks/useLinkedInPosting'
import LinkedInAuthButton from './LinkedInAuthButton'

interface PostToLinkedInButtonProps {
  content: string
  onSuccess?: (postId: string) => void
  onError?: (error: string) => void
  className?: string
}

const PostToLinkedInButton: React.FC<PostToLinkedInButtonProps> = ({
  content,
  onSuccess,
  onError,
  className
}) => {
  const { isAuthenticated, isLoading: authLoading } = useLinkedInAuth()
  const { postToLinkedIn, isPosting } = useLinkedInPosting()
  const [postStatus, setPostStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handlePost = async () => {
    if (!isAuthenticated) {
      return // This shouldn't happen if the component is rendered correctly
    }

    const result = await postToLinkedIn({ content })

    if (result.success && result.postId) {
      setPostStatus('success')
      onSuccess?.(result.postId)
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setPostStatus('idle')
      }, 3000)
    } else {
      setPostStatus('error')
      onError?.(result.error || 'Unknown error occurred')
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setPostStatus('idle')
      }, 3000)
    }
  }

  if (authLoading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-2">
        <LinkedInAuthButton className={className} />
        <p className="text-xs text-gray-400 text-center">
          Connect your LinkedIn account to post directly
        </p>
      </div>
    )
  }

  const getButtonContent = () => {
    switch (postStatus) {
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
            <span className="hidden sm:inline">Posted Successfully!</span>
            <span className="sm:hidden">Posted!</span>
          </>
        )
      case 'error':
        return (
          <>
            <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
            <span className="hidden sm:inline">Failed to Post</span>
            <span className="sm:hidden">Failed</span>
          </>
        )
      default:
        if (isPosting) {
          return (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span className="hidden sm:inline">Posting...</span>
              <span className="sm:hidden">Posting...</span>
            </>
          )
        }
        return (
          <>
            <Share2 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Post Now</span>
            <span className="sm:hidden">Post</span>
          </>
        )
    }
  }

  const getButtonStyles = () => {
    switch (postStatus) {
      case 'success':
        return "bg-green-500 hover:bg-green-600 text-white"
      case 'error':
        return "bg-red-500 hover:bg-red-600 text-white"
      default:
        return "bg-green-500 hover:bg-green-600 text-white"
    }
  }

  return (
    <Button
      onClick={handlePost}
      disabled={isPosting || postStatus === 'success'}
      className={`${getButtonStyles()} shadow-lg transition-all duration-300 ${className}`}
    >
      {getButtonContent()}
    </Button>
  )
}

export default PostToLinkedInButton