"use client"

import React, { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Zap,
  Edit3,
  Facebook,
  Instagram,
  Share2,
  Users,
  Globe,
  Mic,
  Settings,
  ChevronDown,
  Github,
  Twitter,
  Linkedin,
  Check,
  Star,
  Calendar,
  BarChart2,
  Layout,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import TestimonialCarousel from "@/components/TestimonialCarousel"
import { AuthModal } from "@/components/auth-modal"

export default function LandingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")

  const { data: session } = useSession()
  const router = useRouter()

  // Brand colors
  const softBlue = "#4DA3FF"
  const warmGold = "#F5B96A"

  const fadeIn = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const pricing = [
    {
      name: "Starter",
      price: "$0",
      period: "/month",
      bullets: [
        "Connect 1 platform",
        "AI-powered content ideas",
        "Basic automation tools",
        "Community support forum",
      ],
      cta: "Get Started Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      bullets: [
        "Unlimited platform connections",
        "Advanced AI content generation",
        "Full automation workflows",
        "In-depth analytics & draft management",
      ],
      cta: "Start 14-Day Free Trial",
      popular: true,
    },
    {
      name: "Agency",
      price: "$99",
      period: "/month",
      bullets: [
        "Team collaboration features",
        "Custom brand voice training",
        "Multi-client workspaces",
        "Priority 24/7 support",
      ],
      cta: "Contact Sales Team",
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
      <header className="pt-20 pb-12 px-6 lg:px-16">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div {...fadeIn}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Amplify Your Reach.
              <span
                className="block mt-2"
                style={{
                  background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Automate Success.
              </span>
            </h1>
            <p className="text-gray-300 max-w-3xl mx-auto mb-8 text-lg">
              LinkedPilot is your ultimate LinkedIn and social media growth engine. Effortlessly create captivating content, automate smart posting, and generate high-quality leads – all driven by cutting-edge AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handlePrimaryAction}
                className="px-8 py-4 rounded-full font-semibold"
                style={{
                  background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
                  color: "#1a1a1a",
                }}
              >
                {session ? "Enter Dashboard" : "Launch Your Free Trial"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Link href="#how-it-works">
                <Button
                  variant="ghost"
                  className="px-6 py-4 rounded-full border border-white/10"
                >
                  Explore Features
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                Empowering creators, marketers, and teams to thrive online
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">
            From Inspiration to Impact – Fully Automated
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            LinkedPilot transforms your social strategy, saving time while delivering measurable growth.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: Share2,
              title: "Unified Platform Connections",
              desc: "Seamlessly integrate LinkedIn, X, Instagram, and beyond in a single, powerful dashboard.",
            },
            {
              icon: Zap,
              title: "AI-Powered Content Magic",
              desc: "Craft irresistible hooks, posts, and formats optimized for each platform's unique audience.",
            },
            {
              icon: Calendar,
              title: "Intelligent Automation",
              desc: "Schedule strategically or let AI maintain consistent, high-engagement posting.",
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
      <section className="px-6 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">
            Engineered for Ambitious Growth
          </h2>
          <p className="text-gray-400">
            Essential tools to ideate, automate, and scale your online presence effortlessly.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { icon: Edit3, title: "Sophisticated AI Creation", desc: "Generate hooks, threads, carousels, and captions that captivate and convert." },
            { icon: BarChart2, title: "Data-Driven Insights", desc: "Analyze performance to refine and amplify what truly resonates." },
            { icon: Users, title: "Seamless Team Collaboration", desc: "Work together efficiently to brainstorm, review, and deploy content." },
            { icon: Mic, title: "Personalized Voice Adaptation", desc: "Train AI to match your brand's unique tone and personality." },
            { icon: Settings, title: "Custom Automation Flows", desc: "Build rules for intelligent, context-aware content distribution." },
            { icon: Globe, title: "Platform-Specific Optimization", desc: "Transform one core idea into tailored content for every channel." },
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
      <section id="pricing" className="px-6 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Transparent Pricing</h2>
          <p className="text-gray-400">Select the perfect plan to fuel your growth journey.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pricing.map((p, i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl bg-[#282828] border ${
                p.popular ? "border-blue-500/40" : "border-white/5"
              }`}
            >
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
                  border: p.popular ? "none" : "1px solid rgba(255,255,255,0.1)",
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
      <section className="px-6 lg:px-16 py-12">
        <div className="max-w-4xl mx-auto text-center mb-6">
          <h2 className="text-3xl font-bold">Success Stories From Users</h2>
          <p className="text-gray-400">
            Discover how LinkedPilot is revolutionizing social media management.
          </p>
        </div>
        <TestimonialCarousel />
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-12">
        <div className="max-w-4xl mx-auto p-10 rounded-3xl bg-[#282828] border border-white/5 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Elevate Your Social Strategy Today
          </h2>
          <p className="text-gray-400 mb-6">
            Join the ranks of successful professionals using LinkedPilot to craft irresistible content, automate intelligently, and attract premium leads – effortlessly.
          </p>
          <Button
            onClick={handlePrimaryAction}
            className="px-10 py-4 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
              color: "#1a1a1a",
            }}
          >
            Begin Your Journey Now
          </Button>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} />
    </div>
  )
}