"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    ArrowRight,
    Star,
    Zap,
    MessageCircle,
    BarChart3,
    ChevronRight,
    ChevronDown,
    Calendar,
    Sparkles,
    Clock,
    Play,
    Target,
    TrendingUp,
    Users,
    Dna,
    Brain,
    Send,
    Eye,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { AuthModal } from "@/components/auth-modal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DemoShowcase from "@/components/DemoShowcase";

// Typewriter animation component
function TypewriterText({ text, speed = 50 }: { text: string; speed?: number }) {
    const [displayedText, setDisplayedText] = useState("");
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        if (!isInView) return;

        let index = 0;
        const interval = setInterval(() => {
            setDisplayedText(text.slice(0, index + 1));
            index++;
            if (index >= text.length) {
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed, isInView]);

    return (
        <motion.span
            onViewportEnter={() => setIsInView(true)}
            viewport={{ once: true }}
        >
            {displayedText}
            {displayedText.length < text.length && (
                <span className="inline-block w-0.5 h-5 bg-primary animate-pulse ml-0.5" />
            )}
        </motion.span>
    );
}

/* ==========================================================================
   MAXIS LANDING PAGE V3
   Built on Market Research & Product-Market Fit Strategy
   Target: Solo Professionals (Coaches, Consultants, Freelancers, Founders)
   ========================================================================== */

export default function LandingPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [activeTestimonial, setActiveTestimonial] = useState(0);

    const openAuth = (mode: "login" | "signup" = "signup") => {
        setAuthMode(mode);
        setAuthOpen(true);
    };

    const handleCTA = () => {
        if (session) {
            router.push("/dashboard");
        } else {
            openAuth("signup");
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // DATA (Based on Market Research)
    // ─────────────────────────────────────────────────────────────────────────

    const platforms = [
        { name: "LinkedIn", logo: "in", bg: "bg-[#0A66C2]" },
        { name: "X", logo: "𝕏", bg: "bg-black dark:bg-white dark:text-black" },
        { name: "Instagram", logo: "◷", bg: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400" },
        { name: "TikTok", logo: "♪", bg: "bg-black dark:bg-white dark:text-black" },
        { name: "Threads", logo: "@", bg: "bg-black dark:bg-white dark:text-black" },
    ];

    // Pain points from research
    const painPoints = [
        { icon: Clock, text: "Spending hours on content that gets ignored" },
        { icon: MessageCircle, text: "AI tools that sound robotic, not like you" },
        { icon: TrendingUp, text: "Posting inconsistently, missing opportunities" },
        { icon: Target, text: "No idea if your content is generating leads" },
    ];

    // Features mapped to value propositions from research
    const features = [
        {
            icon: Dna,
            title: "AI That Actually Sounds Like You",
            description: "Train Maxis on your past content. Every post matches your Writing DNA — not generic AI slop that hurts your credibility.",
            highlight: "The #1 reason pros switch to Maxis",
            gradient: "from-violet-500 to-purple-600",
        },
        {
            icon: Sparkles,
            title: "From Idea to 7 Posts in 5 Minutes",
            description: "One topic becomes a LinkedIn post, X thread, carousel script, and more. Stop staring at blank screens.",
            highlight: "Save 10+ hours every week",
            gradient: "from-blue-500 to-cyan-500",
        },
        {
            icon: Calendar,
            title: "Set It and Forget It Scheduling",
            description: "Best-time posting. Visual calendar. Auto-queue. Stay consistent without living in your scheduling app.",
            highlight: "Never miss a posting day",
            gradient: "from-emerald-500 to-teal-500",
        },
        {
            icon: Eye,
            title: "See Who's Watching",
            description: "Track profile views, engagement trends, and which posts drive the most DMs. Finally prove your content ROI.",
            highlight: "Content → Leads visibility",
            gradient: "from-orange-500 to-red-500",
        },
        {
            icon: Send,
            title: "Engagement on Autopilot",
            description: "Auto-engage with your target audience. Comment thoughtfully. Build relationships while you sleep.",
            highlight: "24/7 presence without the burnout",
            gradient: "from-pink-500 to-rose-500",
        },
        {
            icon: Brain,
            title: "Learn What Works",
            description: "AI analyzes your top-performing content and suggests what to create next. Data-driven growth, not guesswork.",
            highlight: "Double down on winners",
            gradient: "from-amber-500 to-yellow-500",
        },
    ];

    // Testimonials targeting our ICP
    const testimonials = [
        {
            quote: "I've tried Hootsuite, Buffer, Taplio — Maxis is the first tool where the AI actually sounds like me. My audience can't tell the difference.",
            name: "Sarah Mitchell",
            role: "Leadership Coach",
            avatar: "SM",
            metric: "3x engagement in 60 days",
        },
        {
            quote: "As a consultant, my time is billable. Maxis turned content from a 4-hour Sunday task into a 30-minute habit. Game changer.",
            name: "David Park",
            role: "Management Consultant",
            avatar: "DP",
            metric: "10 hrs/week saved",
        },
        {
            quote: "I finally get inbound leads from LinkedIn. Maxis helped me post consistently and actually track what's working.",
            name: "Rachel Torres",
            role: "Freelance Brand Strategist",
            avatar: "RT",
            metric: "12 new clients in 3 months",
        },
    ];

    // Pricing from research recommendations
    const pricingPlans = [
        {
            name: "Free Trial",
            price: "$0",
            period: "forever",
            description: "Experience the Maxis difference",
            features: [
                "10 AI posts per month",
                "Basic Writing DNA",
                "1 social account",
                "7-day analytics",
            ],
            cta: "Get Started Free",
            popular: false,
        },
        {
            name: "Strategy",
            price: "$49",
            period: "/month",
            description: "For serious professionals",
            features: [
                "1,000 AI posts / month",
                "Deep Writing DNA",
                "Repurpose Engine (1→7)",
                "ROI Analytics",
                "Smart Scheduling",
                "All Platforms",
            ],
            cta: "Start 14-Day Free Trial",
            popular: true,
        },
        {
            name: "Enterprise",
            price: "$199",
            period: "/month",
            description: "For scaling teams",
            features: [
                "5,000 AI posts / month",
                "5 Client Workspaces",
                "White-label Reports",
                "Team API Access",
                "Priority 24/7 Support",
            ],
            cta: "Get Started",
            popular: false,
        },
        {
            name: "Agency",
            price: "Custom",
            period: "",
            description: "For large organizations",
            features: [
                "Unlimited AI Content",
                "Unlimited Workspaces",
                "Custom Contracts",
                "Dedicated Success Manager",
                "SSO & Security",
            ],
            cta: "Contact Sales",
            popular: false,
        },
    ];

    // FAQs addressing trust concerns from research
    const faqs = [
        {
            question: "Will the AI really sound like me, not a robot?",
            answer: "Yes. During onboarding, you'll paste 5-10 of your best posts. Maxis learns your vocabulary, sentence structure, and tone. Most users say it nails their voice within the first week. You can always edit and the AI learns from your changes.",
        },
        {
            question: "I've tried other tools and they're too complicated. Is Maxis different?",
            answer: "We built Maxis for busy professionals, not marketing agencies with dedicated teams. No 47-tab dashboards. No 2-hour onboarding. You'll create your first AI post in under 3 minutes.",
        },
        {
            question: "Will using AI hurt my authenticity or credibility?",
            answer: "Generic AI hurts credibility. Personalized AI that sounds like you amplifies your expertise. Think of Maxis as a writing assistant that knows your style — you're still the expert, we just help you express it faster.",
        },
        {
            question: "How is this different from ChatGPT or Taplio?",
            answer: "ChatGPT writes generic content with no scheduling or analytics. Taplio's AI often sounds templated and they've had issues with LinkedIn account warnings. Maxis is voice-first: every feature is built around making AI sound like YOU, safely.",
        },
        {
            question: "What if I want to cancel?",
            answer: "Cancel anytime with one click. No contracts, no hidden fees. We'll even email you before your trial ends so you're never surprised.",
        },
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
            <Navbar />

            {/* ════════════════════════════════════════════════════════════════════
          HERO SECTION - Pain Point Focused
      ════════════════════════════════════════════════════════════════════ */}
            <section className="relative pt-24 pb-16 md:pt-36 md:pb-24 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-violet-500/15 to-blue-500/15 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: "1s" }} />
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
                </div>

                <div className="container mx-auto px-4 sm:px-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-4xl mx-auto text-center"
                    >
                        {/* Target Audience Badge */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.15 }}
                            className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/5 border border-primary/20"
                        >
                            <Users className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">
                                Built for Coaches, Consultants & Founders
                            </span>
                        </motion.div>

                        {/* Value Proposition Headline */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6">
                            <span className="block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Write Like You.
                            </span>
                            <span className="block bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Post Like a Pro.
                            </span>
                            <span className="block mt-1 bg-gradient-to-r from-violet-500 via-blue-500 via-cyan-500 to-amber-400 bg-clip-text text-transparent">
                                Maximize Growth.
                            </span>
                        </h1>

                        {/* Subheadline - Address Core Pain */}
                        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                            You're an expert at what you do — not at content marketing.{" "}
                            <span className="text-foreground font-medium">
                                Maxis creates posts that sound like you
                            </span>{" "}
                            so you can build credibility, get leads, and grow your business.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                            <Button
                                onClick={handleCTA}
                                size="lg"
                                className="w-full sm:w-auto h-14 px-8 text-base sm:text-lg font-semibold rounded-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-[1.02] text-white border-0"
                            >
                                Create Your First Post Free
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="lg"
                                className="w-full sm:w-auto h-14 px-8 text-base font-medium rounded-full hover:bg-secondary/50"
                                onClick={() => document.getElementById("demo-showcase")?.scrollIntoView({ behavior: "smooth" })}
                            >
                                <Play className="mr-2 w-4 h-4" />
                                See How It Works
                            </Button>
                        </div>

                        {/* Trust Signals */}
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-green-500" />
                                Free forever plan
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-green-500" />
                                No credit card required
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-green-500" />
                                Your voice, not robot voice
                            </span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
          PAIN POINTS SECTION
      ════════════════════════════════════════════════════════════════════ */}
            <section className="py-12 md:py-16 border-y border-border/30 bg-secondary/20">
                <div className="container mx-auto px-4 sm:px-6">
                    <p className="text-center text-sm font-medium text-muted-foreground mb-8">
                        Sound familiar?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {painPoints.map((pain, i) => (
                            <motion.div
                                key={pain.text}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50"
                            >
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                    <pain.icon className="w-5 h-5 text-red-500" />
                                </div>
                                <span className="text-sm text-muted-foreground">{pain.text}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
          PLATFORM LOGOS - Infinite Scroll
      ════════════════════════════════════════════════════════════════════ */}
            <section className="py-12 overflow-hidden">
                <div className="container mx-auto px-4 sm:px-6 mb-6">
                    <p className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest">
                        One Dashboard. All Your Platforms.
                    </p>
                </div>

                <div className="relative">
                    <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

                    <div className="flex animate-scroll-left">
                        {[...platforms, ...platforms, ...platforms, ...platforms].map((platform, i) => (
                            <div key={`${platform.name}-${i}`} className="flex-shrink-0 mx-3 md:mx-5">
                                <div className={`flex items-center gap-2.5 px-5 py-3 rounded-full ${platform.bg} text-white shadow-lg`}>
                                    <span className="text-lg font-bold">{platform.logo}</span>
                                    <span className="font-semibold text-sm whitespace-nowrap">{platform.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <style jsx>{`
          @keyframes scroll-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-100% / 4)); }
          }
          .animate-scroll-left {
            animation: scroll-left 20s linear infinite;
          }
          .animate-scroll-left:hover {
            animation-play-state: paused;
          }
        `}</style>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
          ANIMATED DEMO SECTION - Comprehensive Feature Showcase
      ════════════════════════════════════════════════════════════════════ */}
            <div id="demo-showcase">
                <DemoShowcase />
            </div>

            {/* ════════════════════════════════════════════════════════════════════
          HOW IT WORKS / FEATURES
      ════════════════════════════════════════════════════════════════════ */}
            <section id="how-it-works" className="py-20 md:py-28">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="mb-14 md:mb-20 text-center max-w-3xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
                                Finally, a tool that works the way you do
                            </p>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                                Build Your Personal Brand
                                <br />
                                <span className="text-muted-foreground">Without Becoming a Full-Time Creator</span>
                            </h2>
                        </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {features.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="group relative bg-card rounded-2xl p-6 md:p-8 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
                            >
                                {/* Highlight Badge */}
                                <div className="absolute -top-3 left-6 px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                    {feature.highlight}
                                </div>

                                {/* Icon */}
                                <div
                                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg`}
                                >
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
          VOICE CLONING HIGHLIGHT
      ════════════════════════════════════════════════════════════════════ */}
            <section className="py-20 md:py-28 bg-gradient-to-b from-secondary/30 to-background border-y border-border/30">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12"
                        >
                            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
                                <Dna className="w-4 h-4 text-violet-500" />
                                <span className="text-sm font-medium text-violet-500">The Maxis Difference</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                                AI That Learns <span className="text-primary">Your Writing DNA</span>
                            </h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Most AI sounds like everyone else. Maxis sounds like <em>you</em>.
                            </p>
                        </motion.div>

                        {/* Before/After Comparison */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-card rounded-2xl p-6 border border-red-500/20"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-sm font-medium text-red-500">Generic AI</span>
                                </div>
                                <p className="text-muted-foreground italic leading-relaxed">
                                    "In today's fast-paced business environment, it's crucial to leverage synergies and drive value-added outcomes through strategic initiatives that maximize stakeholder engagement..."
                                </p>
                                <p className="text-xs text-red-500/70 mt-3">Sounds like everyone else. Hurts credibility.</p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-card rounded-2xl p-6 border border-green-500/20"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-sm font-medium text-green-500">Maxis (Your Voice)</span>
                                </div>
                                <p className="text-foreground leading-relaxed">
                                    "Here's what I learned after 10 years of coaching executives: The best leaders don't have all the answers. They ask better questions. Here are 3 that changed everything for my clients..."
                                </p>
                                <p className="text-xs text-green-500/70 mt-3">Sounds like you wrote it. Builds trust.</p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════════════════ */}
            <section className="py-20 md:py-28">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                            Trusted by Professionals Like You
                        </h2>
                        <p className="text-lg text-muted-foreground">Real results from real users.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {testimonials.map((testimonial, i) => (
                            <motion.div
                                key={testimonial.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-card rounded-2xl p-6 md:p-8 border border-border/50"
                            >
                                <div className="flex gap-1 mb-4">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="text-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{testimonial.name}</p>
                                            <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                                        {testimonial.metric}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════════════════════════ */}
            <section className="py-20 md:py-28 bg-secondary/20 border-y border-border/30">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="mb-14 text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Simple, Honest Pricing</h2>
                        <p className="text-lg text-muted-foreground">
                            Start free. Upgrade when you're ready. Cancel anytime.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
                        {pricingPlans.map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative bg-card rounded-2xl p-6 md:p-8 border-2 ${plan.popular ? "border-primary shadow-xl shadow-primary/10" : "border-border/50"
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg">
                                        MOST POPULAR
                                    </div>
                                )}
                                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-1">
                                    <span className="text-4xl md:text-5xl font-black">{plan.price}</span>
                                    {plan.period !== "forever" && (
                                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm">
                                            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    onClick={handleCTA}
                                    className={`w-full h-12 rounded-xl font-semibold ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
                                    variant={plan.popular ? "default" : "outline"}
                                >
                                    {plan.cta}
                                </Button>
                            </motion.div>
                        ))}
                    </div>

                    <p className="text-center text-sm text-muted-foreground mt-8">
                        All plans include a 14-day money-back guarantee. No questions asked.
                    </p>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════════════════════ */}
            <section className="py-20 md:py-28">
                <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Common Questions</h2>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-card border border-border/50 rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors"
                                >
                                    <span className="font-semibold text-sm md:text-base pr-4">{faq.question}</span>
                                    <ChevronDown
                                        className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""
                                            }`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {openFaq === i && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-5 pb-5 text-sm md:text-base text-muted-foreground leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════════════════ */}
            <section className="py-24 md:py-36 relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-violet-500/15 to-blue-500/15 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                            Your expertise deserves
                            <br />
                            <span className="bg-gradient-to-r from-violet-500 via-blue-500 to-amber-400 bg-clip-text text-transparent">
                                to be seen.
                            </span>
                        </h2>
                        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
                            Stop letting content hold you back. Start building the personal brand your expertise deserves.
                        </p>
                        <Button
                            onClick={handleCTA}
                            size="lg"
                            className="h-14 md:h-16 px-10 md:px-14 text-lg md:text-xl font-bold rounded-full bg-gradient-to-r from-violet-600 via-blue-600 to-amber-500 hover:from-violet-700 hover:via-blue-700 hover:to-amber-600 shadow-2xl shadow-violet-500/30 hover:shadow-amber-500/40 transition-all hover:scale-105 text-white border-0"
                        >
                            Get Started Free
                            <ArrowRight className="ml-3 w-5 h-5 md:w-6 md:h-6" />
                        </Button>
                        <p className="mt-6 text-sm text-muted-foreground">
                            Free forever plan. No credit card required.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ════════════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════════════ */}
            <footer className="py-10 border-t border-border/30">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground">© 2025 Maxis. All rights reserved.</p>
                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                            <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
                        </div>
                    </div>
                </div>
            </footer>

            <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} />
        </div>
    );
}