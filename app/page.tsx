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
  Globe, // Added for "all platforms" feel
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
        "Create social posts with AI",
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
        "Unlimited cross-platform generation",
        "Multi-platform optimization",
        "Tone matching (sound like you)",
        "Advanced viral hooks & formats",
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
        "Unified social analytics",
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
                Content 
              </span>
            </h1>

            <p className="text-gray-300 max-w-3xl mx-auto mb-6 text-lg">
              Write content that gets noticed, builds authority, and
              scales your presence across all socials — without spending hours writing.
            </p>

            <ul className="text-gray-300 max-w-3xl mx-auto mb-8 text-lg space-y-2">
              <li>✅ From rough idea → platform-optimized content</li>
              <li>✅ Reach your audience on LinkedIn, X, and more</li>
              <li>✅ Sound human — never generic AI</li>
              <li>✅ Stay consistent across all your channels</li>
              <li>✅ Automated growth & lead generation</li>
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
                Access Maxis Studio
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
            From Idea to Global Post in 3 Steps
          </h2>
          <p className="text-gray-400">
            One workflow for all your social channels.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: Zap,
              title: "Drop Your Idea",
              desc: "A thought, lesson, or experience — Maxis handles the rest.",
            },
            {
              icon: Globe,
              title: "Select Your Platforms",
              desc: "Tailor the same idea for LinkedIn, X, or Instagram instantly.",
            },
            {
              icon: Share2,
              title: "Post & Grow",
              desc: "Publish across your network or save for later.",
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
            Built to Scale Your Digital Brand
          </h2>
          <p className="text-gray-400">
            Multi-platform intelligence. Real visibility.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: Zap,
              title: "Omni-Channel Generator",
              desc: "Posts optimized for the specific algorithms of each platform.",
            },
            {
              icon: Star,
              title: "The Hook Lab",
              desc: "First lines engineered to stop the scroll on any device.",
            },
            {
              icon: Mic,
              title: "Universal Tone Matching",
              desc: "Your unique voice, adapted for professional or casual sites.",
            },
            {
              icon: Calendar,
              title: "Global Content Calendar",
              desc: "Plan and visualize your entire social strategy in one place.",
            },
            {
              icon: BarChart2,
              title: "Cross-Platform Insights",
              desc: "Understand what works best for your specific audience.",
            },
            {
              icon: Users,
              title: "Lead-Gen Focused",
              desc: "Turn social impressions into actual business opportunities.",
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
            Start free. Upgrade as your reach expands.
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
          <h2 className="text-3xl font-bold">Trusted by Global Creators</h2>
          <p className="text-gray-400">
            Join thousands of users scaling their brand with Maxis.
          </p>
        </div>
        <TestimonialCarousel />
      </section>

      {/* FINAL CTA */}
      <section className="px-6 lg:px-16 py-16">
        <div className="max-w-4xl mx-auto p-10 rounded-3xl bg-[#282828] border border-white/5 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Your Viral Strategy Starts Here
          </h2>
          <p className="text-gray-400 mb-6">
            Stop guessing what works. Use Maxis to dominate your niche across every platform.
          </p>
          <Button
            onClick={handlePrimaryAction}
            className="px-10 py-4 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
              color: "#1a1a1a",
            }}
          >
            Start Creating with Maxis
          </Button>
          <p className="text-xs text-gray-500 mt-4">
            No credit card • Unlimited possibilities
          </p>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} />
    </div>
  )
}