"use client"

import React, { useState, useEffect, useRef } from "react"
import { Loader2, Share2, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

interface Props {
  content: string
  media?: string | null
  mediaType?: "image" | "video" | null
  onSuccess?: (postId: string) => void
  onError?: (error: string) => void
  className?: string
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
  const [status, setStatus] = useState<"idle" | "needs_auth" | "error">("idle")
  const popupRef = useRef<Window | null>(null)
  const pendingPostRef = useRef<{
    content: string
    media?: string | null
    mediaType?: string | null
  } | null>(null)

  // --------------------------
  // 🔹 Post directly to LinkedIn
  // --------------------------
  const postToLinkedInDirect = async (payload: {
    content: string
    media?: string | null
    mediaType?: string | null
  }) => {
    console.log("🔹 Posting to LinkedIn:", payload)
    setIsPosting(true)

    try {
      const res = await fetch("/api/linkedin/post", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      // Try refresh if token expired
      if (res.status === 401) {
        console.log("🔄 Token expired, attempting refresh...")
        const refreshRes = await fetch("/api/linkedin/refresh")
        if (refreshRes.ok) {
          console.log("✅ Token refreshed, retrying post...")
          return postToLinkedInDirect(payload)
        } else {
          console.log("❌ Token refresh failed, need re-auth")
          pendingPostRef.current = payload
          setStatus("needs_auth")
          setIsPosting(false)
          return
        }
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "LinkedIn post failed")

      toast.success(payload.media ? "✅ Posted with media!" : "✅ Posted to LinkedIn!")
      onSuccess?.(data.postId ?? "success")
      setStatus("idle")
    } catch (err: any) {
      console.error("❌ Post error:", err)
      setStatus("error")
      toast.error("Failed to post to LinkedIn")
      onError?.(err.message || "Failed to post to LinkedIn")
    } finally {
      setIsPosting(false)
    }
  }

  // --------------------------
  // 🔹 Listen for popup auth success
  // --------------------------
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data) return
      if (e.data.type === "linkedin-auth-success") {
        console.log("✅ LinkedIn auth success received from popup")
        popupRef.current?.close()
        if (pendingPostRef.current) {
          console.log("🔁 Retrying pending post after auth...")
          postToLinkedInDirect(pendingPostRef.current)
          pendingPostRef.current = null
        }
      }
    }

    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  // --------------------------
  // 🔹 Open LinkedIn auth popup
  // --------------------------
  const openAuthPopup = () => {
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    popupRef.current = window.open(
      "/api/linkedin/login",
      "linkedin_auth",
      `width=${width},height=${height},left=${left},top=${top}`
    )

    if (!popupRef.current) {
      // fallback redirect
      window.location.href = "/api/linkedin/login"
    }
  }

  // --------------------------
  // 🔹 Handle Post Button Click
  // --------------------------
  const handlePostClick = async () => {
    if (!content || content.trim().length === 0) {
      toast.error("Post content cannot be empty")
      return
    }

    console.log("🔍 Checking LinkedIn session before posting...")
    setIsPosting(true)

    try {
      const statusRes = await fetch("/api/linkedin/status", {
        credentials: "include",
      })
      const statusJson = await statusRes.json()
      console.log("🔹 LinkedIn status:", statusJson)

      if (!statusJson.isAuthenticated) {
        console.log("⚠️ Not authenticated, opening popup...")
        pendingPostRef.current = { content, media, mediaType }
        setStatus("needs_auth")
        setIsPosting(false)
        openAuthPopup()
        return
      }

      await postToLinkedInDirect({ content, media, mediaType })
    } catch (err) {
      console.error("❌ Auth check failed:", err)
      toast.error("LinkedIn auth check failed")
    } finally {
      setIsPosting(false)
    }
  }

  // --------------------------
  // 🔹 UI RENDER
  // --------------------------
  return (
    <div className="w-full">
      {status === "needs_auth" ? (
        <div>
          <div className="text-xs text-yellow-400 text-center mb-2">
            Please connect LinkedIn to continue
          </div>
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
      ) : (
        <button
          onClick={handlePostClick}
          disabled={isPosting}
          className={`w-full ${className ?? ""} ${
            isPosting ? "opacity-60 cursor-not-allowed" : ""
          } bg-[#0077B5] hover:bg-[#004182] text-white shadow-lg px-3 py-2 rounded-lg flex items-center justify-center transition-colors`}
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
      )}

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
