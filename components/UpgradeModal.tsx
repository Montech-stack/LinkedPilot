"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useBillingStore, PLAN_IDS } from "@/lib/billing-store"

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason: "tokens" | "trial"
}

export function UpgradeModal({ open, onClose, reason }: UpgradeModalProps) {
  const router = useRouter()
  const { daysLeftInTrial } = useBillingStore()
  const daysLeft = daysLeftInTrial()

  const handleUpgrade = () => {
    onClose()
    router.push("/billing")
  }

  const copy = {
    tokens: {
      eyebrow: "You've used all your posts",
      headline: "Your audience is waiting.",
      sub: "You've hit your post limit for this period. Upgrade to Strategy and get 1,000 posts a month — enough to show up every single day.",
      cta: "Upgrade to Strategy",
      proof: "Rachel signed 12 clients in 3 months after upgrading.",
    },
    trial: {
      eyebrow: daysLeft === 0 ? "Your trial has ended" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left in your trial`,
      headline: "Don't go quiet now.",
      sub: "You've seen what consistent, authentic content does. Keep the momentum going — upgrade before your trial ends and your audience forgets you.",
      cta: "Keep publishing",
      proof: "David reclaimed 10 billable hours a week after upgrading.",
    },
  }

  const c = copy[reason]

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-2xl p-8 shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <Clock className="w-4 h-4 text-brand" />
              <span className="text-xs font-semibold uppercase tracking-widest text-brand">
                {c.eyebrow}
              </span>
            </div>

            <h2 className="font-display text-3xl font-bold mb-3 leading-tight">
              {c.headline}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-8">
              {c.sub}
            </p>

            {/* Social proof */}
            <div className="bg-secondary/60 border border-border rounded-xl px-5 py-4 mb-8">
              <p className="text-sm text-muted-foreground italic">"{c.proof}"</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleUpgrade}
                className="flex-1 h-11 bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-lg"
              >
                {c.cta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="flex-1 h-11 border border-border rounded-lg text-muted-foreground"
              >
                Maybe later
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              14-day money-back guarantee on all paid plans
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
