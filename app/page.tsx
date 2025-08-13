"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ArrowRight,
  Zap,
  Edit3,
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import TestimonialCarousel from "@/components/TestimonialCarousel"
import Navbar from "@/components/Navbar"

export default function LandingPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(2)
  const [beforeAfter, setBeforeAfter] = useState<"before" | "after">("after")

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "Perfect for getting started",
      features: ["5 posts per month", "Basic AI generation", "3 tone options", "Standard support"],
      buttonText: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      description: "For serious content creators",
      features: [
        "Unlimited posts",
        "Advanced AI generation",
        "All tone options",
        "Priority support",
        "Analytics dashboard",
        "Content scheduling",
        "Custom templates",
      ],
      buttonText: "Start Free Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$49",
      period: "/month",
      description: "For teams and agencies",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Brand voice training",
        "API access",
        "Dedicated support",
        "Custom integrations",
      ],
      buttonText: "Contact Sales",
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen gradient-bg text-white overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <motion.section
        className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20 pt-20 sm:pt-24 text-center relative"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        id="hero"
      >
        {/* Background gradient mesh */}
        <div className="absolute inset-0 gradient-mesh opacity-30"></div>

        <motion.div
          className="inline-block px-3 sm:px-4 py-2 border border-[#0077B5] text-[#0077B5] rounded-full text-xs sm:text-sm mb-4 sm:mb-6 shadow-lg backdrop-blur-sm bg-white/5 relative z-10"
          variants={fadeInUp}
        >
          ✨ Trusted By 1,000+ Users
        </motion.div>

        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight relative z-10 px-2"
          variants={fadeInUp}
        >
          Create Professional <span className="gradient-text-alt animate-float block sm:inline">LinkedIn Content</span>{" "}
          in Minutes
        </motion.h1>

        <motion.p
          className="text-gray-300 text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed relative z-10 px-4"
          variants={fadeInUp}
        >
          Transform your LinkedIn presence with AI-generated posts that capture your unique voice. Stand out from the
          crowd with content that drives engagement and grows your network.
        </motion.p>

        <motion.div variants={fadeInUp} className="relative z-10 px-4">
          <Link href="/dashboard">
            <Button className="bg-gradient-to-r from-[#0077B5] via-[#00A0DC] to-[#66D9EF] hover:from-[#004182] hover:via-[#0077B5] hover:to-[#00A0DC] text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-110 glow-button animate-float w-full sm:w-auto">
              Generate Your Post <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </motion.div>

        {/* Floating elements - hidden on mobile for performance */}
        <motion.div
          className="absolute top-20 left-10 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-full opacity-20 blur-xl hidden sm:block"
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-r from-[#66D9EF] to-[#0077B5] rounded-full opacity-10 blur-2xl hidden sm:block"
          animate={{ y: [0, 30, 0], rotate: [360, 180, 0] }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY }}
        />
      </motion.section>

      {/* Before/After Section */}
      <motion.section
        className="px-4 sm:px-6 lg:px-8 py-16 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        id="before-after"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0077B5]/5 via-transparent to-[#00A0DC]/5"></div>

        <div className="text-center mb-12 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold mb-8 gradient-text-alt">Personalized AI Writing</h2>

          <div className="inline-flex gradient-card rounded-full p-1 mb-8 border border-[#2d3748] shadow-xl">
            <button
              className={`px-6 py-3 rounded-full transition-all duration-300 ${beforeAfter === "before" ? "bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg transform scale-105" : "text-gray-400 hover:text-white"}`}
              onClick={() => setBeforeAfter("before")}
            >
              Before
            </button>
            <button
              className={`px-6 py-3 rounded-full transition-all duration-300 ${beforeAfter === "after" ? "bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg transform scale-105" : "text-gray-400 hover:text-white"}`}
              onClick={() => setBeforeAfter("after")}
            >
              After
            </button>
          </div>
        </div>

        <div className="max-w-md mx-auto relative z-10">
          <motion.div
            className="bg-white text-black rounded-2xl overflow-hidden border-4 border-gradient-to-r from-green-400 to-emerald-500 shadow-2xl glow-card"
            key={beforeAfter}
            initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* LinkedIn Post Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  FM
                </div>
                <div>
                  <div className="font-semibold">Farirai Masocha</div>
                  <div className="text-gray-500 text-sm">Software Engineer • 1st</div>
                  <div className="text-gray-400 text-xs">2h • 🌍</div>
                </div>
              </div>
            </div>

            {/* Post Content */}
            <div className="p-4">
              {beforeAfter === "before" ? (
                <p className="text-gray-700 mb-4">
                  Just finished working on a new project. It was challenging but rewarding. Looking forward to sharing
                  more updates soon.
                </p>
              ) : (
                <p className="text-gray-700 mb-4">
                  🚀 Just shipped a game-changing feature that reduces load times by 60%! The journey wasn't easy - 3
                  weeks of debugging, countless coffee cups, and moments of doubt. But here's what I learned: Every
                  "impossible" problem has a solution waiting to be discovered. What's the most challenging technical
                  problem you've solved recently? 👇
                </p>
              )}

              {/* Mock Image */}
              <div className="bg-gradient-to-br from-blue-500 via-purple-600 via-pink-500 to-blue-500 rounded-xl h-48 flex items-center justify-center mb-4 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                <div className="text-white text-center relative z-10">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="font-semibold text-lg">Performance Dashboard</div>
                  <div className="text-sm opacity-90">60% Load Time Improvement</div>
                </div>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between text-gray-500 text-sm border-t pt-3 bg-gradient-to-r from-gray-50 to-white">
                <span className="flex items-center gap-1">
                  👍 <span className="font-semibold">{beforeAfter === "before" ? "12" : "87"}</span> reactions
                </span>
                <span className="flex items-center gap-1">
                  💬 <span className="font-semibold">{beforeAfter === "before" ? "3" : "31"}</span> comments
                </span>
                <span className="flex items-center gap-1">
                  🔄 <span className="font-semibold">{beforeAfter === "before" ? "1" : "12"}</span> reposts
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section
        className="px-4 sm:px-6 lg:px-8 py-16 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        id="how-it-works"
      >
        <div className="absolute inset-0 gradient-bg-alt opacity-50"></div>

        <div className="text-center mb-12 relative z-10">
          <div className="inline-block px-4 py-2 border border-[#0077B5] text-[#0077B5] rounded-full text-sm mb-4 shadow-lg backdrop-blur-sm bg-white/5">
            ⚡ How It Works
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 gradient-text-alt">
            From idea to LinkedIn-ready post in seconds
          </h2>
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Share2,
                title: "Share Your Idea",
                desc: "Tell us what you want to post about",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: Zap,
                title: "Generate Content",
                desc: "AI creates engaging posts in your voice",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Edit3,
                title: "Edit & Post",
                desc: "Customize and share to LinkedIn",
                color: "from-green-500 to-emerald-500",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                className="text-center relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ scale: 1.05, y: -10 }}
              >
                <div
                  className={`w-20 h-20 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-2xl group-hover:shadow-3xl transition-all duration-300`}
                >
                  {index + 1}
                </div>
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <step.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">{step.title}</h3>
                <p className="text-gray-300">{step.desc}</p>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 border-t-2 border-dashed border-[#0077B5] opacity-30"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        className="px-4 sm:px-6 lg:px-8 py-16 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        id="features"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 gradient-text-alt">
            Your go-to tool for crafting impactful LinkedIn posts using AI
          </h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">
            Designed to stop the scroll. Every output is structured to spark comments, shares, and conversation—boosting
            your reach and influence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto px-4">
          {[
            {
              icon: Zap,
              title: "AI Post Generator",
              desc: "Generate posts instantly",
              color: "from-yellow-400 to-orange-500",
            },
            {
              icon: Users,
              title: "Create Engaging Contents",
              desc: "Content that converts",
              color: "from-blue-400 to-purple-500",
            },
            {
              icon: Globe,
              title: "Network Expansion",
              desc: "Grow your connections",
              color: "from-green-400 to-teal-500",
            },
            {
              icon: Mic,
              title: "Craft a Unique Voice",
              desc: "Maintain your style",
              color: "from-pink-400 to-red-500",
            },
            {
              icon: Lightbulb,
              title: "Topic Idea Generation",
              desc: "Never run out of ideas",
              color: "from-indigo-400 to-blue-500",
            },
            {
              icon: Settings,
              title: "Customizable Formats",
              desc: "Multiple post styles",
              color: "from-purple-400 to-pink-500",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="gradient-card p-4 sm:p-6 rounded-xl sm:rounded-2xl hover:bg-gradient-to-br hover:from-[#1a1d29] hover:to-[#252938] transition-all duration-500 border border-[#2d3748] shadow-xl hover:shadow-2xl group glow-card"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
            >
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${feature.color} rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform shadow-lg`}
              >
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2 text-white text-base sm:text-lg">{feature.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Pricing Section */}
      <motion.section
        className="px-4 sm:px-6 lg:px-8 py-16 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        id="pricing"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0077B5]/5 via-transparent to-[#00A0DC]/5"></div>

        <div className="text-center mb-12 relative z-10">
          <div className="inline-block px-4 py-2 border border-[#0077B5] text-[#0077B5] rounded-full text-sm mb-4 shadow-lg backdrop-blur-sm bg-white/5">
            💎 Pricing
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 gradient-text-alt">
            Choose the perfect plan for your needs
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Start free and upgrade as you grow. All plans include our core AI features.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              className={`relative gradient-card rounded-2xl p-8 border shadow-2xl hover:shadow-3xl transition-all duration-500 group ${
                plan.popular
                  ? "border-[#0077B5] ring-2 ring-[#0077B5] ring-opacity-30 scale-105 lg:scale-110"
                  : "border-[#2d3748]"
              }`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: plan.popular ? 1.1 : 1.05, y: -10 }}
            >
              {plan.popular && (
                <>
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#0077B5] via-[#00A0DC] to-[#66D9EF] text-white px-6 py-2 rounded-full text-sm font-medium shadow-xl animate-pulse">
                      ⭐ Most Popular
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0077B5]/10 via-[#00A0DC]/10 to-[#66D9EF]/10 rounded-2xl"></div>
                </>
              )}

              <div className="text-center mb-8 relative z-10">
                <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                <p className="text-gray-300 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-5xl font-bold gradient-text-alt">{plan.price}</span>
                  <span className="text-gray-400 ml-1 text-lg">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 relative z-10">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full transition-all duration-500 relative z-10 ${
                  plan.popular
                    ? "bg-gradient-to-r from-[#0077B5] via-[#00A0DC] to-[#66D9EF] hover:from-[#004182] hover:via-[#0077B5] hover:to-[#00A0DC] text-white shadow-2xl glow-button transform hover:scale-105"
                    : "bg-gradient-to-r from-[#2d3748] to-[#374151] hover:from-[#374151] hover:to-[#4a5568] text-white border border-[#374151] hover:border-[#0077B5]"
                }`}
              >
                {plan.buttonText}
                {plan.popular && <Sparkles className="w-4 h-4 ml-2" />}
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Testimonials */}
      <motion.section
        className="px-4 sm:px-6 lg:px-8 py-16 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        id="testimonials"
      >
        <div className="absolute inset-0 gradient-bg-alt opacity-30"></div>

        <div className="text-center mb-12 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 gradient-text-alt">What Our Users Say</h2>
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">
            Hear from professionals who have transformed their LinkedIn presence with LinkedPilot's AI-powered content
            creation
          </p>
        </div>

        <div className="relative z-10">
          <TestimonialCarousel />
        </div>
      </motion.section>

      {/* FAQ */}
      <motion.section
        className="px-4 sm:px-6 lg:px-8 py-16 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        id="faq"
      >
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 border border-[#0077B5] text-[#0077B5] rounded-full text-sm mb-4 shadow-lg backdrop-blur-sm bg-white/5">
            ❓ Frequently Asked Questions
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 gradient-text-alt">Got questions? We've got answers</h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Curious about how LinkedPilot works or what makes it different? These quick answers cover the essentials.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {[
            {
              question: "Will the content sound like me?",
              answer:
                "Yes! Our AI learns your writing style and tone to create authentic content that matches your voice.",
            },
            {
              question: "What if I don't know what to post?",
              answer:
                "LinkedPilot includes topic suggestion features to help you discover trending topics in your industry.",
            },
            {
              question: "Is LinkedPilot only for content creators?",
              answer:
                "Not at all! LinkedPilot is perfect for professionals, entrepreneurs, job seekers, and anyone looking to build their LinkedIn presence. Whether you're sharing industry insights, career updates, or thought leadership content, our AI adapts to your goals and audience.",
            },
          ].map((faq, index) => (
            <motion.div
              key={index}
              className="gradient-card rounded-2xl overflow-hidden border border-[#2d3748] shadow-xl hover:shadow-2xl transition-all duration-500 glow-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <button
                className="w-full p-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors group"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <span className="font-semibold text-white text-lg pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-6 h-6 text-[#0077B5] transition-all duration-300 group-hover:scale-110 ${expandedFaq === index ? "rotate-180" : ""}`}
                />
              </button>
              {expandedFaq === index && (
                <motion.div
                  className="px-6 pb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Final CTA */}
      <motion.section
        className="px-4 sm:px-6 lg:px-8 py-16 relative"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative overflow-hidden rounded-3xl shadow-2xl"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          >
            {/* Animated background */}
            <div className="absolute inset-0 gradient-cta"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>

            {/* Floating elements */}
            <div className="absolute top-4 left-4 w-16 h-16 bg-white/10 rounded-full blur-xl animate-float"></div>
            <div
              className="absolute bottom-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-2xl animate-float"
              style={{ animationDelay: "1s" }}
            ></div>
            <div
              className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/15 rounded-full blur-lg animate-float"
              style={{ animationDelay: "2s" }}
            ></div>

            <div className="relative z-10 p-8 sm:p-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-block mb-6"
              >
                <Star className="w-16 h-16 text-white mx-auto animate-spin" style={{ animationDuration: "8s" }} />
              </motion.div>

              <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-white">Your voice. AI speed.</h2>
              <p className="text-white/90 mb-8 leading-relaxed text-lg max-w-2xl mx-auto">
                Create content that sounds like you—faster, smarter, and ready to engage your audience every time.
              </p>

              <Link href="/dashboard">
                <Button className="bg-white text-[#0077B5] hover:bg-gray-100 px-8 py-4 text-lg rounded-full font-semibold mb-6 transform hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-3xl">
                  Generate Your First Post
                  <Sparkles className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              <div className="flex justify-center gap-6">
                <motion.div whileHover={{ scale: 1.2, rotate: 360 }} transition={{ duration: 0.3 }}>
                  <Linkedin className="w-8 h-8 text-white/70 hover:text-white cursor-pointer transition-colors" />
                </motion.div>
                <motion.div whileHover={{ scale: 1.2, rotate: -360 }} transition={{ duration: 0.3 }}>
                  <Github className="w-8 h-8 text-white/70 hover:text-white cursor-pointer transition-colors" />
                </motion.div>
                <motion.div whileHover={{ scale: 1.2, rotate: 360 }} transition={{ duration: 0.3 }}>
                  <Twitter className="w-8 h-8 text-white/70 hover:text-white cursor-pointer transition-colors" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 lg:px-8 py-8 border-t border-[#1a1d29] gradient-card">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-lg">
              LP
            </div>
            <span className="font-semibold gradient-text">LinkedPilot</span>
          </div>
          <p className="text-gray-400 text-sm mb-4 max-w-md">
            Transform your LinkedIn presence with AI-generated posts that capture your unique voice. Stand out from the
            crowd with content that drives engagement and grows your network.
          </p>
          <div className="text-xs text-gray-500">© 2025 LinkedPilot. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}
