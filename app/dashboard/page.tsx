"use client";

import React, { useState, useCallback, useEffect } from "react";
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
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<PostTone>("professional");
  const [postCount, setPostCount] = useState(1);
  const [postLength, setPostLength] = useState<PostLength>("medium");
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);

  const { isGenerating, generatePosts, setIsGenerating } = usePostGeneration();
  const userPlan: UserPlan = "pro";
  const currentPlanLimit = PLAN_LIMITS[userPlan];

  useEffect(() => {
    const saved = localStorage.getItem("linkedpilot_dashboard_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setInput(parsed.input || "");
        setTone(parsed.tone || "professional");
        setPostCount(parsed.postCount || 1);
        setPostLength(parsed.postLength || "medium");
        setGeneratedPosts(parsed.generatedPosts || []);
      } catch (err) {
        console.error("Failed to parse saved dashboard state:", err);
      }
    }
  }, []);

  useEffect(() => {
    const state = {
      input,
      tone,
      postCount,
      postLength,
      generatedPosts,
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

  const handleGeneratePosts = useCallback(async () => {
    if (!input.trim()) return toast.error("Enter a post idea first!");
    setIsGenerating(true);
    try {
      const newPosts = await generatePosts(input, tone, postCount, postLength);
      setGeneratedPosts((prev) => [...prev, ...newPosts]);
      toast.success(`Generated ${newPosts.length} post${newPosts.length > 1 ? "s" : ""}!`);
    } catch {
      toast.error("Failed to generate posts");
    } finally {
      setIsGenerating(false);
    }
  }, [input, tone, postCount, postLength, generatePosts, setIsGenerating]);

  const clearAllPosts = () => {
    setGeneratedPosts([]);
    localStorage.removeItem("linkedpilot_dashboard_state");
    toast.success("Cleared all posts");
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col md:flex-row overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 w-full">
          <motion.div
            className="text-center mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#0077B5] to-purple-500 bg-clip-text text-transparent mb-2">
              AI Content Studio
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Instantly generate scroll-stopping viral LinkedIn posts with one click.
            </p>
          </motion.div>

          {/* Toolbar & Input */}
          <div className="bg-[#1b1f2a] p-4 sm:p-6 rounded-2xl shadow-2xl border border-[#2c2f3a]">
            <div className="flex items-center gap-2 mb-4 flex-wrap justify-center sm:justify-start">
              {/* Tone Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`bg-[#161b23] border border-[#2c2f3a] hover:bg-[#1f2633] ${tone ? "ring-1 ring-[#0077B5]/40" : ""}`}
                    title="Tone"
                  >
                    <Palette className="w-5 h-5 text-[#7dd3fc]" />
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

              {/* Length Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`bg-[#161b23] border border-[#2c2f3a] hover:bg-[#1f2633] ${postLength ? "ring-1 ring-[#8b5cf6]/40" : ""}`}
                    title="Post Length"
                  >
                    <Gauge className="w-5 h-5 text-[#c084fc]" />
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

              {/* Post Count Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`bg-[#161b23] border border-[#2c2f3a] hover:bg-[#1f2633] ${postCount > 1 ? "ring-1 ring-[#34d399]/40" : ""}`}
                    title="Number of Posts"
                  >
                    <SlidersHorizontal className="w-5 h-5 text-[#34d399]" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 bg-[#1e2634] border border-[#2c2f3a] rounded-xl text-white shadow-xl">
                  <div className="text-sm font-medium mb-2 text-gray-400">Number of Posts</div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setPostCount(Math.max(1, postCount - 1))}
                      className="p-2 bg-[#11151c] rounded-md hover:bg-[#2a3242]"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="text-lg font-semibold w-8 text-center">{postCount}</div>
                    <button
                      onClick={() => setPostCount(Math.min(currentPlanLimit.maxPosts, postCount + 1))}
                      className="p-2 bg-[#11151c] rounded-md hover:bg-[#2a3242]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Max {currentPlanLimit.maxPosts} ({currentPlanLimit.name})
                  </p>
                </PopoverContent>
              </Popover>
            </div>

            {/* Input Box */}
            <div className="relative mb-4">
              <textarea
                placeholder="Describe your LinkedIn post idea..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-[#11151c] text-white placeholder-gray-500 border border-[#2c2f3a] focus:border-[#0077B5] focus:ring-2 focus:ring-[#0077B5]/50 transition-all rounded-xl p-3 min-h-[120px] resize-none shadow-inner text-sm sm:text-base"
                maxLength={500}
              />
              <div className="absolute bottom-2 right-3 text-xs text-gray-500">
                {input.length}/500
              </div>
            </div>

            {/* Generate Button */}
            <motion.div className="flex justify-center w-full" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Button
                onClick={handleGeneratePosts}
                disabled={!input.trim() || isGenerating}
                className="w-full sm:w-full flex items-center justify-center gap-3 px-8 py-4 text-base sm:text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#0077B5] via-[#7e22ce] to-[#9333ea] hover:opacity-90 transition-all shadow-2xl hover:shadow-[#9333ea]/30"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Generate {postCount} Post{postCount > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Generated Posts */}
          {generatedPosts.length > 0 && (
            <motion.div className="mt-8 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Generated Posts ({generatedPosts.length})
                </h2>
                <button onClick={clearAllPosts} className="flex items-center gap-2 text-sm px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg w-full sm:w-auto justify-center">
                  <Trash2 className="w-4 h-4" /> Clear All
                </button>
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
                  isLinkedInConnected={isLinkedInConnected}
                />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
