"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Zap,
  Edit3,
  Share2,
  Users,
  Mic,
  Star,
  Calendar,
  BarChart2,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import TestimonialCarousel from "@/components/TestimonialCarousel"
import { AuthModal } from "@/components/auth-modal"

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup")

  const { data: session } = useSession()
  const router = useRouter()

  const softBlue = "#4DA3FF"
  const warmGold = "#F5B96A"

  const fadeIn = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const pricing = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      bullets: [
        "Create LinkedIn posts with AI",
        "Basic viral formats",
        "1 platform connection",
        "Community support",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Creator",
      price: "$29",
      period: "/month",
      bullets: [
        "Unlimited LinkedIn post generation",
        "Advanced viral hooks & formats",
        "Tone matching (sound like you)",
        "Content optimized for reach & leads",
        "Draft & post management",
      ],
      cta: "Generate My First Post",
      popular: true,
    },
    {
      name: "Teams",
      price: "$99",
      period: "/month",
      bullets: [
        "Team & client workspaces",
        "Custom brand voice training",
        "Collaboration tools",
        "Priority support",
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ]

  const handlePrimaryAction = () => {
    if (session) router.push("/dashboard")
    else {
      setAuthMode("signup")
      setAuthOpen(true)
    }
  }

  return (
    <div className="bg-[#1a1a1a] text-white min-h-screen">
      <Navbar />

      {/* HERO */}
      <header className="pt-20 pb-14 px-6 lg:px-16">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div {...fadeIn}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Turn Ideas Into High-Engagement
              <span
                className="block mt-2"
                style={{
                  background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                LinkedIn Posts — In Minutes
              </span>
            </h1>

            <p className="text-gray-300 max-w-3xl mx-auto mb-6 text-lg">
              Write LinkedIn content that gets noticed, builds authority, and
              brings inbound opportunities — without spending hours writing.
            </p>

            <ul className="text-gray-300 max-w-3xl mx-auto mb-8 text-lg space-y-2">
              <li>✅ Go from rough idea → ready-to-post content</li>
              <li>✅ Use proven formats that trigger reach & engagement</li>
              <li>✅ Sound human — not generic AI</li>
              <li>✅ Stay consistent even on busy weeks</li>
              <li>✅ Automated Lead Generation</li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handlePrimaryAction}
                className="px-8 py-4 rounded-full font-semibold"
                style={{
                  background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
                  color: "#1a1a1a",
                }}
              >
                Generate My First Post Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Link href="#how-it-works">
                <Button
                  variant="ghost"
                  className="px-6 py-4 rounded-full border border-white/10"
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              No credit card • Takes under 60 seconds
            </p>
          </motion.div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 lg:px-16 py-14">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">
            From Idea to Published Post in 3 Steps
          </h2>
          <p className="text-gray-400">
            No prompt engineering. No learning curve.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: Zap,
              title: "Drop Your Idea",
              desc: "A thought, lesson, or experience — messy is fine.",
            },
            {
              icon: Edit3,
              title: "Choose a Proven Format",
              desc: "Educational, storytelling, authority, or viral hook.",
            },
            {
              icon: Share2,
              title: "Post & Grow",
              desc: "Publish instantly or save drafts for later.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6 }}
              className="p-6 rounded-2xl bg-[#282828] border border-white/5 text-center"
            >
              <div
                className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
                }}
              >
                <item.icon className="w-6 h-6 text-[#1a1a1a]" />
              </div>
              <h3 className="font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 lg:px-16 py-14">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">
            Built to Grow Your LinkedIn Presence
          </h2>
          <p className="text-gray-400">
            Not just writing — real visibility and engagement.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: Zap,
              title: "High-Engagement Post Generator",
              desc: "Posts optimized for likes, comments, and profile views.",
            },
            {
              icon: Star,
              title: "Viral Hook Engine",
              desc: "First lines engineered to stop the scroll in seconds.",
            },
            {
              icon: Mic,
              title: "Tone Matching",
              desc: "Bold, professional, casual — always sounds like you.",
            },
            {
              icon: Calendar,
              title: "Effortless Consistency",
              desc: "Never run out of content ideas again.",
            },
            {
              icon: BarChart2,
              title: "Growth Optimization",
              desc: "Designed for reach, engagement, and inbound leads.",
            },
            {
              icon: Users,
              title: "Lead-Driven Content",
              desc: "Turn visibility into conversations and opportunities.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6 }}
              className="p-6 rounded-2xl bg-[#282828] border border-white/5"
            >
              <f.icon className="w-6 h-6 mb-3 text-blue-500" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 lg:px-16 py-16">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Simple Pricing</h2>
          <p className="text-gray-400">
            Start free. Upgrade when LinkedIn starts working for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pricing.map((p, i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl bg-[#282828] border ${
                p.popular ? "border-blue-500/40" : "border-white/5"
              }`}
            >
              {p.popular && (
                <p className="text-xs text-blue-400 mb-2">Most Popular</p>
              )}
              <h3 className="text-xl font-semibold mb-2">{p.name}</h3>
              <div className="text-3xl font-bold mb-4">
                {p.price}
                <span className="text-sm text-gray-400">{p.period}</span>
              </div>

              <ul className="space-y-3 text-sm text-gray-300 mb-6">
                {p.bullets.map((b, idx) => (
                  <li key={idx} className="flex gap-2">
                    <Check className="w-4 h-4 text-blue-500" />
                    {b}
                  </li>
                ))}
              </ul>

              <Button
                onClick={handlePrimaryAction}
                className="w-full"
                style={{
                  background: p.popular
                    ? `linear-gradient(90deg, ${warmGold}, ${softBlue})`
                    : "transparent",
                  border: p.popular
                    ? "none"
                    : "1px solid rgba(255,255,255,0.1)",
                  color: p.popular ? "#1a1a1a" : "#ffffff",
                }}
              >
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-6 lg:px-16 py-14">
        <div className="max-w-4xl mx-auto text-center mb-6">
          <h2 className="text-3xl font-bold">Trusted by Growing Creators</h2>
          <p className="text-gray-400">
            Most users publish their first post in under 5 minutes.
          </p>
        </div>
        <TestimonialCarousel />
      </section>

      {/* FINAL CTA */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-4xl mx-auto p-10 rounded-3xl bg-[#282828] border border-white/5 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Your Next LinkedIn Post Is One Prompt Away
          </h2>
          <p className="text-gray-400 mb-6">
            Every day you don’t post, you lose visibility.
            LinkedPilot helps you show up consistently.
          </p>
          <Button
            onClick={handlePrimaryAction}
            className="px-10 py-4 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
              color: "#1a1a1a",
            }}
          >
            Create My First LinkedIn Post
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            No credit card • Just results
          </p>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} />
    </div>
  )
}
