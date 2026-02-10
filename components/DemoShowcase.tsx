"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Dna,
    Calendar,
    TrendingUp,
    Clock,
    CheckCircle2,
    Zap,
    Users,
    MessageCircle,
    ArrowRight,
    BarChart3,
    Target,
    Layers
} from "lucide-react";

// Demo step configuration
const demoSteps = [
    {
        id: "voice-clone",
        title: "Writing DNA Technology",
        subtitle: "Your DNA, Perfected by AI",
        description: "See the difference between generic AI and Maxis DNA-trained content",
        icon: Dna,
        color: "from-violet-500 to-purple-600",
    },
    {
        id: "presets",
        title: "Smart Content Presets",
        subtitle: "One Click, Perfect Format",
        description: "Choose from proven viral formats to maximize engagement",
        icon: Layers,
        color: "from-blue-500 to-cyan-500",
    },
    {
        id: "batch",
        title: "Batch Content Creation",
        subtitle: "One Month in 30 Minutes",
        description: "Generate weeks of content in a single session",
        icon: Zap,
        color: "from-amber-500 to-orange-500",
    },
    {
        id: "schedule",
        title: "Smart Scheduling",
        subtitle: "Post Consistently, Automatically",
        description: "AI picks the best times to maximize your reach",
        icon: Calendar,
        color: "from-emerald-500 to-teal-500",
    },
    {
        id: "growth",
        title: "Build Credibility & Leads",
        subtitle: "Content That Converts",
        description: "Turn consistent posting into inbound leads and trust",
        icon: TrendingUp,
        color: "from-pink-500 to-rose-500",
    },
];

export default function DemoShowcase() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isInView, setIsInView] = useState(false);

    // Auto-advance steps when in view
    useEffect(() => {
        if (!isInView) return;

        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % demoSteps.length);
        }, 5000); // 5 seconds per step

        return () => clearInterval(interval);
    }, [isInView]);

    const step = demoSteps[currentStep];

    return (
        <section className="py-16 md:py-24 overflow-hidden bg-gradient-to-b from-background via-secondary/10 to-background">
            <div className="container mx-auto px-4 sm:px-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    onViewportEnter={() => setIsInView(true)}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 mb-4">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">See How It Works</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">
                        From Idea to <span className="bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">Engaging Content</span> in Seconds
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Watch how Maxis transforms your expertise into consistent, engaging content that builds trust and generates leads
                    </p>
                </motion.div>

                {/* Step Navigation Pills */}
                <div className="flex flex-wrap justify-center gap-2 mb-10">
                    {demoSteps.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => setCurrentStep(i)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${currentStep === i
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                }`}
                        >
                            <s.icon className="w-4 h-4 inline-block mr-1.5" />
                            {s.title.split(" ")[0]}
                        </button>
                    ))}
                </div>

                {/* Main Demo Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="max-w-5xl mx-auto"
                >
                    <div className="relative rounded-2xl border border-border/50 bg-card shadow-2xl shadow-violet-500/5 overflow-hidden">
                        {/* Demo Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">Maxis Studio</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {demoSteps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentStep === i ? "bg-primary w-6" : "bg-muted-foreground/30"
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="p-6 md:p-8 min-h-[450px]">
                            <AnimatePresence mode="wait">
                                {currentStep === 0 && <VoiceCloneStep key="voice" />}
                                {currentStep === 1 && <PresetsStep key="presets" />}
                                {currentStep === 2 && <BatchStep key="batch" />}
                                {currentStep === 3 && <ScheduleStep key="schedule" />}
                                {currentStep === 4 && <GrowthStep key="growth" />}
                            </AnimatePresence>
                        </div>

                        {/* Step Footer */}
                        <div className={`p-4 border-t border-border/50 bg-gradient-to-r ${step.color} bg-opacity-10`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <step.icon className="w-5 h-5 text-foreground" />
                                    <div>
                                        <p className="font-semibold text-foreground text-sm">{step.title}</p>
                                        <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {currentStep + 1} / {demoSteps.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1: Voice Clone Comparison
// ═══════════════════════════════════════════════════════════════════════════
function VoiceCloneStep() {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="grid md:grid-cols-2 gap-6"
        >
            {/* Generic AI */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
                    <span className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-xs">✕</span>
                    Generic AI
                </div>
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 min-h-[180px]">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        "In today's fast-paced business environment, it is essential to leverage innovative solutions.
                        Our comprehensive approach enables stakeholders to maximize synergies and drive sustainable growth..."
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-red-400">
                        <span className="px-2 py-1 rounded bg-red-500/10">🤖 Sounds robotic</span>
                        <span className="px-2 py-1 rounded bg-red-500/10">😴 No personality</span>
                    </div>
                </div>
            </div>

            {/* Maxis with Writing Style */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-500">
                    <span className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center"><Dna className="w-3 h-3" /></span>
                    Maxis + Your Writing DNA
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-blue-500/5 border border-violet-500/20 min-h-[180px]">
                    <p className="text-sm text-foreground leading-relaxed">
                        "Everyone told me newsletters don't work on LinkedIn.
                        <br /><br />
                        I ignored them.
                        <br /><br />
                        50,000 subscribers later? Here's what actually moved the needle..."
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
                        <span className="px-2 py-1 rounded bg-green-500/10">✨ Sounds like YOU</span>
                        <span className="px-2 py-1 rounded bg-green-500/10">🔥 Scroll-stopping</span>
                    </div>
                </div>
            </div>

            {/* Differentiator */}
            <div className="md:col-span-2 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 border border-violet-500/20">
                <div className="flex items-center gap-3">
                    <Dna className="w-8 h-8 text-violet-500" />
                    <div>
                        <p className="font-semibold text-foreground">AI trains on YOUR Writing DNA</p>
                        <p className="text-sm text-muted-foreground">Feed it 3-5 of your best posts and watch AI write exactly like you</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2: Presets
// ═══════════════════════════════════════════════════════════════════════════
function PresetsStep() {
    const presets = [
        { name: "Thought Leadership", emoji: "💡", engagement: "94%" },
        { name: "Contrarian Hot Take", emoji: "🔥", engagement: "89%" },
        { name: "Personal Story", emoji: "📖", engagement: "91%" },
        { name: "Quick Tips", emoji: "⚡", engagement: "86%" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Choose a proven viral format</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {presets.map((preset, i) => (
                    <motion.div
                        key={preset.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${i === 0
                            ? "bg-gradient-to-br from-violet-500/10 to-blue-500/10 border-violet-500/30 shadow-lg shadow-violet-500/10"
                            : "bg-card border-border hover:border-primary/30"
                            }`}
                    >
                        <div className="text-2xl mb-2">{preset.emoji}</div>
                        <p className="font-medium text-sm text-foreground">{preset.name}</p>
                        <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> {preset.engagement}
                        </p>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-blue-500/5 border border-violet-500/20"
            >
                <p className="text-sm font-medium text-foreground mb-2">Generated with "Thought Leadership" preset:</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    "The biggest lie in consulting? That you need 20 years of experience to have a hot take.
                    <br /><br />
                    Here's what I've learned after just 3 years that senior partners won't tell you..."
                </p>
            </motion.div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3: Batch Content
// ═══════════════════════════════════════════════════════════════════════════
function BatchStep() {
    const posts = [
        { day: "Mon", title: "Newsletter growth tip", status: "ready" },
        { day: "Wed", title: "Industry hot take", status: "ready" },
        { day: "Fri", title: "Personal story", status: "ready" },
        { day: "Mon", title: "Quick tip thread", status: "pending" },
        { day: "Wed", title: "Case study", status: "pending" },
        { day: "Fri", title: "Contrarian view", status: "pending" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-foreground">Content Calendar</h3>
                    <p className="text-sm text-muted-foreground">2 weeks of content generated in 30 minutes</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-primary">6</span>
                    <p className="text-xs text-muted-foreground">posts ready</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {posts.map((post, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-3 rounded-lg border ${post.status === "ready"
                            ? "bg-green-500/5 border-green-500/20"
                            : "bg-muted/50 border-border"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">{post.day}</span>
                            {post.status === "ready" ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                                <Clock className="w-4 h-4 text-muted-foreground" />
                            )}
                        </div>
                        <p className="text-sm font-medium text-foreground">{post.title}</p>
                    </motion.div>
                ))}
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <Zap className="w-8 h-8 text-amber-500" />
                <div>
                    <p className="font-semibold text-foreground">Time saved: 10+ hours/week</p>
                    <p className="text-sm text-muted-foreground">That's 520+ hours per year back in your pocket</p>
                </div>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4: Schedule & Automation
// ═══════════════════════════════════════════════════════════════════════════
function ScheduleStep() {
    const schedule = [
        { time: "9:00 AM", platform: "LinkedIn", engagement: "Peak", posts: 3 },
        { time: "12:30 PM", platform: "Twitter", engagement: "High", posts: 2 },
        { time: "5:00 PM", platform: "LinkedIn", engagement: "Peak", posts: 2 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <div className="grid md:grid-cols-2 gap-6">
                {/* Weekly Schedule Preview */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        AI-Optimized Schedule
                    </h3>
                    {schedule.map((slot, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-mono text-primary">{slot.time}</span>
                                <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-500">{slot.platform}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-green-500">{slot.engagement}</span>
                                <span className="text-xs text-muted-foreground">{slot.posts} posts</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Automation Features */}
                <div className="space-y-3">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Automation Features
                    </h3>
                    {[
                        { text: "Auto-publish at optimal times", icon: Clock },
                        { text: "Cross-post to multiple platforms", icon: Layers },
                        { text: "Never miss a posting day", icon: CheckCircle2 },
                        { text: "Engagement alerts & reminders", icon: MessageCircle },
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                        >
                            <feature.icon className="w-4 h-4 text-primary" />
                            <span className="text-sm text-foreground">{feature.text}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                <p className="text-center text-sm text-foreground">
                    <span className="font-semibold">Result:</span> Post consistently without thinking about it
                </p>
            </div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5: Growth & Leads
// ═══════════════════════════════════════════════════════════════════════════
function GrowthStep() {
    const metrics = [
        { label: "Profile Views", value: "+340%", trend: "up" },
        { label: "Engagement Rate", value: "8.2%", trend: "up" },
        { label: "Inbound Leads", value: "12/mo", trend: "up" },
        { label: "Time Invested", value: "2hrs/wk", trend: "down" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((m, i) => (
                    <motion.div
                        key={m.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-xl bg-muted/50 border border-border text-center"
                    >
                        <p className={`text-2xl font-bold ${m.trend === "up" ? "text-green-500" : "text-primary"}`}>
                            {m.value}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Trust Building */}
            <div className="grid md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-violet-500/5 to-blue-500/5 border border-violet-500/20"
                >
                    <Target className="w-6 h-6 text-violet-500 mb-2" />
                    <h4 className="font-semibold text-foreground text-sm">Build Authority</h4>
                    <p className="text-xs text-muted-foreground mt-1">Consistent posting = perceived expertise</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-pink-500/5 to-rose-500/5 border border-pink-500/20"
                >
                    <Users className="w-6 h-6 text-pink-500 mb-2" />
                    <h4 className="font-semibold text-foreground text-sm">Grow Audience</h4>
                    <p className="text-xs text-muted-foreground mt-1">More visibility = more followers</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20"
                >
                    <BarChart3 className="w-6 h-6 text-emerald-500 mb-2" />
                    <h4 className="font-semibold text-foreground text-sm">Generate Leads</h4>
                    <p className="text-xs text-muted-foreground mt-1">Trust converts to DMs and calls</p>
                </motion.div>
            </div>

            {/* Final CTA */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-6 rounded-xl bg-gradient-to-r from-violet-600/20 to-blue-600/20 border border-violet-500/30 text-center"
            >
                <p className="text-lg font-semibold text-foreground mb-2">
                    Stop being the best-kept secret in your industry
                </p>
                <p className="text-sm text-muted-foreground">
                    Maxis helps you show up consistently, build credibility, and turn content into conversations
                </p>
            </motion.div>
        </motion.div>
    );
}
