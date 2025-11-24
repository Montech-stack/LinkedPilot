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
import { useRouter } from "next/navigation";
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
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "assertive", label: "Assertive" },
  { value: "inspirational", label: "Inspirational" },
  { value: "casual", label: "Casual" },
  { value: "thought-provoking", label: "Thought-Provoking" },
];

const LENGTH_OPTIONS: LengthOption[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

export default function Dashboard() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<PostTone>("professional");
  const [postCount, setPostCount] = useState(1);
  const [postLength, setPostLength] = useState<PostLength>("medium");
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [scheduledPost, setScheduledPost] = useState<GeneratedPost | null>(null);
  const [scheduledAtISO, setScheduledAtISO] = useState<string>("");

  // Media upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<"image" | "video" | null>(null);
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);
  const [postingAllLoading, setPostingAllLoading] = useState(false);

  const { isGenerating, generatePosts, setIsGenerating } = usePostGeneration();
  const userPlan: UserPlan = "pro";
  const currentPlanLimit = PLAN_LIMITS[userPlan];

  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxHeight = 384;
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [input, autoResizeTextarea]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResizeTextarea();
  };

  // Load saved state
  useEffect(() => {
    const saved = localStorage.getItem("linkedpilot_dashboard_state");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const normalizePost = (p: any, idx: number): GeneratedPost => ({
        id: typeof p?.id === "number" ? p.id : Number(p?.id) || idx,
        content: p?.content || "",
        tone: (p?.tone as PostTone) || "professional",
        engagement: (p?.engagement as any) || "Medium",
        score: typeof p?.score === "number" ? p.score : 80,
        ...(p?.media ? { media: p.media } : {}),
        ...(p?.mediaType ? { mediaType: p.mediaType } : {}),
      });
      setInput(parsed.input || "");
      setTone(parsed.tone || "professional");
      setPostCount(parsed.postCount || 1);
      setPostLength(parsed.postLength || "medium");
      const loaded = Array.isArray(parsed.generatedPosts)
        ? parsed.generatedPosts.map((p: any, i: number) => normalizePost(p, i))
        : [];
      setGeneratedPosts(loaded);
    } catch (err) {
      console.error("Failed to parse saved state:", err);
    }
  }, []);

  // Sync query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get("input") || "";
    if (q && q.trim()) setInput(decodeURIComponent(q));
  }, []);

  // Persist state
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

  // Check LinkedIn connection
  useEffect(() => {
    async function checkConnection() {
      try {
        const res = await fetch("/api/linkedin/status", { credentials: "include" });
        const j = await res.json();
        setIsLinkedInConnected(!!j.isAuthenticated);
      } catch (err) {
        console.error("LinkedIn status check failed", err);
      }
    }
    checkConnection();
  }, []);

  const handleGeneratePosts = useCallback(async () => {
    if (!input.trim()) return toast.error("Enter a post idea first!");
    setIsGenerating(true);
    try {
      const newPosts = await generatePosts(input, tone, postCount, postLength);
      const baseId = Math.floor(Date.now() / 1000);
      const withIds = newPosts.map((p, i) => ({ ...p, id: baseId + i }));
      setGeneratedPosts((prev) => [...prev, ...withIds]);
      toast.success(`Generated ${withIds.length} post${withIds.length > 1 ? "s" : ""}!`);
    } catch {
      toast.error("Failed to generate posts");
    } finally {
      setIsGenerating(false);
    }
  }, [input, tone, postCount, postLength, generatePosts, setIsGenerating]);

  // Media upload
  const handleUploadClick = () => fileInputRef.current?.click();
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
    e.currentTarget.value = "";
  };

  const removeUploadedMedia = () => {
    setUploadedMedia(null);
    setUploadedMediaType(null);
    toast("Media removed");
  };

  // Post to all platforms
  const handlePostAllClick = () => {
    if (!input.trim() && generatedPosts.length === 0) {
      return toast.error("No content to post");
    }
    setPostConfirmOpen(true);
  };

  const confirmPostToAll = async () => {
    setPostingAllLoading(true);
    try {
      const res = await fetch("/api/social");
      const accounts = await res.json();
      const connected = (accounts || []).filter((a: any) => a.connected);
      if (!connected.length) {
        toast.error("No connected accounts. Go to Links page.");
        setPostConfirmOpen(false);
        return;
      }
      const contentToPost = input.trim() || generatedPosts.map(p => p.content).join("\n\n");
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
      toast[okCount === connected.length ? "success" : "info"](
        `Posted to ${okCount}/${connected.length} account${okCount > 1 ? "s" : ""}`
      );
      setPostConfirmOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to post");
    } finally {
      setPostingAllLoading(false);
    }
  };

  const clearAllPosts = () => {
    setGeneratedPosts([]);
    localStorage.removeItem("linkedpilot_dashboard_state");
    toast.success("Cleared all posts");
  };

  const handleDeletePost = (id: string) => {
    setGeneratedPosts(prev => prev.filter(p => p.id !== id));
    toast.success("Post removed");
  };

  const handleSchedulePost = (post: GeneratedPost) => {
    setScheduledPost(post);
    const dt = new Date(Date.now() + 10 * 60 * 1000);
    setScheduledAtISO(dt.toISOString().slice(0, 16));
  };

  const saveScheduleToServer = async () => {
    if (!scheduledPost || !scheduledAtISO) {
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
      if (!res.ok) toast.error(data.error || "Failed to schedule");
      else {
        toast.success("Scheduled!");
        setScheduledPost(null);
      }
    } catch (err) {
      toast.error("Failed to schedule");
    }
  };

  const updateMedia = (id: string, media: string | null, mediaType: string | null) => {
    setGeneratedPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, media, mediaType } : p))
    );
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col md:flex-row">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 w-full">
            <motion.div className="text-center mb-6 sm:mb-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#00FFFF] via-[#00BFFF] to-[#FFA500] bg-clip-text text-transparent mb-2">
                AI Content Studio
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Instantly generate scroll-stopping viral posts with one click.
              </p>
            </motion.div>

            <div className="bg-[#1b1f2a] p-4 sm:p-6 rounded-2xl shadow-2xl border border-[#2c2f3a]">
              {/* TOP BUTTON BAR – Compact for 320px */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                {/* Left: Tone / Length / Count */}
                <div className="flex items-center gap-1.5">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9 bg-[#161b23] border border-[#2c2f3a] hover:bg-[#1f2633]" title="Tone">
                        <Palette className="w-4 h-4 text-[#00FFFF]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-[#1e2634] border border-[#2c2f3a] rounded-xl text-white shadow-xl">
                      <div className="text-sm font-medium mb-2 text-gray-400">Select Tone</div>
                      {TONE_OPTIONS.map(t => (
                        <button key={t.value} onClick={() => setTone(t.value as PostTone)}
                          className={`block w-full text-left px-3 py-2 rounded-lg hover:bg-[#0077B5]/20 ${tone === t.value ? "text-[#0077B5] bg-[#0077B5]/10" : "text-gray-300"}`}>
                          {t.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9 bg-[#161b23] border border-[#2c2f3a] hover:bg-[#1f2633]" title="Length">
                        <Gauge className="w-4 h-4 text-[#FFA500]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 bg-[#1e2634] border border-[#2c2f3a] rounded-xl text-white shadow-xl">
                      <div className="text-sm font-medium mb-2 text-gray-400">Select Length</div>
                      {LENGTH_OPTIONS.map(l => (
                        <button key={l.value} onClick={() => setPostLength(l.value as PostLength)}
                          className={`block w-full text-left px-3 py-2 rounded-lg hover:bg-[#9333ea]/20 ${postLength === l.value ? "text-[#c084fc] bg-[#9333ea]/10" : "text-gray-300"}`}>
                          {l.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9 bg-[#161b23] border border-[#2c2f3a] hover:bg-[#1f2633]" title="Number of Posts">
                        <SlidersHorizontal className="w-4 h-4 text-[#00FFFF]" />
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

                {/* Right: Upload + Post All */}
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                  <button onClick={handleUploadClick} title="Upload media" className="p-2 rounded-lg bg-[#11151c] border border-[#2c2f3a] hover:bg-[#23242C] transition-colors">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                      <path d="M12 3v12M8 7l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                      <rect x="3" y="13" width="18" height="8" rx="2"/>
                    </svg>
                  </button>

                  <Button
                    onClick={handlePostAllClick}
                    disabled={postingAllLoading || (!input.trim() && generatedPosts.length === 0)}
                    className="h-9 px-3.5 text-sm font-medium rounded-lg bg-orange-400 hover:bg-orange-500 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {postingAllLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                    <span className="hidden xs:inline">Post All</span>
                  </Button>
                </div>
              </div>

              {/* Uploaded Media Preview */}
              {uploadedMedia && (
                <div className="mb-4 relative rounded-lg overflow-hidden border border-[#2c2f3a] bg-[#0f1317]">
                  <button onClick={removeUploadedMedia} className="absolute top-2 right-2 z-20 p-1 bg-black/40 hover:bg-black/60 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="p-3 flex justify-center">
                    {uploadedMediaType === "image" ? (
                      <img src={uploadedMedia} alt="preview" className="max-h-56 object-contain w-full" />
                    ) : (
                      <video src={uploadedMedia} controls className="max-h-56 w-full object-contain" />
                    )}
                  </div>
                </div>
              )}

              {/* Textarea */}
              <div className="relative mb-4">
                <textarea
                  ref={textareaRef}
                  placeholder="Describe your post idea..."
                  value={input}
                  onChange={handleInputChange}
                  className="w-full bg-[#11151c] text-white placeholder-gray-500 border border-[#2c2f3a] focus:border-[#0077B5] focus:ring-2 focus:ring-[#0077B5]/50 rounded-xl p-4 min-h-[120px] max-h-96 resize-none shadow-inner text-sm sm:text-base leading-relaxed"
                  style={{ overflowY: "scroll", paddingBottom: "2.5rem" }}
                />
              </div>

              {/* Generate Button + Trash (when posts exist) */}
              <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 col-span-1 sm:col-span-2 lg:col-span-1">
                  <Button
                    onClick={handleGeneratePosts}
                    disabled={!input.trim() || isGenerating}
                    className="flex-1 h-12 px-6 text-base font-semibold rounded-xl bg-gradient-to-r from-[#00FFFF] via-[#00BFFF] to-[#FFA500] hover:opacity-90 shadow-2xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                    <span>Generate {postCount > 1 && `(${postCount})`}</span>
                  </Button>

                  {generatedPosts.length > 0 && (
                    <button
                      onClick={clearAllPosts}
                      className="p-3 bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                      title="Clear All Posts"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="hidden sm:block" /> {/* Grid balance */}
              </motion.div>
            </div>

            {/* Generated Posts */}
            {generatedPosts.length > 0 && (
              <motion.div className="mt-8 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Generated Posts ({generatedPosts.length})</h2>
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

      {/* Scheduling Modal */}
      {scheduledPost && (
        <div className="fixed bottom-4 right-4 bg-[#1b1f2a] border border-[#2c2f3a] rounded-xl shadow-xl p-4 z-50 w-[300px]">
          <h3 className="font-semibold mb-2 text-white">Schedule Post</h3>
          <div className="text-xs text-gray-300 mb-2 line-clamp-3">{scheduledPost.content}</div>
          <input type="datetime-local" value={scheduledAtISO} onChange={(e) => setScheduledAtISO(e.target.value)} className="w-full p-2 bg-[#11151c] border border-[#2c2f3a] rounded-lg text-gray-200 mb-3" />
          <div className="flex justify-end gap-2">
            <button onClick={() => setScheduledPost(null)} className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600">Cancel</button>
            <button onClick={saveScheduleToServer} className="px-3 py-1 rounded-md bg-[#0077B5] hover:bg-[#005885]">Save</button>
          </div>
        </div>
      )}

      {/* Post-to-All Confirmation Modal */}
      {postConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg bg-[#14151a] border border-[#2c2f3a] rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-3">Post to all connected platforms</h3>
            <p className="text-sm text-gray-300 mb-4">
              This will post to all connected accounts. Manage them on the <button onClick={() => { setPostConfirmOpen(false); router.push("/links"); }} className="underline text-[#00BFFF] hover:text-[#00FFFF]">Links</button> page.
            </p>
            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">Preview</div>
              <div className="bg-[#0f1317] p-3 rounded-md border border-[#2c2f3a] max-h-48 overflow-y-auto text-sm text-gray-200 whitespace-pre-wrap">
                {input.trim() || generatedPosts.map(p => p.content).slice(0, 2).join("\n\n")}
                {uploadedMedia && (
                  <div className="mt-3">
                    {uploadedMediaType === "image" ? <img src={uploadedMedia} alt="preview" className="max-h-40 w-full object-contain rounded-md" /> : <video src={uploadedMedia} controls className="max-h-40 w-full rounded-md" />}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setPostConfirmOpen(false)} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600">Cancel</button>
              <button onClick={confirmPostToAll} disabled={postingAllLoading} className="px-4 py-2 rounded-lg bg-[#0077B5] hover:bg-[#005885] flex items-center gap-2 disabled:opacity-50">
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