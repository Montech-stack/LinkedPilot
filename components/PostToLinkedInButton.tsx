"use client";
import React, { useState } from "react";
import { Loader2, Share2, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
  content: string;
  media?: string | null;
  mediaType?: "image" | "video" | null;
  onSuccess?: () => void;
  onError?: () => void;
  isLinkedInConnected: boolean;
  className?: string;
}

export default function PostToLinkedInButton({
  content,
  media,
  mediaType,
  onSuccess,
  onError,
  isLinkedInConnected,
  className,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [posted, setPosted] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, media, mediaType }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to post");
        onError?.();
        setLoading(false);
        return;
      }

      toast.success("✅ Posted successfully!");
      setPosted(true);
      onSuccess?.();
    } catch (error) {
      toast.error("Network error");
      onError?.();
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handlePost}
      disabled={loading || posted}
      className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {posted ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-400" />
          Posted!
        </>
      ) : loading ? (
        <>
          <Loader2 className="animate-spin w-4 h-4" />
          Posting...
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Post
        </>
      )}
    </button>
  );
}
