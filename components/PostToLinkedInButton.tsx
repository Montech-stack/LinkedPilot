"use client"
import React, { useState } from "react"
import { Loader2, Share2, CheckCircle, AlertCircle } from "lucide-react"
import { useLinkedInAuth } from "../hooks/useLinkedInAuth"
import { useLinkedInPosting } from "../hooks/useLinkedInPosting"
import { PostToLinkedInButtonProps } from "../types"

const PostToLinkedInButton: React.FC<PostToLinkedInButtonProps> = ({ content, onSuccess, onError, className }) => {
  const { isAuthenticated, isLoading: authLoading, authenticate } = useLinkedInAuth()
  const { postToLinkedIn, isPosting } = useLinkedInPosting()
  const [postStatus, setPostStatus] = useState<'idle' | 'success' | 'error' | 'needs_auth'>('idle')

  const handlePost = async () => {
    console.log("Post button clicked with content:", content)
    console.log("Checking authentication...")
    
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
      
      {postStatus === 'error' && (
        <div className="flex items-center gap-1 text-red-400 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>Failed to post to LinkedIn</span>
        </div>
      )}
    </div>
  )
}

export default PostToLinkedInButton