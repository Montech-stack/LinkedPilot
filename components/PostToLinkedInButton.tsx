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
  isLinkedInConnected?: boolean
}

const PostToLinkedInButton: React.FC<Props> = ({
  content,
  media,
  mediaType,
  onSuccess,
  onError,
  className,
}) => {
  const [isPosting, setIsPosting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'needs_auth' | 'error'>('idle')
  const popupRef = useRef<Window | null>(null)
  const pendingPostRef = useRef<{ content: string; media?: string | null; mediaType?: string | null } | null>(null)

  const postToLinkedInDirect = async (payload: {
    content: string
    media?: string | null
    mediaType?: string | null
  }) => {
    console.log("🔹 Starting LinkedIn post with payload:", payload)
    setIsPosting(true)

    try {
      const res = await fetch("/api/linkedin/post", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      console.log("🔹 LinkedIn post response:", data)

      if (!res.ok) {
        throw new Error(data?.error || "LinkedIn post failed")
      }

      onSuccess?.(data.postId)
      toast.success(payload.media ? "✅ Posted with media!" : "✅ Posted to LinkedIn!")

      // ✅ Allow reposting again right away
      setStatus("idle")
    } catch (err: any) {
      console.error("❌ Post error:", err)
      setStatus("error")
      onError?.(err?.message || "Failed to post")
      toast.error("❌ Failed to post to LinkedIn")
    } finally {
      setIsPosting(false)
    }
  }

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data) return
      console.log("🔹 Message received from popup:", e.data)

      if (e.data?.type === "linkedin-auth-success") {
        if (popupRef.current && !popupRef.current.closed) popupRef.current.close()
        if (pendingPostRef.current) {
          console.log("🔹 Auth successful, retrying pending post...")
          postToLinkedInDirect(pendingPostRef.current)
          pendingPostRef.current = null
        }
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  const openAuthPopup = () => {
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    popupRef.current = window.open("/auth/linkedin", "linkedin_auth", `width=${width},height=${height},left=${left},top=${top}`)
    if (!popupRef.current) window.location.href = "/auth/linkedin"
  }

  const handlePostClick = async () => {
    if (!content || content.trim().length === 0) {
      toast.error("Content is empty")
      return
    }

    console.log("🔹 Checking LinkedIn authentication before posting...")

    try {
      setIsPosting(true)
      const statusRes = await fetch("/api/linkedin/status", { credentials: "include" })
      const statusJson = await statusRes.json()
      console.log("🔹 LinkedIn status response:", statusJson)

      if (!statusJson.isAuthenticated) {
        pendingPostRef.current = { content, media, mediaType }
        setStatus("needs_auth")
        openAuthPopup()
        setIsPosting(false)
        return
      }

      await postToLinkedInDirect({ content, media, mediaType })
    } catch (err) {
      console.error("❌ Auth check failed:", err)
      setIsPosting(false)
      toast.error("Auth check failed")
    }
  }

  if (status === "needs_auth") {
    return (
      <div className="w-full">
        <div className="text-xs text-yellow-400 text-center mb-2">Connect LinkedIn to post</div>
        <div className="flex gap-2">
          <button
            onClick={openAuthPopup}
            className="flex-1 bg-[#0077B5] hover:bg-[#004182] text-white px-3 py-2 rounded-lg flex items-center justify-center text-sm transition-colors"
          >
            <Share2 className="w-4 h-4 mr-1" /> Connect
          </button>
          <button
            onClick={() => setStatus("idle")}
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
        disabled={isPosting}
        className={`w-full ${className ?? ""} ${isPosting ? "opacity-60 cursor-not-allowed" : ""} bg-[#0077B5] hover:bg-[#004182] text-white shadow-lg px-3 py-2 rounded-lg flex items-center justify-center transition-colors`}
      >
        {isPosting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Posting...
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 mr-2" /> Post to LinkedIn
          </>
        )}
      </button>

      {status === "error" && (
        <div className="flex items-center gap-1 text-red-400 text-xs mt-2">
          <AlertCircle className="w-3 h-3" />
          <span>Failed to post to LinkedIn</span>
        </div>
      )}
    </div>
  )
}

export default PostToLinkedInButton
