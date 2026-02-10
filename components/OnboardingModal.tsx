"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ChevronRight,
    ChevronLeft,
    Check,
    Briefcase,
    Linkedin,
    Target,
    Dna,
    Calendar,
    Sparkles,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    onVoiceProfileCreated?: () => void;
    initialStep?: number;
}

const TOTAL_STEPS = 5;

const BUSINESS_TYPES = [
    { id: "coach", label: "Coach", icon: "🎯" },
    { id: "consultant", label: "Consultant", icon: "💼" },
    { id: "freelancer", label: "Freelancer", icon: "✨" },
    { id: "founder", label: "Founder/CEO", icon: "🚀" },
    { id: "creator", label: "Content Creator", icon: "🎬" },
    { id: "agency", label: "Agency Owner", icon: "🏢" },
    { id: "other", label: "Other", icon: "📋" },
];

const PLATFORMS = [
    { id: "linkedin", label: "LinkedIn", icon: "in", color: "bg-[#0A66C2]" },
    { id: "twitter", label: "X (Twitter)", icon: "𝕏", color: "bg-black" },
    { id: "instagram", label: "Instagram", icon: "◷", color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" },
    { id: "tiktok", label: "TikTok", icon: "♪", color: "bg-black" },
    { id: "facebook", label: "Facebook", icon: "f", color: "bg-[#1877F2]" },
];

const GOALS = [
    { id: "credibility", label: "Build credibility & authority", icon: "🏆" },
    { id: "leads", label: "Generate leads & clients", icon: "🎯" },
    { id: "audience", label: "Grow my audience", icon: "📈" },
    { id: "brand", label: "Build personal brand", icon: "⭐" },
    { id: "traffic", label: "Drive website traffic", icon: "🔗" },
    { id: "sales", label: "Sell products/services", icon: "💰" },
];

const FREQUENCIES = [
    { id: "daily", label: "Daily", description: "7+ posts/week" },
    { id: "frequently", label: "Frequently", description: "3-5 posts/week" },
    { id: "weekly", label: "Weekly", description: "1-2 posts/week" },
    { id: "occasional", label: "Occasional", description: "A few times/month" },
];

export default function OnboardingModal({
    isOpen,
    onClose,
    onComplete,
    onVoiceProfileCreated,
    initialStep = 0,
}: OnboardingModalProps) {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [isLoading, setIsLoading] = useState(false);

    // Form data
    const [businessType, setBusinessType] = useState<string>("");
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [voiceSamples, setVoiceSamples] = useState<string>("");
    const [postingFrequency, setPostingFrequency] = useState<string>("");

    useEffect(() => {
        setCurrentStep(initialStep);
    }, [initialStep]);

    const saveProgress = async (step: number, data?: any, completed = false) => {
        try {
            await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ step, data, completed }),
            });
        } catch (error) {
            console.error("Failed to save progress:", error);
        }
    };

    const handleNext = async () => {
        setIsLoading(true);

        // Save current step data
        let stepData = {};
        switch (currentStep) {
            case 0:
                stepData = { businessType };
                break;
            case 1:
                stepData = { platforms: selectedPlatforms };
                break;
            case 2:
                stepData = { goals: selectedGoals };
                break;
            case 3:
                if (voiceSamples.trim()) {
                    const samples = voiceSamples.split("\n\n").filter(Boolean);
                    stepData = { voiceSamples: samples };
                    // Also save to localStorage for voice clone feature
                    localStorage.setItem("maxis_voice_profile", JSON.stringify({
                        samples,
                        traits: ["conversational", "authentic", "expert"],
                        createdAt: new Date().toISOString()
                    }));
                    // Notify parent that voice profile was created
                    onVoiceProfileCreated?.();
                }
                break;
            case 4:
                stepData = { postingFrequency };
                break;
        }

        if (currentStep < TOTAL_STEPS - 1) {
            await saveProgress(currentStep + 1, stepData);
            setCurrentStep(currentStep + 1);
        } else {
            // Complete onboarding
            await saveProgress(TOTAL_STEPS, stepData, true);
            toast.success("Welcome to Maxis! 🎉");
            onComplete();
        }

        setIsLoading(false);
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = async () => {
        try {
            // Just close without completing - will show again next login
            await fetch("/api/onboarding", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skipToStep: currentStep }),
            });
            onClose();
        } catch (error) {
            onClose();
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return !!businessType;
            case 1:
                return selectedPlatforms.length > 0;
            case 2:
                return selectedGoals.length > 0;
            case 3:
                return true; // Voice samples optional
            case 4:
                return !!postingFrequency;
            default:
                return true;
        }
    };

    const togglePlatform = (id: string) => {
        setSelectedPlatforms((prev) =>
            prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
        );
    };

    const toggleGoal = (id: string) => {
        setSelectedGoals((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                                <Briefcase className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">What do you do?</h2>
                            <p className="text-muted-foreground">This helps us personalize your experience</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {BUSINESS_TYPES.map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setBusinessType(type.id)}
                                    className={`p-4 rounded-xl border-2 transition-all text-left ${businessType === type.id
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <span className="text-2xl mb-2 block">{type.icon}</span>
                                    <span className="font-medium">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <Linkedin className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Where do you post?</h2>
                            <p className="text-muted-foreground">Select all platforms you want to grow on</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {PLATFORMS.map((platform) => (
                                <button
                                    key={platform.id}
                                    onClick={() => togglePlatform(platform.id)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedPlatforms.includes(platform.id)
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center text-white font-bold`}>
                                        {platform.icon}
                                    </div>
                                    <span className="font-medium flex-1 text-left">{platform.label}</span>
                                    {selectedPlatforms.includes(platform.id) && (
                                        <Check className="w-5 h-5 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                <Target className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">What are your goals?</h2>
                            <p className="text-muted-foreground">Select all that apply</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {GOALS.map((goal) => (
                                <button
                                    key={goal.id}
                                    onClick={() => toggleGoal(goal.id)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selectedGoals.includes(goal.id)
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <span className="text-2xl">{goal.icon}</span>
                                    <span className="font-medium flex-1">{goal.label}</span>
                                    {selectedGoals.includes(goal.id) && (
                                        <Check className="w-5 h-5 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                <Dna className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Train your Deep DNA</h2>
                            <p className="text-muted-foreground">
                                To analyze your unique Writing DNA, we need <strong>10-20 examples</strong> of your best work.
                            </p>
                        </div>

                        {/* LinkedIn Import Option */}
                        <div className="space-y-3">
                            <button
                                onClick={async () => {
                                    setIsLoading(true);
                                    try {
                                        // Check if LinkedIn is connected
                                        const socialRes = await fetch("/api/social");
                                        const socialData = await socialRes.json();

                                        if (!socialData.linkedin?.connected) {
                                            // Redirect to LinkedIn OAuth
                                            window.location.href = "/api/auth/linkedin";
                                            return;
                                        }

                                        // Fetch LinkedIn posts for voice cloning
                                        const postsRes = await fetch("/api/linkedin/posts");
                                        if (postsRes.ok) {
                                            const postsData = await postsRes.json();
                                            if (postsData.posts && postsData.posts.length > 0) {
                                                const importedPosts = postsData.posts
                                                    .slice(0, 20)
                                                    .map((p: any) => p.text || p.content)
                                                    .filter(Boolean)
                                                    .join("\n\n");
                                                setVoiceSamples(importedPosts);
                                                toast.success(`Imported ${Math.min(postsData.posts.length, 20)} posts from LinkedIn!`);
                                            } else {
                                                toast.error("No posts found on your LinkedIn profile");
                                            }
                                        } else {
                                            toast.error("Failed to fetch LinkedIn posts");
                                        }
                                    } catch (err) {
                                        toast.error("Failed to connect to LinkedIn");
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-[#0A66C2]/30 bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 transition-all text-left group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-[#0A66C2] flex items-center justify-center text-white font-bold text-lg">
                                    in
                                </div>
                                <div className="flex-1">
                                    <span className="font-semibold text-foreground block">Import from LinkedIn</span>
                                    <span className="text-sm text-muted-foreground">Auto-import your last 20 posts</span>
                                </div>
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-[#0A66C2]" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-[#0A66C2] transition-colors" />
                                )}
                            </button>

                            <div className="relative flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border"></div>
                                </div>
                                <span className="relative bg-card px-3 text-xs text-muted-foreground">or paste manually</span>
                            </div>
                        </div>

                        <Textarea
                            placeholder="Paste 10-20 of your best posts here. The more you provide, the deeper the DNA analysis..."
                            value={voiceSamples}
                            onChange={(e) => setVoiceSamples(e.target.value)}
                            className="min-h-[200px] resize-none"
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            Quality in = Quality out. Don't skip this.
                        </p>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">How often will you post?</h2>
                            <p className="text-muted-foreground">We'll help you stay consistent</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {FREQUENCIES.map((freq) => (
                                <button
                                    key={freq.id}
                                    onClick={() => setPostingFrequency(freq.id)}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${postingFrequency === freq.id
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                        }`}
                                >
                                    <div className="text-left">
                                        <span className="font-medium block">{freq.label}</span>
                                        <span className="text-sm text-muted-foreground">{freq.description}</span>
                                    </div>
                                    {postingFrequency === freq.id && (
                                        <Check className="w-5 h-5 text-primary" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
                >
                    {/* Progress Bar */}
                    <div className="h-1 bg-muted">
                        <motion.div
                            className="h-full bg-gradient-to-r from-violet-500 to-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <span className="font-semibold">Getting Started</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                                {currentStep + 1} of {TOTAL_STEPS}
                            </span>
                            <button
                                onClick={handleSkip}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Skip for now
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderStep()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-4 border-t border-border bg-muted/30">
                        <Button
                            variant="ghost"
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className="gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <Button
                            onClick={handleNext}
                            disabled={!canProceed() || isLoading}
                            className="gap-2 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : currentStep === TOTAL_STEPS - 1 ? (
                                <>
                                    Complete
                                    <Check className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Continue
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
