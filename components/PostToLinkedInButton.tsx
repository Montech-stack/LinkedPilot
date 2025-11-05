// components/PostToLinkedInButton.tsx  (replace your existing file)
"use client"
import React, { useState, useEffect, useRef } from "react"
import { Loader2, Share2, CheckCircle, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

interface Props {
  content: string
  media?: string | null
  mediaType?: 'image' | 'video' | null
  onSuccess?: (postId: string) => void
  onError?: (error: string) => void
  className?: string
  isLinkedInConnected?: boolean // optional prop but we still verify server-side
}

const PostToLinkedInButton: React.FC<Props> = ({ content, media, mediaType, onSuccess, onError, className, isLinkedInConnected }) => {
  const [isPosting, setIsPosting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'needs_auth' | 'success' | 'error'>('idle')
  const popupRef = useRef<Window | null>(null)
  const pendingPostRef = useRef<{ content: string, media?: string | null, mediaType?: string | null } | null>(null)

  // Helper: post to server directly (ensures cookies are sent via credentials: 'include')
  const postToLinkedInDirect = async (payload: { content: string, media?: string | null, mediaType?: string | null }) => {
    setIsPosting(true)
    try {
      const res = await fetch('/api/linkedin/post', {
        method: 'POST',
        credentials: 'include', // IMPORTANT - send cookies
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to post')
      }
      setStatus('success')
      onSuccess?.(data.postId)
      toast.success(media ? "Posted with media!" : "Posted to LinkedIn!")
    } catch (err: any) {
      console.error('Post error:', err)
      setStatus('error')
      onError?.(err?.message || 'Failed to post')
      toast.error('Failed to post to LinkedIn')
    } finally {
      setIsPosting(false)
      // reset status back to idle after a short delay so user can post again
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  // Listen for postMessage from popup (the callback HTML posts this)
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data) return
      if (e.data?.type === 'linkedin-auth-success') {
        // popup reported success — close it if open
        if (popupRef.current && !popupRef.current.closed) {
          popupRef.current.close()
        }
        // if a post was pending, perform it now
        if (pendingPostRef.current) {
          postToLinkedInDirect(pendingPostRef.current)
          pendingPostRef.current = null
        }
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Called when "Connect" is clicked
  const openAuthPopup = () => {
    // open LinkedIn auth route in popup
    const width = 600, height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    popupRef.current = window.open('/auth/linkedin', 'linkedin_auth', `width=${width},height=${height},left=${left},top=${top}`)
    // If popup blocked, fallback: navigate in current tab
    if (!popupRef.current) {
      window.location.href = '/auth/linkedin'
    }
  }

  const handleAuthenticate = () => {
    setStatus('needs_auth')
    openAuthPopup()
  }

  const handlePostClick = async () => {
    // Quick validation
    if (!content || content.trim().length === 0) {
      toast.error('Content is empty')
      return
    }

    // Check server-side auth status before posting
    try {
      setIsPosting(true)
      const statusRes = await fetch('/api/linkedin/status', { credentials: 'include' })
      const statusJson = await statusRes.json()
      if (!statusJson.isAuthenticated) {
        // queue post, open auth popup
        pendingPostRef.current = { content, media, mediaType }
        setStatus('needs_auth')
        openAuthPopup()
        setIsPosting(false)
        return
      }
      // if authenticated, post directly
      await postToLinkedInDirect({ content, media, mediaType })
    } catch (err) {
      console.error('Auth check failed:', err)
      setIsPosting(false)
      toast.error('Auth check failed')
    }
  }

  // Render
  if (status === 'needs_auth') {
    return (
      <div className="w-full">
        <div className="text-xs text-yellow-400 text-center mb-2">Connect LinkedIn to post</div>
        <div className="flex gap-2">
          <button
            onClick={handleAuthenticate}
            className="flex-1 bg-[#0077B5] hover:bg-[#004182] text-white px-3 py-2 rounded-lg flex items-center justify-center text-sm transition-colors"
          >
            <Share2 className="w-4 h-4 mr-1" /> Connect
          </button>
          <button
            onClick={() => setStatus('idle')}
            className="px-3 py-2 border border-gray-500 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <button
        onClick={handlePostClick}
        disabled={isPosting || status === 'success'}
        className={`w-full ${className ?? ''} ${isPosting ? 'opacity-60 cursor-not-allowed' : ''} bg-[#0077B5] hover:bg-[#004182] text-white shadow-lg px-3 py-2 rounded-lg flex items-center justify-center transition-colors`}
      >
        {isPosting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" /> Posted
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 mr-2" /> Post
          </>
        )}
      </button>

      {status === 'error' && (
        <div className="flex items-center gap-1 text-red-400 text-xs mt-2">
          <AlertCircle className="w-3 h-3" />
          <span>Failed to post to LinkedIn</span>
        </div>
      )}
    </div>
  )
}

export default PostToLinkedInButton
