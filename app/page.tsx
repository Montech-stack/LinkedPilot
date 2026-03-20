"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import { AuthModal } from "@/components/auth-modal"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { FaLinkedinIn, FaInstagram, FaFacebookF } from "react-icons/fa"
import { FaXTwitter, FaTiktok, FaThreads } from "react-icons/fa6"

export default function LandingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const openAuth = (mode: "login" | "signup" = "signup") => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const handleCTA = () => {
    if (session) {
      router.push("/dashboard")
    } else {
      openAuth("signup")
    }
  }

  const platforms = [
    { name: "LinkedIn",    Icon: FaLinkedinIn, className: "text-[#0A66C2]" },
    { name: "X (Twitter)", Icon: FaXTwitter,   className: "text-foreground" },
    { name: "Instagram",   Icon: FaInstagram,  className: "text-[#E1306C]" },
    { name: "TikTok",      Icon: FaTiktok,     className: "text-foreground" },
    { name: "Threads",     Icon: FaThreads,    className: "text-foreground" },
    { name: "Facebook",    Icon: FaFacebookF,  className: "text-[#1877F2]" },
  ]

  const problems = [
    {
      label: "01",
      title: "You're the best-kept secret in your field",
      body: "Your clients rave about you. Your work is exceptional. But the coaches and consultants landing the clients you want are online every day — and you're not.",
    },
    {
      label: "02",
      title: "You've tried AI and it made things worse",
      body: "Generic AI tools write the same post for everyone. Your audience can tell. It doesn't sound like you — and that erodes the very credibility you've spent years building.",
    },
    {
      label: "03",
      title: "You go quiet and lose the ground you've gained",
      body: "Three posts one week, silence for two months. The algorithm forgets you. Your audience forgets you. You start over every single time.",
    },
  ]

  const features = [
    {
      number: "01",
      title: "Every post sounds like you wrote it",
      body: "During setup you paste a few of your existing posts. Maxis learns your vocabulary, how you structure ideas, and the opinions you hold. Every post it writes from then on sounds like you — not a template.",
    },
    {
      number: "02",
      title: "One idea reaches every platform",
      body: "Share one thought. Maxis turns it into a LinkedIn post, an X thread, a short-form caption, a carousel script, and more. Your expertise goes everywhere your clients already are.",
    },
    {
      number: "03",
      title: "Consistent without the effort",
      body: "A visual calendar, smart queue suggestions, and scheduling that posts at the right time — even during your busiest client weeks.",
    },
    {
      number: "04",
      title: "Know which posts bring clients",
      body: "See which posts drive profile visits, track engagement over time, and know exactly which content is moving people from follower to paying client.",
    },
  ]

  const testimonials = [
    {
      quote: "Three months in, I signed 12 new clients who found me through LinkedIn. I never had to pitch a single one of them. They came in warm, already trusting me.",
      name: "Rachel Torres",
      role: "Brand Strategist",
      company: "Torres Creative",
      initials: "RT",
      metric: "12 inbound clients in 3 months",
    },
    {
      quote: "Every hour I spend on content is an hour I'm not billing. Maxis cut my content time from four hours a week to thirty minutes. That's real money back in my pocket.",
      name: "David Park",
      role: "Management Consultant",
      company: "Independent",
      initials: "DP",
      metric: "10 billable hours reclaimed weekly",
    },
    {
      quote: "I've tried every tool out there. Maxis is the only one where the output actually sounds like me. My clients tell me my LinkedIn posts are what made them reach out.",
      name: "Sarah Mitchell",
      role: "Leadership Coach",
      company: "Mitchell Coaching Group",
      initials: "SM",
      metric: "3x engagement in 60 days",
    },
  ]

  const pricingPlans = [
    {
      name: "14-Day Trial",
      price: "Free",
      period: "",
      description: "30 posts to see how it feels. No card required.",
      features: [
        "30 AI posts during trial",
        "Basic voice profile",
        "1 connected platform",
        "7-day analytics",
      ],
      cta: "Start your trial",
      popular: false,
      trialNote: true,
    },
    {
      name: "Strategy",
      price: "$49",
      period: "/month",
      description: "For coaches and consultants who publish consistently.",
      features: [
        "1,000 posts per month",
        "Deep voice profile — sounds exactly like you",
        "One idea into 7 formats",
        "Client ROI analytics",
        "Smart scheduling",
        "All platforms",
      ],
      cta: "Start Strategy",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "For agencies managing multiple client brands.",
      features: [
        "5,000 posts per month",
        "5 client workspaces",
        "White-label reports",
        "API access",
        "Priority support",
      ],
      cta: "Start Enterprise",
      popular: false,
    },
  ]

  const faqs = [
    {
      question: "Will it actually sound like me, or will it sound like everyone else?",
      answer: "During setup you paste a handful of your existing posts. Maxis learns your vocabulary, how you structure sentences, and the tone you default to. Most users say it nails their voice within the first session. You can always edit, and the more you use it, the sharper it gets.",
    },
    {
      question: "What happens after my 14-day trial?",
      answer: "Your account pauses — no charges, no surprise bills. You choose whether to upgrade. Your content and voice profile are saved for 30 days so nothing is lost.",
    },
    {
      question: "Will people know I used a tool?",
      answer: "Not unless you tell them. The whole point is that content sounds like you wrote it, not like a template. Generic tools hurt credibility. Content trained on your voice amplifies it.",
    },
    {
      question: "How is this different from ChatGPT?",
      answer: "ChatGPT produces generic output with no knowledge of your voice, no scheduling, and no analytics. Maxis is built end-to-end for personal brand publishing — voice training, multi-platform formatting, scheduling, and performance tracking in one place.",
    },
    {
      question: "What if I want to cancel?",
      answer: "Cancel anytime, one click, no friction. We email you before your trial ends so there are no surprises. Ever.",
    },
  ]

  const prevTestimonial = () =>
    setActiveTestimonial((p) => (p - 1 + testimonials.length) % testimonials.length)
  const nextTestimonial = () =>
    setActiveTestimonial((p) => (p + 1) % testimonials.length)

  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
      <Navbar />

      {/* HERO */}
      <section className="pt-28 pb-20 md:pt-40 md:pb-28 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Left: text */}
            <div>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-brand mb-6"
              >
                For coaches and consultants
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.08 }}
                className="font-display text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-7"
              >
                Attract clients.
                <br />
                Stop chasing
                <br />
                <span className="text-brand">them.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.18 }}
                className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mb-10"
              >
                Maxis turns your ideas into daily content that sounds exactly like you wrote it — so your audience finds you, trusts you, and hires you. Without you living on social media.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.28 }}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10"
              >
                <Button
                  onClick={handleCTA}
                  className="h-12 px-7 rounded-md bg-foreground text-background hover:bg-foreground/90 text-sm font-semibold transition-all duration-150"
                >
                  Start your 14-day trial
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <button
                  onClick={() =>
                    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/30 hover:decoration-foreground/50"
                >
                  See how it works
                </button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.42 }}
                className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground"
              >
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand" strokeWidth={2.5} />
                  14 days free
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand" strokeWidth={2.5} />
                  No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-brand" strokeWidth={2.5} />
                  Sounds like you, not a template
                </span>
              </motion.div>
            </div>

            {/* Right: product mockup */}
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Offset shadow */}
                <div className="absolute inset-0 translate-x-2 translate-y-2 bg-border rounded-xl" />
                {/* Card */}
                <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-lg">
                  {/* Window chrome */}
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-background">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                    <span className="ml-3 text-xs text-muted-foreground font-medium">Maxis Studio</span>
                  </div>

                  {/* Input area */}
                  <div className="p-5 border-b border-border/60 bg-background">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">What insight will you share today?</p>
                    <div className="text-sm text-foreground/80 leading-relaxed bg-secondary/40 border border-border rounded-md px-3 py-2.5 min-h-[56px]">
                      The best leaders I've coached don't have all the answers — they know how to ask better questions...
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-1.5">
                        {[
                          { Icon: FaLinkedinIn, cls: "text-[#0A66C2]" },
                          { Icon: FaXTwitter,   cls: "text-foreground" },
                          { Icon: FaInstagram,  cls: "text-[#E1306C]" },
                        ].map(({ Icon, cls }, i) => (
                          <div key={i} className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background">
                            <Icon className={`w-3 h-3 ${cls}`} />
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] px-3 py-1 bg-foreground text-background rounded font-semibold cursor-default">
                        Generate →
                      </div>
                    </div>
                  </div>

                  {/* Generated posts */}
                  <div className="divide-y divide-border/50">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FaLinkedinIn className="w-3 h-3 text-[#0A66C2]" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">LinkedIn Post</span>
                        <span className="ml-auto text-[10px] text-brand font-medium">✓ Voice matched</span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed line-clamp-3">
                        Here's what I learned after 10 years coaching executives: the best leaders don't have all the answers. They ask better questions. Here are three that changed everything for the teams I work with...
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FaXTwitter className="w-3 h-3 text-foreground" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">X Thread</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        10 years. 300+ coaching sessions. One pattern: the leaders everyone respects ask more than they tell. 🧵
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FaInstagram className="w-3 h-3 text-[#E1306C]" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Instagram Caption</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        Great leaders listen more than they speak. Here's the framework I teach every exec I work with...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* PLATFORMS - Infinite marquee */}
      <section className="py-10 border-y border-border/60 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Publishes to
          </p>
        </div>
        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <motion.div
            className="flex gap-4 w-max"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear", repeatType: "loop" }}
          >
            {[...platforms, ...platforms].map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 px-5 py-3 border border-border bg-card rounded text-sm font-medium text-foreground flex-shrink-0"
              >
                <p.Icon className={`w-4 h-4 ${p.className}`} />
                {p.name}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PROBLEMS */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand mb-4">
              Why experts stay invisible
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight max-w-2xl">
              Your next client is looking
              <br />
              for someone like you right now.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {problems.map((p) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-background p-8 md:p-10"
              >
                <p className="font-display text-5xl font-bold text-border mb-6 leading-none select-none">
                  {p.label}
                </p>
                <h3 className="font-semibold text-base mb-3 leading-snug">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 md:py-32 bg-secondary/40 border-y border-border/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand mb-4">
              How it works
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight max-w-xl">
              Everything in one place.
              <br />
              Nothing in the way.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className={`bg-card border border-border p-8 md:p-10 relative overflow-hidden group hover:border-brand/40 transition-colors duration-200 ${
                  i === 0 ? "md:col-span-2" : ""
                }`}
              >
                <div className="flex items-start gap-8">
                  <div className="flex-shrink-0">
                    <p className="font-display text-6xl font-bold text-border/60 leading-none select-none group-hover:text-brand/20 transition-colors duration-300">
                      {f.number}
                    </p>
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-lg mb-3">{f.title}</h3>
                    <p className="text-muted-foreground leading-relaxed max-w-xl">{f.body}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* VOICE COMPARISON */}
      <section className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-14">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand mb-4">
                The difference
              </p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4">
                Your clients trust your voice.
                <br />
                Not a template.
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl">
                Most tools produce the same output for everyone. Maxis is trained on your past content, so every post sounds like you — not like every other consultant on LinkedIn.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-border bg-card p-7">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Generic output
                  </span>
                </div>
                <p className="text-muted-foreground/80 italic leading-relaxed text-sm">
                  "In today's fast-paced business environment, it's crucial to leverage synergies and drive value-added outcomes through strategic initiatives that maximize stakeholder engagement..."
                </p>
                <p className="mt-4 text-xs text-muted-foreground/50">
                  Sounds like a template. Your audience scrolls past.
                </p>
              </div>

              <div className="border border-brand/30 bg-card p-7">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-2 h-2 rounded-full bg-brand" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                    Trained on your voice
                  </span>
                </div>
                <p className="text-foreground leading-relaxed text-sm">
                  "Here's what I learned after 10 years coaching executives: the best leaders don't have all the answers. They ask better questions. Here are three that changed everything for the teams I work with..."
                </p>
                <p className="mt-4 text-xs text-brand/70">
                  Sounds like you. Builds trust before the first conversation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-24 md:py-32 bg-foreground text-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/40 mb-10">
              Coaches and consultants who stopped chasing
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <blockquote className="font-display text-2xl sm:text-3xl md:text-4xl font-medium leading-[1.3] text-background mb-10">
                  "{testimonials[activeTestimonial].quote}"
                </blockquote>

                <div className="flex items-center justify-between gap-6 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-background/10 border border-background/20 flex items-center justify-center text-background font-bold text-sm flex-shrink-0">
                      {testimonials[activeTestimonial].initials}
                    </div>
                    <div>
                      <p className="font-semibold text-background text-sm">
                        {testimonials[activeTestimonial].name}
                      </p>
                      <p className="text-xs text-background/50">
                        {testimonials[activeTestimonial].role} · {testimonials[activeTestimonial].company}
                      </p>
                    </div>
                  </div>
                  <span className="px-4 py-2 border border-background/20 text-xs font-semibold text-background/80 tracking-wide">
                    {testimonials[activeTestimonial].metric}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-4 mt-12 pt-8 border-t border-background/10">
              <button
                onClick={prevTestimonial}
                className="w-9 h-9 border border-background/20 flex items-center justify-center text-background/60 hover:text-background hover:border-background/40 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`w-6 h-px transition-colors ${
                      i === activeTestimonial ? "bg-background" : "bg-background/20"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextTestimonial}
                className="w-9 h-9 border border-background/20 flex items-center justify-center text-background/60 hover:text-background hover:border-background/40 transition-colors"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand mb-4">
              Pricing
            </p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Try it free. Upgrade when
              <br />
              clients start coming in.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-border">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-background p-8 md:p-10 relative ${plan.popular ? "bg-card" : ""}`}
              >
                {plan.popular && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand mb-4">
                    Most popular
                  </p>
                )}
                <h3 className="font-display font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-6">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="font-display text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-brand flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={handleCTA}
                  className={`w-full h-11 rounded-md text-sm font-semibold ${
                    plan.popular
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-transparent border border-border text-foreground hover:bg-secondary"
                  }`}
                  variant="ghost"
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-6 text-center">
            All paid plans include a 14-day money-back guarantee. No contracts, no hidden fees.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32 border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-[1fr_2fr] gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand mb-4">
                FAQ
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
                Common
                <br />
                questions.
              </h2>
            </div>

            <div className="divide-y divide-border/60">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-start justify-between py-6 text-left gap-6 group"
                  >
                    <span className="font-medium text-sm md:text-base pr-4 group-hover:text-brand transition-colors">
                      {faq.question}
                    </span>
                    <span className="flex-shrink-0 mt-0.5">
                      {openFaq === i ? (
                        <Minus className="w-4 h-4 text-brand" />
                      ) : (
                        <Plus className="w-4 h-4 text-muted-foreground group-hover:text-brand transition-colors" />
                      )}
                    </span>
                  </button>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 text-sm md:text-base text-muted-foreground leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 md:py-32 bg-secondary/40 border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.08] mb-6">
              Your next client
              <br />
              is looking for you
              <br />
              <span className="text-brand">right now.</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-lg leading-relaxed">
              Start showing up consistently. Start getting found. Your 14-day trial is free — no card, no commitment.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button
                onClick={handleCTA}
                className="h-12 px-8 rounded-md bg-foreground text-background hover:bg-foreground/90 text-sm font-semibold"
              >
                Start attracting clients
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <p className="text-xs text-muted-foreground self-center">
                14 days free · No card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-border/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 overflow-hidden">
                <img src="/maxis.png" alt="Maxis" className="w-full h-full object-contain" />
              </div>
              <span className="font-display font-bold text-base">Maxis</span>
            </div>
            <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/support" className="hover:text-foreground transition-colors">Support</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2025 Maxis. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} />
    </div>
  )
}
