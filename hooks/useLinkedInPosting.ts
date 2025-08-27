"use client"
import { useState } from "react"
import { PostData, PostResult } from "../types"

export const useLinkedInPosting = () => {
  const [isPosting, setIsPosting] = useState(false)
  
  const postToLinkedIn = async (postData: PostData): Promise<PostResult> => {
    setIsPosting(true)
    
    try {
      console.log('Sending content to backend:', postData.content)
      
      const response = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: postData.content,
        }),
      })
      
      const result = await response.json()
      
      setIsPosting(false)
      
      if (result.success) {
        return { 
          success: true, 
          postId: result.postId 
        }
      } else {
        return { 
          success: false, 
          error: result.error || 'Failed to post to LinkedIn' 
        }
      }
      
    } catch (error) {
      setIsPosting(false)
      console.error('Error posting to LinkedIn:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to post to LinkedIn' 
      }
    }
  }

  return { postToLinkedIn, isPosting }
}