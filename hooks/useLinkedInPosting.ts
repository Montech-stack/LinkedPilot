// Updated hooks/useLinkedInPosting.ts for App Router
import { useState } from 'react'
import { useLinkedInAuth } from './useLinkedInAuth'

interface PostData {
  content: string
  visibility?: 'PUBLIC' | 'CONNECTIONS'
}

interface PostResponse {
  success: boolean
  postId?: string
  error?: string
}

export const useLinkedInPosting = () => {
  const [isPosting, setIsPosting] = useState(false)
  const { accessToken, isAuthenticated } = useLinkedInAuth()

  const postToLinkedIn = async (postData: PostData): Promise<PostResponse> => {
    if (!isAuthenticated || !accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    setIsPosting(true)

    try {
      const response = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          content: postData.content,
          visibility: postData.visibility || 'PUBLIC'
        })
      })

      const result = await response.json()

      if (response.ok) {
        return { success: true, postId: result.postId }
      } else {
        return { success: false, error: result.error || 'Failed to post' }
      }
    } catch (error) {
      console.error('Error posting to LinkedIn:', error)
      return { success: false, error: 'Network error occurred' }
    } finally {
      setIsPosting(false)
    }
  }

  return {
    postToLinkedIn,
    isPosting
  }
}