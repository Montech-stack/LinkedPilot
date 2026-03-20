"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Zap,
  Plus,
  Minus,
  SlidersHorizontal,
  Trash2,
  Share2,
  X,
  Check,
  Upload,
  Settings2,
  Sparkles,
  Dna,
  Eye,
} from "lucide-react";
import ScheduleModal from "@/components/ScheduleModal";
import OnboardingModal from "@/components/OnboardingModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyzeCredibility } from "@/lib/credibility-service";
import PresetsPanel from "@/components/PresetsPanel";
import { useContentPresetStore, PRESETS } from "@/lib/content-preset-store";
import { useBillingStore } from "@/lib/billing-store";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import PostCard from "@/components/PostCard";
import RepurposeWizard from "@/components/RepurposeWizard";
import { UpgradeModal } from "@/components/UpgradeModal";
import { usePostGeneration } from "@/hooks/usePostGeneration";
import { useRouter } from "next/navigation";
import {
  GeneratedPost,
  PostPlatform,
  PostLength,
  LengthOption,
} from "@/types";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useSession } from "next-auth/react";
import { PLAN_IDS, isPaidPlan } from "@/lib/billing-store";

const MAX_POSTS_FOR_PLAN: Record<string, number> = {
  [PLAN_IDS.TRIAL]: 10,
  [PLAN_IDS.STRATEGY]: 50,
  [PLAN_IDS.ENTERPRISE]: 100,
  [PLAN_IDS.AGENCY]: 100,
};

const isUnlimitedPlan = (plan: string) =>
  plan === PLAN_IDS.ENTERPRISE || plan === PLAN_IDS.AGENCY;

const PLATFORM_OPTIONS: { value: PostPlatform; label: string; color: string }[] = [
  { value: "LinkedIn", label: "LinkedIn", color: "text-blue-500" },
  { value: "Twitter", label: "Twitter / X", color: "text-sky-400" },
  { value: "Instagram", label: "Instagram", color: "text-pink-500" },
  { value: "Facebook", label: "Facebook", color: "text-blue-600" },
];

const LENGTH_OPTIONS: LengthOption[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

export default function Dashboard() {
  const router = useRouter();
  const { data: session } = useSession();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState("");
  const [platforms, setPlatforms] = useState<PostPlatform[]>(["LinkedIn"]);
  const [postCount, setPostCount] = useState(1);
  const [postLength, setPostLength] = useState<PostLength>("medium");
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [isLinkedInConnected, setIsLinkedInConnected] = useState(false);
  const [userPlan, setUserPlan] = useState<string>(PLAN_IDS.TRIAL);
  const [tokensRemaining, setTokensRemaining] = useState(30);

  // Upgrade modal
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"tokens" | "trial">("tokens");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [uploadedMedia, setUploadedMedia] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<"image" | "video" | null>(null);
  const [postConfirmOpen, setPostConfirmOpen] = useState(false);
  const [postingAllLoading, setPostingAllLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Voice Clone State
  const [useClonedVoice, setUseClonedVoice] = useState(false);
  const [hasVoiceProfile, setHasVoiceProfile] = useState(false);

  // Generated Posts Modal State
  const [showGeneratedPostsModal, setShowGeneratedPostsModal] = useState(false);

  useEffect(() => {
    // Check for voice profile
    const profile = localStorage.getItem("maxis_voice_profile");
    if (profile) setHasVoiceProfile(true);
  }, []);

  // Check onboarding status on mount
  useEffect(() => {
    async function checkOnboarding() {
      const shownThisSession = sessionStorage.getItem("maxis_onboarding_shown");
      if (shownThisSession) return;

      try {
        const res = await fetch("/api/onboarding");
        if (res.ok) {
          const data = await res.json();
          if (!data.onboardingCompleted) {
            setOnboardingStep(data.onboardingStep || 0);
            setShowOnboarding(true);
            sessionStorage.setItem("maxis_onboarding_shown", "true");
          }
        }
      } catch (e) {
        console.error("Failed to check onboarding:", e);
      }
    }
    if (session?.user?.email) {
      checkOnboarding();
    }
  }, [session?.user?.email]);

  // Scheduling State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [postToSchedule, setPostToSchedule] = useState<{ id: string; content: string } | null>(null);

  const { isGenerating, generatePosts, setIsGenerating } = usePostGeneration();
  const { selectedPresets, customPresets } = useContentPresetStore();
  const { syncFromDB, isTrialExpired, daysLeftInTrial, currentPlan } = useBillingStore();
  const maxPostsForPlan = MAX_POSTS_FOR_PLAN[userPlan] ?? 10;
  const userEmail = session?.user?.email || "guest@example.com";

  // Fetch User Stats
  useEffect(() => {
    async function fetchUserStats() {
      try {
        const res = await fetch("/api/user/stats");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();

        const plan = data.plan || PLAN_IDS.TRIAL;
        const unlimited = isUnlimitedPlan(plan);
        const tokens = unlimited ? -1 : (data.tokensRemaining ?? 30);

        setUserPlan(plan);
        setTokensRemaining(tokens);
        syncFromDB({
          plan,
          tokens,
          trialEndsAt: data.trialEndsAt,
          endDate: data.subscriptionEndDate,
        });
      } catch (err) {
        console.error(err);
      }
    }
    if (session?.user?.email) fetchUserStats();
  }, [session?.user?.email]);

  // Trial expiry check
  useEffect(() => {
    if (currentPlan === PLAN_IDS.TRIAL && isTrialExpired()) {
      setUpgradeReason("trial");
      setUpgradeModalOpen(true);
    } else if (currentPlan === PLAN_IDS.TRIAL && daysLeftInTrial() <= 2) {
      // Non-blocking: sidebar shows countdown banner
    }
  }, [currentPlan]);

  // Check social connections
  useEffect(() => {
    async function checkConnections() {
      try {
        const res = await fetch("/api/social");
        if (res.ok) {
          const accounts = await res.json();
          const linkedIn = accounts.find((a: any) => a.platform === "linkedin" && a.connected);
          if (linkedIn) setIsLinkedInConnected(true);
        }
      } catch (e) { }
    }
    checkConnections();
  }, []);

  const autoResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const max = 384;
      const h = Math.min(textareaRef.current.scrollHeight, max);
      textareaRef.current.style.height = `${h}px`;
    }
  }, []);

  useEffect(() => autoResize(), [input, autoResize]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    autoResize();
  };

  // Local Storage & URL Params Persistence
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const draftContent = searchParams.get("draft");

    const saved = localStorage.getItem("maxis_state");
    if (saved) {
      try {
        const s = JSON.parse(saved);
        // If URL param exists, override the saved input
        setInput(draftContent || s.input || "");
        setPlatforms(s.platforms || ["LinkedIn"]);
        setPostCount(s.postCount || 1);
        setPostLength(s.postLength || "medium");
        setGeneratedPosts(s.generatedPosts || []);
      } catch {
        if (draftContent) setInput(draftContent);
      }
    } else if (draftContent) {
      setInput(draftContent);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem("maxis_state", JSON.stringify({ input, platforms, postCount, postLength, generatedPosts }));
  }, [input, platforms, postCount, postLength, generatedPosts, isLoaded]);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return toast.error("Enter a post idea first!");
    if (platforms.length === 0) return toast.error("Select at least one platform!");

    const costPerPost = postLength === "short" ? 1 : postLength === "medium" ? 2 : 3;
    const totalCost = postCount * costPerPost;

    if (!isUnlimitedPlan(userPlan) && tokensRemaining !== -1 && tokensRemaining < totalCost) {
      setUpgradeReason("tokens");
      setUpgradeModalOpen(true);
      return;
    }

    setIsGenerating(true);
    try {
      const allPresets = [...PRESETS, ...customPresets];
      const activePresets = allPresets.filter(p => selectedPresets.includes(p.id));
      const presetInstructions = activePresets.map(p => `[Style: ${p.name}] ${p.promptSnippet}`).join("\n");
      let finalPrompt = presetInstructions
        ? `${input}\n\n--- Style Instructions ---\n${presetInstructions}`
        : input;

      if (useClonedVoice && hasVoiceProfile) {
        const profile = JSON.parse(localStorage.getItem("maxis_voice_profile") || "{}");
        if (profile.traits) {
          finalPrompt += `\n\n--- VOICE CLONE ACTIVE ---\nAdopt the following voice traits strictly: ${profile.traits.join(", ")}. Write exactly like this user.`;
        }
      }


      const newPosts = await generatePosts(finalPrompt, platforms, postCount, postLength);
      const baseId = Math.floor(Date.now() / 1000);
      const withIds = newPosts.map((p, i) => {
        const credibility = analyzeCredibility(p.content);
        return {
          ...p,
          id: baseId + i,
          credibilityScore: {
            score: credibility.score,
            flaggedWords: credibility.flaggedWords
          }
        };
      });
      setGeneratedPosts(prev => [...prev, ...withIds]);
      toast.success(`Generated ${withIds.length} posts!`);

      if (!isUnlimitedPlan(userPlan) && tokensRemaining !== -1) {
        await fetch("/api/deduct-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usedTokens: totalCost, email: userEmail }),
        });
        setTokensRemaining(prev => Math.max(0, prev - totalCost));
      }
      setTimeout(() => setShowGeneratedPostsModal(true), 100);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [input, platforms, postCount, postLength, generatePosts, setIsGenerating, userPlan, tokensRemaining, userEmail, selectedPresets, customPresets, useClonedVoice, hasVoiceProfile]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImg = file.type.startsWith("image/");
    const isVid = file.type.startsWith("video/");

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setUploadedMedia(reader.result as string);
      setUploadedMediaType(isImg ? "image" : isVid ? "video" : null);
      toast.success("Media attached");
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    setGeneratedPosts(prev => prev.filter(p => p.id !== id));
  };

  const updateMedia = (id: string, media: string | null, type: "image" | "video" | null) => {
    setGeneratedPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, media, mediaType: type } : p))
    );
  };

  const togglePlatform = (p: PostPlatform) => {
    setPlatforms(prev =>
      prev.includes(p)
        ? prev.filter(x => x !== p)
        : [...prev, p]
    );
  };

  const handlePostNow = async () => {
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

      const postPromises = connected.map((acc: any) =>
        fetch("/api/social/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform: acc.platform,
            accountId: acc._id,
            content: input,
            media: uploadedMedia || null,
            mediaType: uploadedMediaType || null,
          }),
        })
      );

      const results = await Promise.all(postPromises);
      const okCount = results.filter(r => r.ok).length;

      if (okCount > 0) {
        toast.success(`Posted to ${okCount} accounts!`);
        setInput("");
        setUploadedMedia(null);
        setUploadedMediaType(null);
      } else {
        toast.error("Failed to post");
      }
    } catch (err) {
      toast.error("Error posting");
    } finally {
      setPostingAllLoading(false);
      setPostConfirmOpen(false);
    }
  };

  const PlatformSelector = () => (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Platforms</label>
      <div className="grid grid-cols-2 gap-2">
        {PLATFORM_OPTIONS.map(p => (
          <div
            key={p.value}
            onClick={() => togglePlatform(p.value)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border",
              platforms.includes(p.value)
                ? "bg-primary/10 border-primary/50"
                : "bg-muted/50 border-border hover:border-muted-foreground/30"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded border flex items-center justify-center transition-colors",
              platforms.includes(p.value) ? "bg-primary border-primary" : "border-muted-foreground/50"
            )}>
              {platforms.includes(p.value) && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className={cn("text-xs font-medium", p.color)}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const LengthSelector = () => (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Length</label>
      <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
        {LENGTH_OPTIONS.map(l => (
          <button
            key={l.value}
            onClick={() => setPostLength(l.value as PostLength)}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
              postLength === l.value
                ? "bg-primary/20 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );

  const CountSelector = () => (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</label>
      <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg border border-border">
        <button
          onClick={() => setPostCount(Math.max(1, postCount - 1))}
          disabled={postCount <= 1}
          className="p-1 hover:bg-muted rounded-md disabled:opacity-30"
        >
          <Minus className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-bold text-foreground">{postCount}</span>
        <button
          onClick={() => setPostCount(Math.min(maxPostsForPlan, postCount + 1))}
          className="p-1 hover:bg-muted rounded-md"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 w-full">

            <Tabs defaultValue="quick" className="w-full">
              {/* Page Header */}
              <motion.div className="mb-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">
                  Studio
                </h1>
                <p className="text-muted-foreground text-sm max-w-lg mb-4">
                  Write one idea. Publish everywhere.
                </p>

                <TabsList className="grid w-full max-w-xs grid-cols-2 bg-muted/50 p-1 rounded-lg">
                  <TabsTrigger value="quick" className="rounded-md text-xs">Quick Post</TabsTrigger>
                  <TabsTrigger value="repurpose" className="rounded-md text-xs">Repurpose</TabsTrigger>
                </TabsList>
              </motion.div>

              {/* Generated Posts Toggle (Floating) */}
              <AnimatePresence>
                {generatedPosts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 right-6 z-40"
                  >
                    <Button
                      onClick={() => setShowGeneratedPostsModal(true)}
                      className="rounded-md h-11 px-5 shadow-lg bg-foreground text-background hover:bg-foreground/90 font-semibold gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View posts ({generatedPosts.length})
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              <TabsContent value="quick">
                <div className="bg-card/80 backdrop-blur-xl p-1 rounded-3xl shadow-2xl border border-border/50 relative overflow-hidden group">
                  {/* Token Indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-background/80 border border-border/50 rounded-full px-3 py-1 z-20 backdrop-blur-md shadow-sm">
                    <div className={`w-1.5 h-1.5 rounded-full ${tokensRemaining < 50 ? 'bg-red-500' : 'bg-gold'} animate-pulse`} />
                    <span className="text-[10px] font-medium text-foreground/80">
                      {tokensRemaining === -1 ? "Unlimited" : `${tokensRemaining} tokens`}
                    </span>
                  </div>

                  {/* Main Input Area */}
                  <div className="relative bg-background/50 rounded-[22px] border border-border/50 transition-all focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
                    <textarea
                      ref={textareaRef}
                      placeholder="What do you want to post about? (e.g. 'Launch of our new AI features', '3 tips for productivity')"
                      value={input}
                      onChange={handleChange}
                      className="w-full bg-transparent text-foreground placeholder-muted-foreground/40 border-none outline-none focus:ring-0 rounded-2xl p-6 min-h-[160px] max-h-96 resize-none text-lg leading-relaxed font-light"
                    />

                    {/* Media Preview inside input */}
                    {uploadedMedia && (
                      <div className="absolute bottom-4 left-6 z-10 animate-in fade-in zoom-in duration-200">
                        <div className="relative group inline-block">
                          {uploadedMediaType === "image" ? (
                            <div className="h-16 w-16 rounded-xl overflow-hidden border border-border/50 shadow-lg">
                              <img src={uploadedMedia} alt="Thumb" className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <div className="h-16 w-16 rounded-xl bg-muted/20 flex items-center justify-center border border-border/50 shadow-lg backdrop-blur-sm">
                              <Settings2 className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <button
                            onClick={() => { setUploadedMedia(null); setUploadedMediaType(null); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:scale-110"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bottom Toolbar inside Input */}
                    <div className="flex items-center justify-between px-4 pb-3 pt-2">
                      {/* Left: Quick Actions */}
                      <div className="flex items-center gap-1">
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFile} />

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button onClick={handleUploadClick} className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                                <Upload className="w-5 h-5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent><p>Upload Media</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={async () => {
                                  if (!input.trim()) return toast.error("Enter a topic first");
                                  toast.loading("Generating Image...");
                                  try {
                                    const res = await fetch('/api/generateImages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: input }) });
                                    const data = await res.json();
                                    if (data.success && data.imageUrl) {
                                      setUploadedMedia(data.imageUrl);
                                      setUploadedMediaType("image");
                                      toast.dismiss();
                                      toast.success("Image Generated!");
                                    } else throw new Error();
                                  } catch { toast.dismiss(); toast.error("Failed"); }
                                }}
                                className="p-2.5 rounded-xl text-muted-foreground hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
                              >
                                <Sparkles className="w-5 h-5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent><p>Generate AI Image</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Voice Clone Button */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => {
                                  if (!hasVoiceProfile) {
                                    toast.error("Set up your voice profile first");
                                    return;
                                  }
                                  setUseClonedVoice(!useClonedVoice);
                                }}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
                                  useClonedVoice
                                    ? "bg-brand/15 border border-brand/40 text-brand"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                              >
                                <Dna className={cn("w-5 h-5", useClonedVoice && "text-brand")} />
                                <span className="text-xs font-medium hidden sm:inline">
                                  {useClonedVoice ? "Voice on" : "Voice profile"}
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{hasVoiceProfile ? (useClonedVoice ? "Using your voice profile" : "Enable voice profile") : "Set up your voice profile first"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* Right: Settings Triggers */}
                      <div className="flex items-center gap-2">
                        {/* Settings Popover for all config */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/30 border border-border/50 rounded-full hover:bg-muted/50 transition-all">
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span>Config</span>
                              <div className="w-[1px] h-3 bg-border/50 mx-1" />
                              <span className="text-foreground/70">{platforms.length} Plats • {postLength} • {postCount}x</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-5 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl mr-4" align="end" sideOffset={10}>
                            <div className="space-y-6">
                              <div className="pb-3 border-b border-border/50">
                                <h4 className="text-sm font-semibold text-foreground">Generation Settings</h4>
                                <p className="text-xs text-muted-foreground">Configure how your content is created.</p>
                              </div>
                              <PlatformSelector />
                              <LengthSelector />
                              <CountSelector />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  <PresetsPanel />

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 px-2 pb-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={!input.trim() || isGenerating}
                      className="flex-1 h-14 text-base font-bold rounded-xl bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 flex items-center justify-center gap-3 transition-all duration-150 shadow-sm"
                    >
                      {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                      Generate posts
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setPostConfirmOpen(true)}
                        disabled={postingAllLoading || (!input.trim() && generatedPosts.length === 0)}
                        variant="secondary"
                        className="h-14 px-6 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground border border-border/50 font-semibold"
                      >
                        <Share2 className="w-5 h-5 mr-2" />
                        Post
                      </Button>

                      {generatedPosts.length > 0 && (
                        <Button
                          variant="ghost"
                          className="h-14 w-14 rounded-2xl border border-red-500/20 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
                          onClick={() => setGeneratedPosts([])}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="repurpose">
                <RepurposeWizard onPostsGenerated={(newPosts) => {
                  setGeneratedPosts(prev => [...prev, ...newPosts]);
                  setShowGeneratedPostsModal(true);
                }} />
              </TabsContent>
            </Tabs>

            {/* Generated Posts Full-Screen Modal */}
            <AnimatePresence>
              {showGeneratedPostsModal && generatedPosts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-4 sm:px-6 py-4">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h2 className="font-display text-xl font-bold text-foreground">Generated posts</h2>
                          <p className="text-xs text-muted-foreground">{generatedPosts.length} post{generatedPosts.length !== 1 ? 's' : ''} ready to edit & publish</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => {
                            setGeneratedPosts([]);
                            setShowGeneratedPostsModal(false);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowGeneratedPostsModal(false)}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="h-[calc(100vh-80px)] overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-border">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {generatedPosts.map((post, i) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          index={i}
                          totalPosts={generatedPosts.length}
                          isExpanded={expandedPost === post.id}
                          onToggleExpand={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                          onCopy={() => {
                            navigator.clipboard.writeText(post.content);
                            toast.success("Copied!");
                          }}
                          onDelete={() => handleDelete(post.id)}
                          onSchedule={() => {
                            setPostToSchedule({ id: post.id, content: post.content });
                            setScheduleModalOpen(true);
                          }}
                          onPostSuccess={() => toast.success("Posted!")}
                          onPostError={err => toast.error(err)}
                          isLinkedInConnected={isLinkedInConnected}
                          onUpdateMedia={updateMedia}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Direct Post Confirmation Modal */}
            {postConfirmOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-foreground">Post Confirmation</h3>
                    <button onClick={() => setPostConfirmOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
                  </div>

                  <p className="text-sm text-muted-foreground mb-5">
                    You are nearly there! Confirm your content below before posting to <strong>{platforms.length} connected platform{platforms.length !== 1 ? 's' : ''}</strong>.
                  </p>

                  <div className="bg-muted/50 p-4 rounded-xl border border-border mb-6 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-border">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{input || "(No text content)"}</p>
                    {uploadedMedia && (
                      <div className="mt-4">
                        {uploadedMediaType === "image" ? (
                          <img src={uploadedMedia} alt="Preview" className="max-h-60 w-full object-contain rounded-lg border border-border" />
                        ) : (
                          <video src={uploadedMedia} controls className="max-h-60 w-full rounded-lg border border-border" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setPostConfirmOpen(false)}
                      className="px-5 py-2.5 rounded-xl hover:bg-muted text-muted-foreground text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePostNow}
                      disabled={postingAllLoading}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
                    >
                      {postingAllLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm & Post
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Schedule Modal */}
            {postToSchedule && (
              <ScheduleModal
                isOpen={scheduleModalOpen}
                onClose={() => {
                  setScheduleModalOpen(false);
                  setPostToSchedule(null);
                }}
                post={postToSchedule}
                onSchedule={async (data) => {
                  try {
                    // Call backend to save schedule
                    const res = await fetch("/api/schedule", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        content: data.content,
                        scheduledAt: data.scheduleTime,
                        platform: "linkedin", // Defaulting for now
                        media: generatedPosts.find(p => p.id === data.postId)?.media || null,
                        mediaType: generatedPosts.find(p => p.id === data.postId)?.mediaType || null
                      })
                    });
                    if (!res.ok) throw new Error("Failed to schedule");
                    toast.success("Post scheduled successfully");
                  } catch (e) {
                    toast.error("Failed to schedule post");
                    throw e;
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => setShowOnboarding(false)}
        onVoiceProfileCreated={() => setHasVoiceProfile(true)}
        initialStep={onboardingStep}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        reason={upgradeReason}
      />
    </div>
  );
}