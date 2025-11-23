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
  Youtube,
  Share2,
  Users,
  Globe,
  Mic,
  Lightbulb,
  Settings,
  ChevronDown,
  Github,
  Twitter,
  Linkedin,
  Check,
  Sparkles,
  Star,
  Camera,
  Calendar,
  Clock,
  BarChart2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Navbar from "@/components/Navbar"
import TestimonialCarousel from "@/components/TestimonialCarousel"
import { AuthModal } from "@/components/auth-modal"

export default function LandingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "signup">("login")
  const [beforeAfter, setBeforeAfter] = useState<"before" | "after">("after")

  const { data: session } = useSession()
  const router = useRouter()

  // Brand colors
  const electricBlue = "#00A8FF"
  const orangeGold = "#FFB347"

  const fadeIn = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6 } }

  const pricing = [
    {
      name: "Starter",
      price: "$0",
      period: "/month",
      bullets: ["1 connected account", "20 scheduled posts / month", "AI post ideas", "Email support"],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      bullets: ["5 connected accounts", "Unlimited scheduling", "Viral post generator", "Analytics & drafts"],
      cta: "Start Free Trial",
      popular: true,
    },
    {
      name: "Agency",
      price: "$99",
      period: "/month",
      bullets: ["Team seats & permissions", "Brand voice training", "Priority support", "Custom integrations"],
      cta: "Contact Sales",
      popular: false,
    },
  ]

  const handleTryLinked = () => {
    if (session) {
      router.push("/dashboard")
    } else {
      setAuthMode("signup")
      setAuthOpen(true)
    }
  }

  const handleLogin = () => {
    if (session) {
      router.push("/dashboard")
    } else {
      setAuthMode("login")
      setAuthOpen(true)
    }
  }

  return (
    <div className="bg-gradient-to-br from-[#0f0f10] via-[#0b1220] to-[#0a1a2a] text-white min-h-screen">
      <Navbar />

      {/* Hero */}
      <header className="relative overflow-hidden pt-20 pb-12 px-6 sm:px-8 lg:px-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[#041022] via-transparent to-[#001428] opacity-60"></div>
          <div className="absolute -left-36 -top-40 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle at 30% 30%, ${electricBlue}22, transparent 25%)` }} />
          <div className="absolute -right-36 -bottom-40 w-96 h-96 rounded-full" style={{ background: `radial-gradient(circle at 70% 70%, ${orangeGold}22, transparent 25%)` }} />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-12">
          <motion.div className="w-full lg:w-6/12 relative z-10" {...fadeIn}>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Link. Create. Schedule.{" "}
              <span className="block sm:inline" style={{ background: `linear-gradient(90deg, ${electricBlue}, ${orangeGold})`, WebkitBackgroundClip: 'text', color: 'transparent' }}>
                Go Viral Everywhere
              </span>
            </h1>

            <p className="text-gray-300 max-w-2xl mb-6 text-lg">
              Linked is an AI-powered social media manager that writes platform-optimized posts, schedules them across all your networks, and automatically tunes for virality — so you stay consistent and grow your audience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:gap-6">
              <Button onClick={handleTryLinked} className="px-6 py-3 rounded-full text-base font-semibold shadow-2xl transform hover:scale-[1.03] transition-all" style={{ background: `linear-gradient(90deg, ${electricBlue}, ${orangeGold})`, color: '#071127' }}>
                Try Linked — Free Trial <ArrowRight className="ml-2 w-4 h-4" />
              </Button>

              <Link href="#how-it-works">
                <Button variant="ghost" className="px-5 py-3 rounded-full border border-white/10 text-white/90">
                  Learn how it works
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>Trusted by 2,500+ creators</span>
              </div>
              <div className="flex items-center gap-4">
                <Linkedin className="w-5 h-5 text-white/60 hover:text-white" />
                <Twitter className="w-5 h-5 text-white/60 hover:text-white" />
                <Globe className="w-5 h-5 text-white/60 hover:text-white" />
                <Facebook className="w-5 h-5 text-white/60 hover:text-white" />
                <Instagram className="w-5 h-5 text-white/60 hover:text-white" />
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* How it works */}
      <section id="how-it-works" className="px-6 sm:px-8 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <div className="inline-block px-3 py-1 rounded-full text-sm font-medium" style={{ background: `linear-gradient(90deg, ${electricBlue}22, ${orangeGold}22)` , color: electricBlue}}>
            How it works
          </div>
          <h2 className="text-3xl font-bold mt-4 mb-3">From idea to multi-platform post in 3 effortless steps</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">Connect any social account, generate platform-optimized variations, and schedule to post automatically at the best times for virality.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div className="p-6 rounded-2xl bg-[#071526] border border-[#11202a] text-center" whileHover={{ y: -8 }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(90deg, ${electricBlue}, ${orangeGold})` }}>
              <Share2 className="w-6 h-6 text-[#071127]" />
            </div>
            <h3 className="font-semibold mb-2">Connect Platforms</h3>
            <p className="text-gray-400">Link accounts across LinkedIn, X, Instagram, TikTok, Facebook and more — manage everything from one dashboard.</p>
          </motion.div>

          <motion.div className="p-6 rounded-2xl bg-[#071526] border border-[#11202a] text-center" whileHover={{ y: -8 }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(90deg, ${electricBlue}, ${orangeGold})` }}>
              <Zap className="w-6 h-6 text-[#071127]" />
            </div>
            <h3 className="font-semibold mb-2">Create Viral Posts</h3>
            <p className="text-gray-400">AI crafts engaging hooks, platform-tailored captions, and image suggestions proven to drive shares and comments.</p>
          </motion.div>

          <motion.div className="p-6 rounded-2xl bg-[#071526] border border-[#11202a] text-center" whileHover={{ y: -8 }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(90deg, ${electricBlue}, ${orangeGold})` }}>
              <Calendar className="w-6 h-6 text-[#071127]" />
            </div>
            <h3 className="font-semibold mb-2">Automate Scheduling</h3>
            <p className="text-gray-400">Pick the best windows or let Linked auto-schedule for optimal reach, repeatedly posting across platforms with one click.</p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 sm:px-8 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">All the tools you need to win attention</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">Viral post generation • Multi-account scheduling • Brand voice learning • Analytics that tell a story</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[{ icon: Zap, title: "Viral Post Generator", desc: "Smart hooks, captions, and variants tailored per platform." },
            { icon: BarChart2, title: "Smart Analytics", desc: "Engagement predictions, best time suggestions, and growth KPIs." },
            { icon: Users, title: "Multi-Account Sync", desc: "Manage teams, permissions and multiple brand accounts." },
            { icon: Mic, title: "Brand Voice Training", desc: "Upload sample posts and the AI will learn your tone and cadence." },
            { icon: Edit3, title: "One-click Variants", desc: "Generate caption/image variations that match each platform’s style." },
            { icon: Settings, title: "Integrations & API", desc: "Connect analytics, CRMs and custom workflows with our API." }
          ].map((f, i) => (
            <motion.div key={i} className="p-6 rounded-2xl bg-[#071526] border border-[#11202a] shadow-lg" whileHover={{ y: -6 }}>
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style={{ background: `linear-gradient(90deg, ${electricBlue}, ${orangeGold})` }}>
                <f.icon className="w-5 h-5 text-[#071127]" />
              </div>
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 sm:px-8 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold mb-2">Pricing built for creators & teams</h2>
          <p className="text-gray-300">Start free — scale when you grow. Annual discounts and agency plans available.</p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricing.map((p, i) => (
            <motion.div key={i} className={`p-6 rounded-2xl border ${p.popular ? "ring-2 ring-[#00A8FF] scale-105" : "border-[#11202a]"} bg-[#071526]`} whileHover={{ y: -6 }}>
              {p.popular && <div className="mb-3 text-sm font-medium" style={{ color: orangeGold }}>Most popular</div>}
              <h3 className="text-xl font-semibold mb-2">{p.name}</h3>
              <div className="flex items-end gap-2 mb-4">
                <div className="text-3xl font-bold">{p.price}</div>
                <div className="text-sm text-gray-400">{p.period}</div>
              </div>
              <ul className="mb-6 space-y-2 text-gray-300 text-sm">
                {p.bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#00A8FF] to-[#FFB347] flex items-center justify-center">
                      <Check className="w-3 h-3 text-[#071127]" />
                    </div>
                    <div>{b}</div>
                  </li>
                ))}
              </ul>
              <Button onClick={handleTryLinked} className={`w-full py-3 rounded-full`} style={{ background: p.popular ? `linear-gradient(90deg, ${electricBlue}, ${orangeGold})` : 'transparent', color: p.popular ? '#071127' : 'white', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>{p.cta}</Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 sm:px-8 lg:px-16 py-12">
        <div className="max-w-6xl mx-auto text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Loved by creators</h2>
          <p className="text-gray-300">Real growth stories from users who scaled with Linked.</p>
        </div>
        <div className="max-w-4xl mx-auto">
          <TestimonialCarousel />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 sm:px-8 lg:px-16 py-12">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h2 className="text-3xl font-bold">Frequently asked</h2>
          <p className="text-gray-300">Everything you need to know about platform support, billing and data.</p>
        </div>
        <div className="max-w-4xl mx-auto space-y-4">
          {[{ q: "Which platforms can I connect?", a: "Linked supports LinkedIn, X, Instagram, TikTok, Facebook, and any platform with posting APIs. We regularly add more integrations." },
            { q: "Can it post automatically at best times?", a: "Yes — Linked can auto-schedule at predicted high-engagement windows or use your custom schedule." },
            { q: "Is my content private?", a: "Absolutely. We use encrypted storage for credentials and give you full control of access and exportable data." }
          ].map((f, i) => (
            <motion.div key={i} className="p-4 rounded-xl bg-[#071526] border border-[#11202a]" whileHover={{ y: -4 }}>
              <button className="w-full text-left flex items-center justify-between" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                <div className="font-semibold">{f.q}</div>
                <ChevronDown className={`w-6 h-6 text-[#00A8FF] ${expandedFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {expandedFaq === i && <motion.p className="mt-3 text-gray-300" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{f.a}</motion.p>}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 sm:px-8 lg:px-16 py-12">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#06101a] to-[#08182a] p-8 rounded-3xl text-center border border-[#11202a] shadow-2xl">
          <Image src="/Linked Logo.png" alt="Linked logo" width={64} height={64} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Your brand, amplified across every platform</h2>
          <p className="text-gray-300 mb-6">Start creating viral posts and schedule with confidence. Let Linked handle the posting so you can focus on impact.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleTryLinked}
                className="px-6 py-3 rounded-full"
                style={{ background: `linear-gradient(90deg, ${electricBlue}, ${orangeGold})`, color: '#071127' }}
              >
                Start Free Trial
              </Button>
              <Link href="#pricing">
                <Button
                  variant="ghost"
                  className="px-6 py-3 rounded-full border border-white/10 text-white/90"
                >
                  View Pricing
                </Button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {authOpen && (
        <AuthModal
          open={authOpen}
          mode={authMode}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            setAuthOpen(false)
            router.push("/dashboard") // redirect after successful sign in/up
          }}
        />
      )}

      {/* Footer */}
      <footer className="px-6 sm:px-8 lg:px-16 py-8 border-t border-[#0f1720]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div>
              <Image
                src="/Linked Logo.png"
                alt="Linked logo"
                width={80}
                height={80}
                className="mx-auto"
              />

              <div className="text-xs text-gray-400">Link. Create. Schedule - Go Viral Everywhere</div>
            </div>
          </div>

          <div className="text-sm text-gray-400">© {new Date().getFullYear()} Linked. All rights reserved.</div>

          <div className="flex items-center gap-4">
            <Linkedin className="w-5 h-5 text-white/60 hover:text-white" />
            <Twitter className="w-5 h-5 text-white/60 hover:text-white" />
            <Github className="w-5 h-5 text-white/60 hover:text-white" />
          </div>
        </div>
      </footer>
    </div>
  )
}

