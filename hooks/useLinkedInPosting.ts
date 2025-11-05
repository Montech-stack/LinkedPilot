// hooks/useLinkedInPosting.ts
"use client";
import { useState } from "react";
import { PostData, PostResult } from "../types";

export const useLinkedInPosting = () => {
  const [isPosting, setIsPosting] = useState(false);

  const postToLinkedIn = async (postData: PostData): Promise<PostResult> => {
    setIsPosting(true);

    try {
      console.log("Sending:", { content: postData.content, hasMedia: !!postData.media });

      const response = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postData.content,
          media: postData.media,
          mediaType: postData.mediaType,
        }),
      });

      const result = await response.json();
      setIsPosting(false);

      if (result.success) {
        return { success: true, postId: result.postId };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      setIsPosting(false);
      console.error(error);
      return { success: false, error: "Network error" };
    }
  };

  return { postToLinkedIn, isPosting };
};