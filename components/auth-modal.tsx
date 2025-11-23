"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { useBillingStore } from "@/lib/billing-store"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FcGoogle } from "react-icons/fc"
import { toast } from "sonner"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode?: "login" | "signup"
}

export function AuthModal({
  open,
  onOpenChange,
  mode: initialMode = "login",
}: AuthModalProps) {
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "signup">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")

  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const { signup, login, googleLogin } = useAuthStore()
  const { tokensRemaining } = useBillingStore()

  useEffect(() => setMode(initialMode), [initialMode])

  const handleRedirectAfterAuth = () => {
    const hasTokens = tokensRemaining > 0 || tokensRemaining === -1
    router.push("/home")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === "signup") {
        await signup(email, password, name)
        toast.success("Account created")
      } else {
        await login(email, password)
        toast.success("Welcome back! 👋")
      }

      onOpenChange(false)
      setTimeout(() => handleRedirectAfterAuth(), 200)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed")
    }
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await googleLogin()
    } catch {
      setGoogleLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          sm:max-w-[450px]
          py-8 px-6 rounded-xl
          bg-black/90
          backdrop-blur-xl
          text-white
          border border-neutral-800
        "
      >
        <DialogHeader className="space-y-1 text-center mb-4">
          <DialogTitle className="text-xl font-semibold">
            {mode === "signup" ? "Create an Account" : "Welcome Back"}
          </DialogTitle>
          <DialogDescription className="text-sm text-neutral-400">
            {mode === "signup" ? "Sign up to get started" : "Sign in to continue"}
          </DialogDescription>
        </DialogHeader>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 h-11 bg-neutral-900 border-neutral-700 text-white"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          <FcGoogle className="h-5 w-5" />
          {googleLoading ? "Connecting..." : `Continue with Google`}
        </Button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-black px-2 text-xs text-neutral-500 uppercase tracking-wide">
              or
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">

          {mode === "signup" && (
            <Input
              placeholder="Full Name"
              value={name}
              className="h-11 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
              onChange={(e) => setName(e.target.value)}
              disabled={loading || googleLoading}
            />
          )}

          <Input
            type="email"
            placeholder="Email"
            className="h-11 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || googleLoading}
          />

          <Input
            type="password"
            placeholder="Password"
            className="h-11 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || googleLoading}
          />

          <Button
            type="submit"
            className="w-full h-11 text-[15px] bg-white text-black hover:bg-neutral-200"
            disabled={loading || googleLoading}
          >
            {loading ? "Loading..." : mode === "signup" ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm pt-4 text-neutral-400">
          {mode === "signup" ? (
            <>
              Already have an account?{" "}
              <button
                className="text-blue-400 hover:underline"
                onClick={() => setMode("login")}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button
                className="text-blue-400 hover:underline"
                onClick={() => setMode("signup")}
              >
                Create Account
              </button>
            </>
          )}
        </p>
      </DialogContent>
    </Dialog>
  )
}
