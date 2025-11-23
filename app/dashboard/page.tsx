"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Loader2,
  Zap,
  Plus,
  Minus,
  SlidersHorizontal,
  Palette,
  Gauge,
  Trash2,
  Share2,
  X
} from "lucide-react";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import { usePostGeneration } from "@/hooks/usePostGeneration";
import { useRouter } from "next/navigation"
import toast from "react-hot-toast";
import {
  GeneratedPost,
  UserPlan,
  PostTone,
  PostLength,
  PlanLimit,
  ToneOption,
  LengthOption,
} from "@/types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const PLAN_LIMITS: Record<UserPlan, PlanLimit> = {
  free: { maxPosts: 5, name: "Free Plan" },
  pro: { maxPosts: 50, name: "Pro Plan" },
  enterprise: { maxPosts: 100, name: "Enterprise Plan" },
};

const TONE_OPTIONS: ToneOption[] = [
  { value: "professional", label: "🎯 Professional" },
  { value: "friendly", label: "😊 Friendly" },
  { value: "assertive", label: "💪 Assertive" },
  { value: "inspirational", label: "✨ Inspirational" },
  { value: "casual", label: "😎 Casual" },
  { value: "thought-provoking", label: "🤔 Thought-Provoking" },
];

const LENGTH_OPTIONS: LengthOption[] = [
  { value: "short", label: "📝 Short" },
  { value: "medium", label: "📄 Medium" },
  { value: "long", label: "📚 Long" },
];

export default function Dashboard() {
  const router = useRouter()
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<PostTone>("professional");
  const [postCount, setPostCount] = useState(1);
  const [postLength, setPostLength] = useState<PostLength>("medium");
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);

  // scheduling modal state
  const [scheduledPost, setScheduledPost] = useState<GeneratedPost | null>(null);
  const [scheduledAtISO, setScheduledAtISO] = useState<string>("");

  // NEW: upload & post-to-all states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null); // Ref for textarea
  const [uploadedMedia, setUploadedMedia] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<"image" | "video" | null>(null);
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);
  const [postingAllLoading, setPostingAllLoading] = useState(false);

  const { isGenerating, generatePosts, setIsGenerating } = usePostGeneration();
  const userPlan: UserPlan = "pro";
  const currentPlanLimit = PLAN_LIMITS[userPlan];

  // Function to automatically resize the textarea height
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      // 1. Reset height to 'auto' to correctly calculate scrollHeight for the current content
      textareaRef.current.style.height = "auto";
      
      // 2. Set the new height, respecting the max-h-96 (384px) defined in Tailwind
      const maxHeight = 384; 
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  // Effect to call resize function whenever the input changes
  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  // Combined change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // The useEffect handles the update, but we can call it immediately for slightly snappier response
    autoResizeTextarea();
  };


  // 1️⃣ LOAD SAVED STATE ONCE ON MOUNT (run only once)
  useEffect(() => {
    const saved = localStorage.getItem("linkedpilot_dashboard_state");
    if (!saved) return;
    
    try {
      const parsed = JSON.parse(saved);

      const normalizePost = (p: any, idx: number): GeneratedPost => {
        return {
          id: typeof p?.id === "number" ? p.id : Number(p?.id) || idx,
          content: p?.content || "",
          tone: (p?.tone as PostTone) || "professional",
          engagement: (p?.engagement as any) || "Medium",
          score: typeof p?.score === "number" ? p.score : 80,
          ...(p?.media ? { media: p.media } : {}),
          ...(p?.mediaType ? { mediaType: p.mediaType } : {}),
        } as GeneratedPost;
      };

      setInput(parsed.input || "");
      setTone(parsed.tone || "professional");
      setPostCount(parsed.postCount || 1);
      setPostLength(parsed.postLength || "medium");
      const loaded = Array.isArray(parsed.generatedPosts)
        ? parsed.generatedPosts.map((p: any, i: number) => normalizePost(p, i))
        : [];
      setGeneratedPosts(loaded);
    } catch (err) {
      console.error("Failed to parse saved dashboard state:", err);
    }
  }, []); // ✅ EMPTY dependency = run ONCE on mount only

  // 2️⃣ SYNC QUERY PARAM (read from window.location to avoid useSearchParams / Suspense requirement)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("input") || "";
    if (q && q.trim()) {
      setInput(decodeURIComponent(q));
    }
  }, []);

  // 3️⃣ PERSIST STATE (run whenever state changes)
  useEffect(() => {
    const state = {
      input,
      tone,
      postCount,
      postLength,
      generatedPosts: generatedPosts.map(p => ({
        id: p.id,
        content: p.content,
        tone: p.tone,
        engagement: p.engagement,
        score: p.score,
        media: (p as any).media || null,
        mediaType: (p as any).mediaType || null,
      })),
    };
    localStorage.setItem("linkedpilot_dashboard_state", JSON.stringify(state));
  }, [input, tone, postCount, postLength, generatedPosts]);

  useEffect(() => {
    async function checkConnection() {
      try {
        const res = await fetch("/api/linkedin/status", { credentials: "include" });
        const j = await res.json();
        setIsLinkedInConnected(!!j.isAuthenticated);
      } catch (err) {
        console.error("Failed to check LinkedIn status", err);
      }
    }
    checkConnection();
  }, []);

  // 4️⃣ GENERATE POSTS with numeric IDs (no more crypto.randomUUID)
  const handleGeneratePosts = useCallback(async () => {
    if (!input.trim()) return toast.error("Enter a post idea first!");
    setIsGenerating(true);
    try {
      const newPosts = await generatePosts(input, tone, postCount, postLength);
      // ✅ Use timestamp-based numeric IDs instead of random UUID
      const baseId = Math.floor(Date.now() / 1000);
      const withIds = newPosts.map((p, i) => ({
        ...p,
        id: baseId + i, // numeric, stable
      }));
      setGeneratedPosts((prev) => [...prev, ...withIds]);
      toast.success(`Generated ${withIds.length} post${withIds.length > 1 ? "s" : ""}!`);
    } catch {
      toast.error("Failed to generate posts");
    } finally {
      setIsGenerating(false);
    }
  }, [input, tone, postCount, postLength, generatePosts, setIsGenerating]);

  // NEW: Upload handling (opens file picker and saves base64 preview)
  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    const reader = new FileReader();
    reader.onload = () => {
      const base = reader.result as string;
      setUploadedMedia(base);
      setUploadedMediaType(isImage ? "image" : isVideo ? "video" : null);
      toast.success("Media selected");
    };
    reader.readAsDataURL(file);
    // clear the input so same file can be reselected later
    e.currentTarget.value = "";
  };

  // NEW: Post to all connected platforms flow
  const handlePostAllClick = () => {
    if (!input.trim() && generatedPosts.length === 0) {
      return toast.error("No content to post");
    }
    setPostConfirmOpen(true);
  };

  const confirmPostToAll = async () => {
    setPostingAllLoading(true);
    try {
      // 1) fetch user's connected accounts from DB
      const res = await fetch("/api/social");
      const accounts = await res.json();
      const connected = (accounts || []).filter((a: any) => a.connected);

      if (!connected.length) {
        toast.error("No connected accounts found. Link accounts on the Links page.");
        setPostConfirmOpen(false);
        setPostingAllLoading(false);
        return;
      }

      // 2) Determine content to post: prefer textarea input; if empty post generated posts concatenated
      const contentToPost = input.trim() || generatedPosts.map(p => p.content).join("\n\n");

      // 3) For each connected platform, call a platform-specific endpoint (backend should handle)
      // This example calls /api/social/post with platform and payload. Backend must implement.
      const postPromises = connected.map((acc: any) =>
        fetch("/api/social/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: acc.platform,
            accountId: acc._id,
            content: contentToPost,
            media: uploadedMedia || null,
            mediaType: uploadedMediaType || null,
          }),
        })
      );

      const results = await Promise.all(postPromises);
      const okCount = results.filter(r => r.ok).length;

      if (okCount === connected.length) {
        toast.success(`Posted to ${okCount} connected account${okCount > 1 ? "s" : ""}`);
      } else {
        toast(`Posted to ${okCount}/${connected.length} accounts`, { icon: "⚠️" });
      }

      setPostConfirmOpen(false);
    } catch (err) {
      console.error("Error posting to all platforms:", err);
      toast.error("Failed to post to connected platforms");
    } finally {
      setPostingAllLoading(false);
    }
  };

  // existing helpers (delete, schedule, etc.) remain the same
  const clearAllPosts = () => {
    setGeneratedPosts([]);
    localStorage.removeItem("linkedpilot_dashboard_state");
    toast.success("Cleared all posts");
  };

  const handleDeletePost = (id: string) => {
    setGeneratedPosts((prev) => prev.filter((p) => p.id !== id));
    toast.success("Post removed");
  };

  const handleSchedulePost = (post: GeneratedPost) => {
    setScheduledPost(post);
    const dt = new Date(Date.now() + 10 * 60 * 1000);
    setScheduledAtISO(dt.toISOString().slice(0, 16));
  };

  const saveScheduleToServer = async () => {
    if (!scheduledPost) return;
    if (!scheduledAtISO) {
      toast.error("Pick a date & time");
      return;
    }

    try {
      const res = await fetch("/api/linkedin/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: scheduledPost.content,
          media: (scheduledPost as any).media || uploadedMedia || null,
          mediaType: (scheduledPost as any).mediaType || uploadedMediaType || null,
          scheduledAt: new Date(scheduledAtISO).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to schedule");
      } else {
        toast.success("Scheduled successfully!");
        setScheduledPost(null);
      }
    } catch (err) {
      console.error("Schedule save error:", err);
      toast.error("Failed to schedule post");
    }
  };

  const updateMedia = (id: string, media: string | null, mediaType: string | null) => {
    setGeneratedPosts(prev =>
      prev.map(p =>
        p.id === id ? { ...p, media, mediaType } : p
      )
    );
  };

  // remove uploaded media helper
  const removeUploadedMedia = () => {
    setUploadedMedia(null);
    setUploadedMediaType(null);
    toast("Media removed");
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col md:flex-row">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 w-full">
            {/* Dashboard header */}
            <motion.div
              className="text-center mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#00FFFF] via-[#00BFFF] to-[#FFA500] bg-clip-text text-transparent mb-2">
                AI Content Studio
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Instantly generate scroll-stopping viral posts with one click.
              </p>
            </motion.div>

            {/* Post input + options */}
            <div className="bg-[#1b1f2a] p-4 sm:p-6 rounded-2xl shadow-2xl border border-[#2c2f3a]">
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                {/* LEFT: Icon buttons (Tone, Length, Post Count) */}
                <div className="flex items-center gap-2">
                  {/* Tone popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className={`bg-[#161b23] border border-[#2c2f3a] hover:bg-[#1f2633] ${tone ? "ring-1 ring-[#0077B5]/40" : ""}`} title="Tone">
                        <Palette className="w-5 h-5 text-[#00FFFF]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-[#1e2634] border border-[#2c2f3a] rounded-xl text-white shadow-xl">
                      <div className="text-sm font-medium mb-2 text-gray-400">Select Tone</div>
                      {TONE_OPTIONS.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setTone(t.value as PostTone)}
                          className={`block w-full text-left px-3 py-2 rounded-lg hover:bg-[#0077B5]/20 transition-all ${tone === t.value ? "text-[#0077B5] bg-[#0077B5]/10" : "text-gray-300"}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  {/* Length popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className={`bg-[#161b23] border border-[#2c2f3a] hover:bg-[#1f2633] ${postLength ? "ring-1 ring-[#8b5cf6]/40" : ""}`} title="Post Length">
                        <Gauge className="w-5 h-5 text-[#FFA500]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-[#1e2634] border border-[#2c2f3a] rounded-xl text-white shadow-xl">
                      <div className="text-sm font-medium mb-2 text-gray-400">Select Length</div>
                      {LENGTH_OPTIONS.map((l) => (
                        <button
                          key={l.value}
                          onClick={() => setPostLength(l.value as PostLength)}
                          className={`block w-full text-left px-3 py-2 rounded-lg hover:bg-[#9333ea]/20 transition-all ${postLength === l.value ? "text-[#c084fc] bg-[#9333ea]/10" : "text-gray-300"}`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  {/* Post count popover */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className={`bg-[#161b23] border border-[#2c2f3a] hover:bg-[#1f2633] ${postCount > 1 ? "ring-1 ring-[#34d399]/40" : ""}`} title="Number of Posts">
                        <SlidersHorizontal className="w-5 h-5 text-[#00FFFF]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-[#1e2634] border border-[#2c2f3a] rounded-xl text-white shadow-xl">
                      <div className="text-sm font-medium mb-2 text-gray-400">Number of Posts</div>
                      <div className="flex items-center justify-center gap-3">
                        <button onClick={() => setPostCount(Math.max(1, postCount - 1))} className="p-2 bg-[#11151c] rounded-md hover:bg-[#2a3242]"><Minus className="w-4 h-4" /></button>
                        <div className="text-lg font-semibold w-8 text-center">{postCount}</div>
                        <button onClick={() => setPostCount(Math.min(currentPlanLimit.maxPosts, postCount + 1))} className="p-2 bg-[#11151c] rounded-md hover:bg-[#2a3242]"><Plus className="w-4 h-4" /></button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">Max {currentPlanLimit.maxPosts} ({currentPlanLimit.name})</p>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* RIGHT: Upload + Delete buttons */}
                <div className="flex items-center gap-2">
                  {/* Upload button */}
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                  {/* Post Button - Full width on mobile, half on larger */}
                  <Button
                    onClick={handlePostAllClick}
                    disabled={postingAllLoading || (!input.trim() && generatedPosts.length === 0)}
                    className="w-full flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl bg-orange-400 hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Post to all connected platforms"
                  >
                    {postingAllLoading ? (
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : (
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                  <button onClick={handleUploadClick} title="Upload media" className="px-3 py-2 rounded-lg bg-[#11151c] border border-[#2c2f3a] hover:bg-[#23242C] text-sm flex items-center gap-2 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v12" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 7l4-4 4 4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="13" width="18" height="8" rx="2" stroke="#9CA3AF" strokeWidth="1.5"/></svg>
                    <span className="hidden sm:inline">Upload</span>
                  </button>

                  {/* Delete All button (only show when posts exist) */}
                  {generatedPosts.length > 0 && (
                    <button
                      onClick={clearAllPosts}
                      className="p-2 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors"
                      title="Clear All Posts"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* UPLOADED MEDIA PREVIEW (above textarea) */}
              {uploadedMedia && (
                <div className="mb-4 relative rounded-lg overflow-hidden border border-[#2c2f3a] bg-[#0f1317]">
                  <div className="absolute top-2 right-2 z-20">
                    <button
                      onClick={removeUploadedMedia}
                      className="p-1 bg-black/40 hover:bg-black/60 rounded-full text-gray-200 transition-colors"
                      title="Remove media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 flex items-center justify-center">
                    {uploadedMediaType === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={uploadedMedia} alt="uploaded preview" className="max-h-56 object-contain w-full" />
                    ) : (
                      <video src={uploadedMedia} controls className="max-h-56 w-full object-contain" />
                    )}
                  </div>
                </div>
              )}

              {/* Textarea - expands with text */}
              <div className="relative mb-4">
                <textarea
                  ref={textareaRef} // Attach the ref
                  placeholder="Describe your post idea..."
                  value={input}
                  onChange={handleInputChange} // Use the new handler
                  className="w-full bg-[#11151c] text-white placeholder-gray-500 border border-[#2c2f3a] focus:border-[#0077B5] focus:ring-2 focus:ring-[#0077B5]/50 transition-all rounded-xl p-4 min-h-[120px] max-h-96 resize-none shadow-inner text-sm sm:text-base leading-relaxed"
                  style={{
                    overflowY: 'scroll', // Crucial to hide scrollbar and let JS control height
                    paddingBottom: '2.5rem'
                  }}
                />
                <div className="absolute bottom-3 right-4 text-xs text-gray-500 pointer-events-none">

                </div>
              </div>

              {/* Generate + Post buttons (fully responsive) */}
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Generate Button - Full width on mobile, half on larger */}
                <Button
                  onClick={handleGeneratePosts}
                  disabled={!input.trim() || isGenerating}
                  className="w-full flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#00FFFF] via-[#00BFFF] to-[#FFA500] hover:opacity-90 transition-all shadow-2xl hover:shadow-[#FFA500]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={`Generate ${postCount} post${postCount > 1 ? "s" : ""}`}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                  <span className="ml-2">Generate</span>
                </Button>


              </motion.div>
            </div>

            {/* Generated posts list */}
            {generatedPosts.length > 0 && (
              <motion.div className="mt-8 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Generated Posts ({generatedPosts.length})</h2>
                </div>

                {generatedPosts.map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={index}
                    totalPosts={generatedPosts.length}
                    isExpanded={expandedPost === post.id}
                    onToggleExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    onCopy={() => navigator.clipboard.writeText(post.content)}
                    onDelete={() => handleDeletePost(post.id as any)}
                    onSchedule={() => handleSchedulePost(post)}
                    onPostSuccess={(id: string) => toast.success("Posted: " + id)}
                    onPostError={(err: string) => toast.error(err)}
                    isLinkedInConnected={isLinkedInConnected}
                    onUpdateMedia={updateMedia}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Scheduling modal */}
      {scheduledPost && (
        <div className="fixed bottom-4 right-4 bg-[#1b1f2a] border border-[#2c2f3a] rounded-xl shadow-xl p-4 z-50 w-[300px]">
          <h3 className="font-semibold mb-2 text-white">Schedule Post</h3>
          <div className="text-xs text-gray-300 mb-2 line-clamp-3">{scheduledPost.content}</div>

          <input
            type="datetime-local"
            value={scheduledAtISO}
            onChange={(e) => setScheduledAtISO(e.target.value)}
            className="w-full p-2 bg-[#11151c] border border-[#2c2f3a] rounded-lg text-gray-200 mb-3"
          />

          <div className="flex justify-end gap-2">
            <button onClick={() => setScheduledPost(null)} className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors">Cancel</button>
            <button onClick={saveScheduleToServer} className="px-3 py-1 rounded-md bg-[#0077B5] hover:bg-[#005885] transition-colors">Save</button>
          </div>
        </div>
      )}

      {/* POST CONFIRM modal */}
      {postConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-[#14151a] border border-[#2c2f3a] rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Post to all connected platforms</h3>
            <p className="text-sm text-gray-300 mb-4">
              This content will be posted to all connected accounts. To adjust which accounts are used, go to the <button onClick={() => { setPostConfirmOpen(false); router.push("/links"); }} className="underline text-[#00BFFF] hover:text-[#00FFFF] transition-colors">Links</button> page.
            </p>

            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">Preview</div>
              <div className="bg-[#0f1317] p-3 rounded-md border border-[#2c2f3a] max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-200 mb-2 whitespace-pre-wrap">{input.trim() || generatedPosts.map(p => p.content).slice(0, 2).join("\n\n")}</p>
                {uploadedMedia && (
                  <div className="mt-2">
                    {uploadedMediaType === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={uploadedMedia} alt="preview" className="max-h-40 w-full object-contain rounded-md" />
                    ) : (
                      <video src={uploadedMedia} controls className="max-h-40 w-full object-contain rounded-md" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setPostConfirmOpen(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">Cancel</button>
              <button onClick={confirmPostToAll} disabled={postingAllLoading} className="px-4 py-2 rounded-lg bg-[#0077B5] hover:bg-[#005885] transition-colors flex items-center gap-2 disabled:opacity-50">
                {postingAllLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Confirm & Post</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}