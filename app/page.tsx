"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Star, Shield, Zap, Globe, MessageCircle, BarChart3, ChevronRight, Linkedin, Twitter, Instagram } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { AuthModal } from "@/components/auth-modal";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  const openAuth = (mode: "login" | "signup" = "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 inset-x-0 h-[800px] pointer-events-none overflow-hidden -z-10">
          <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-secondary/50 border border-border backdrop-blur-md cursor-pointer hover:bg-secondary/70 transition-colors" onClick={() => openAuth('signup')}>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold tracking-wide uppercase text-secondary-foreground">V 2.0 Now Live</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.1] mb-8 bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/80 to-foreground/50">
              The AI Co-Pilot for <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-violet-500">Social Growth.</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
              Maxis is the all-in-one studio to generate viral hooks, clone your voice, schedule content, and run 24/7 engagement campaigns on LinkedIn, X, and Instagram.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => {
                  if (session) {
                    router.push("/dashboard");
                  } else {
                    openAuth("signup");
                  }
                }}
                size="lg"
                className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 bg-primary text-primary-foreground"
              >
                Start Creating
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Replaced Image Logs with Text/Icons for "Professional Product" look without external assets */}
              <div className="flex gap-8 text-sm font-bold text-muted-foreground uppercase tracking-widest">
                <span>Trusted by creators worldwide</span>
                <span className="flex items-center gap-2"><Linkedin className="w-4 h-4" /> LinkedIn</span>
                <span className="flex items-center gap-2"><Twitter className="w-4 h-4" /> X (Twitter)</span>
                <span className="flex items-center gap-2"><Instagram className="w-4 h-4" /> Instagram</span>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* --- BENTO FEATURE GRID --- */}
      <section className="py-24 bg-secondary/20 border-y border-border/50">
        <div className="container mx-auto px-6">
          <div className="mb-16 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Designed for Focus. <br />Built for Speed.</h2>
            <p className="text-lg text-muted-foreground">We stripped away the clutter to give you a pure creation environment. Every pixel serves a purpose.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 h-auto md:h-[600px]">

            {/* Large Left Block */}
            <motion.div
              whileHover={{ y: -5 }}
              className="col-span-1 md:col-span-6 lg:col-span-7 bg-card rounded-3xl p-8 border border-border shadow-sm flex flex-col justify-between overflow-hidden relative group"
            >
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-blue-500">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Instant Viral Hooks</h3>
                <p className="text-muted-foreground">Our AI analyzes millions of top-performing posts to generate hooks that physically stop the scroll.</p>
              </div>
              {/* Abstract UI representation */}
              <div className="mt-8 space-y-3 opacity-50 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-4 group-hover:translate-y-0">
                <div className="h-4 w-3/4 bg-primary/10 rounded-full animate-pulse" />
                <div className="h-4 w-1/2 bg-primary/10 rounded-full animate-pulse delay-75" />
                <div className="h-4 w-5/6 bg-primary/10 rounded-full animate-pulse delay-150" />
              </div>
            </motion.div>

            {/* Right Top Block */}
            <motion.div
              whileHover={{ y: -5 }}
              className="col-span-1 md:col-span-6 lg:col-span-5 bg-card rounded-3xl p-8 border border-border shadow-sm relative overflow-hidden group"
            >
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 text-purple-500">
                <MessageCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Voice Cloning</h3>
              <p className="text-muted-foreground">Upload your past content. Maxis learns your syntax, tone, and vocabulary to write exactly like you.</p>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full group-hover:bg-purple-500/30 transition-all" />
            </motion.div>

            {/* Bottom Left Block */}
            <motion.div
              whileHover={{ y: -5 }}
              className="col-span-1 md:col-span-3 lg:col-span-4 bg-card rounded-3xl p-8 border border-border shadow-sm"
            >
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mb-4 text-green-500">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold mb-2">Deep Analytics</h3>
              <p className="text-sm text-muted-foreground">Track growth across all platforms in one dashboard.</p>
            </motion.div>

            {/* Bottom Middle Block */}
            <motion.div
              whileHover={{ y: -5 }}
              className="col-span-1 md:col-span-3 lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 shadow-2xl text-white flex flex-col justify-center text-center items-center"
            >
              <h3 className="text-3xl font-bold mb-2">5+</h3>
              <p className="text-blue-100 font-medium">Platforms Connected</p>
              <p className="text-xs text-blue-200 mt-2 opacity-80">LinkedIn, X, IG & More</p>
            </motion.div>

            {/* Bottom Right Block */}
            <motion.div
              whileHover={{ y: -5 }}
              className="col-span-1 md:col-span-6 lg:col-span-4 bg-card rounded-3xl p-8 border border-border shadow-sm"
            >
              <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4 text-orange-500">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-xl font-bold mb-2">Enterprise Ready</h3>
              <p className="text-sm text-muted-foreground">SSO, Team Seats, and Priority Support included.</p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to define your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">digital legacy?</span></h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">Join 10,000+ creators using Maxis to build their personal monopoly.</p>
          <Button
            onClick={() => openAuth('signup')}
            size="lg"
            className="h-16 px-12 text-xl font-bold rounded-full shadow-2xl hover:scale-105 transition-transform"
          >
            Get Started Now
          </Button>
          <p className="mt-6 text-sm text-muted-foreground">No credit card required for free tier.</p>
        </div>
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10" />
      </section>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} mode={authMode} />
    </div>
  );
}