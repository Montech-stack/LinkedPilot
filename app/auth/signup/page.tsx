"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { User, Mail, Lock, Linkedin, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { signIn } from "next-auth/react"

export default function SignUp() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Handle user registration here
      console.log("Sign up:", { username, email, password })
      // After successful registration, redirect to dashboard
    } catch (error) {
      console.error("Sign up error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkedInSignUp = () => {
    signIn("linkedin", { callbackUrl: "/dashboard" })
  }

  return (
    <div className="min-h-screen bg-[#1a1d29] flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 border border-[#0077B5] text-[#0077B5] rounded-full text-sm mb-4">
            Join LinkedPilot
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create Your Account</h1>
          <p className="text-gray-400">Start creating amazing LinkedIn content today</p>
        </div>

        {/* LinkedIn OAuth Button */}
        <Button onClick={handleLinkedInSignUp} className="w-full bg-[#0077B5] hover:bg-[#004182] text-white mb-6 h-12">
          <Linkedin className="w-5 h-5 mr-2" />
          Continue with LinkedIn
        </Button>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#374151]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-[#1a1d29] text-gray-400">or</span>
          </div>
        </div>

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#0077B5]" />
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10 bg-[#2d3748] border-[#374151] text-white placeholder-gray-400 focus:border-[#0077B5] focus:ring-[#0077B5]"
              required
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#0077B5]" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-[#2d3748] border-[#374151] text-white placeholder-gray-400 focus:border-[#0077B5] focus:ring-[#0077B5]"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#0077B5]" />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 bg-[#2d3748] border-[#374151] text-white placeholder-gray-400 focus:border-[#0077B5] focus:ring-[#0077B5]"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#0077B5] to-[#004182] hover:from-[#004182] hover:to-[#0077B5] text-white h-12"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-[#0077B5] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
