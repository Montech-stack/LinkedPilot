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

  // Softer brand colors
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
        "1 platform connection",
        "AI content ideas",
        "Basic automation",
        "Community support",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      bullets: [
        "Multi-platform posting",
        "Advanced AI writing",
        "Automation workflows",
        "Analytics & drafts",
      ],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Agency",
      price: "$99",
      period: "/month",
      bullets: [
        "Team collaboration",
        "Brand voice training",
        "Client workspaces",
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
    <div className="bg-gradient-to-br from-[#0e0e11] via-[#0b0f16] to-[#0a1220] text-white min-h-screen">
      <Navbar />

      {/* HERO */}
      <header className="pt-20 pb-12 px-6 lg:px-16">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div {...fadeIn}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Create in seconds.
              <span
                className="block mt-2"
                style={{
                  background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Automate & Scale.
              </span>
            </h1>
            <p className="text-gray-300 max-w-3xl mx-auto mb-8 text-lg">
              CONAI is an AI-powered content creation and automation platform.
              Generate ideas, write high-performing content, and automate
              publishing across platforms — without burnout.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handlePrimaryAction}
                className="px-8 py-4 rounded-full font-semibold"
                style={{
                  background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
                  color: "#0b0f16",
                }}
              >
                {session ? "Go to Dashboard" : "Start Free"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>

              <Link href="#how-it-works">
                <Button
                  variant="ghost"
                  className="px-6 py-4 rounded-full border border-white/10"
                >
                  See how it works
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                Trusted by modern creators & teams
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-6 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">
            From idea to published — automatically
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            CONAI removes friction from content creation and distribution.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: Share2,
              title: "Connect platforms",
              desc: "Link LinkedIn, X, Instagram and more in one dashboard.",
            },
            {
              icon: Zap,
              title: "Create with AI",
              desc: "Generate hooks, posts, and variations aligned to each platform.",
            },
            {
              icon: Calendar,
              title: "Automate publishing",
              desc: "Schedule or auto-run workflows that post consistently.",
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6 }}
              className="p-6 rounded-2xl bg-[#0f1626] border border-white/5 text-center"
            >
              <div
                className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
                }}
              >
                <item.icon className="w-6 h-6 text-[#0b0f16]" />
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
            Built for serious content operators
          </h2>
          <p className="text-gray-400">
            Creation, automation, and insight — in one system.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { icon: Edit3, title: "AI Writing Engine", desc: "Hooks, threads, carousels, and captions." },
            { icon: BarChart2, title: "Performance Insights", desc: "Understand what content actually works." },
            { icon: Users, title: "Team Workflows", desc: "Collaborate, approve, and ship faster." },
            { icon: Mic, title: "Brand Voice Memory", desc: "Train AI on your tone and style." },
            { icon: Settings, title: "Automation Rules", desc: "Trigger posts based on time or logic." },
            { icon: Globe, title: "Multi-Platform Native", desc: "One idea, adapted everywhere." },
          ].map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6 }}
              className="p-6 rounded-2xl bg-[#0f1626] border border-white/5"
            >
              <f.icon className="w-6 h-6 mb-3 text-[var(--accent)]" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="px-6 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Simple pricing</h2>
          <p className="text-gray-400">Scale when it makes sense.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {pricing.map((p, i) => (
            <div
              key={i}
              className={`p-6 rounded-2xl bg-[#0f1626] border ${
                p.popular ? "border-yellow-400/40" : "border-white/5"
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
                    <Check className="w-4 h-4 text-yellow-400" />
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
          <h2 className="text-3xl font-bold">What users say</h2>
          <p className="text-gray-400">
            Teams replacing scattered tools with CONAI.
          </p>
        </div>
        <TestimonialCarousel />
      </section>

      {/* CTA */}
      <section className="px-6 lg:px-16 py-12">
        <div className="max-w-4xl mx-auto p-10 rounded-3xl bg-[#0f1626] border border-white/5 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Build content systems, not stress
          </h2>
          <p className="text-gray-400 mb-6">
            Let CONAI handle creation and automation while you focus on growth.
          </p>
          <Button
            onClick={handlePrimaryAction}
            className="px-10 py-4 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${warmGold}, ${softBlue})`,
              color: "#0b0f16",
            }}
          >
            Start Free
          </Button>
        </div>
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} />
    </div>
  )
}
