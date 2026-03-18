"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Check, Shield, Zap, LayoutGrid, ExternalLink, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"
import { SUBSCRIPTION_PLANS, useBillingStore, PLAN_IDS } from "@/lib/billing-store"
import { useSession } from "next-auth/react"

const FAQS = [
  {
    q: "What happens when my trial ends?",
    a: "After 14 days your account pauses — no charges, no surprise bills. You choose whether to upgrade to keep going. Your content and voice profile are saved for 30 days.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. One click, no friction, no phone calls. We'll email you a confirmation the moment it's done.",
  },
  {
    q: "What happens to my posts if I downgrade?",
    a: "Everything you've created is yours. Your drafts, voice profile, and analytics history stay in your account for 30 days.",
  },
  {
    q: "How does the voice profile work?",
    a: "During setup you paste a few of your existing posts. Maxis learns how you write — your vocabulary, sentence rhythm, the opinions you hold. Every post it writes from then on sounds like you on your best day.",
  },
  {
    q: "Do unused posts roll over?",
    a: "On monthly plans, your post allowance resets each billing cycle. Unused posts don't roll over — but 1,000 posts a month is more than enough for daily publishing across every platform.",
  },
]

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly")
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const { currentPlan, daysLeftInTrial, isTrialExpired, syncFromDB } = useBillingStore()
  const { data: session } = useSession()
  const daysLeft = daysLeftInTrial()
  const trialExpired = isTrialExpired()

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/user/stats")
        if (res.ok) {
          const data = await res.json()
          syncFromDB({
            plan: data.plan,
            tokens: data.tokensRemaining,
            trialEndsAt: data.trialEndsAt,
            endDate: data.subscriptionEndDate,
          })
        }
      } catch (e) {
        console.error("Failed to load billing stats", e)
      }
    }
    loadStats()
  }, [])

  const handleSubscribe = async (planId: string) => {
    if (planId === PLAN_IDS.AGENCY) {
      window.location.href = "mailto:hello@maxis.media?subject=Agency Plan Enquiry"
      return
    }

    if (planId === currentPlan) return

    setIsLoading(planId)
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, period }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url
      } else {
        toast.success("Plan updated successfully")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update plan")
    } finally {
      setIsLoading(null)
    }
  }

  const displayedPlans = SUBSCRIPTION_PLANS.filter(
    (p) => p.id !== PLAN_IDS.TRIAL
  )

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-12">

            {/* Trial status banner */}
            {currentPlan === PLAN_IDS.TRIAL && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-10 rounded-xl border px-6 py-4 flex items-center justify-between gap-4 ${
                  trialExpired
                    ? "bg-destructive/10 border-destructive/30"
                    : "bg-amber-500/8 border-amber-500/25"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className={`w-5 h-5 flex-shrink-0 ${trialExpired ? "text-destructive" : "text-amber-500"}`} />
                  <p className="text-sm font-medium">
                    {trialExpired
                      ? "Your trial has ended. Upgrade to keep publishing."
                      : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left in your trial. Pick a plan before it ends.`}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  trialExpired
                    ? "bg-destructive/15 text-destructive"
                    : "bg-amber-500/15 text-amber-600"
                }`}>
                  {trialExpired ? "Expired" : "Trial active"}
                </span>
              </motion.div>
            )}

            {/* Header */}
            <div className="mb-12">
              <h1 className="font-display text-4xl font-bold tracking-tight mb-3">
                {currentPlan === PLAN_IDS.TRIAL
                  ? "Choose your plan"
                  : "Manage your plan"}
              </h1>
              <p className="text-muted-foreground text-lg">
                Your voice is your business. Protect it with consistent, authentic content.
              </p>
            </div>

            {/* Period toggle */}
            <div className="flex items-center gap-4 mb-10">
              <div className="flex items-center gap-1 bg-secondary/60 p-1 rounded-lg border border-border">
                {(["monthly", "yearly"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                      period === p
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {p === "monthly" ? "Monthly" : "Yearly"}
                    {p === "yearly" && (
                      <span className="ml-2 text-[10px] bg-green-500/15 text-green-600 font-bold px-1.5 py-0.5 rounded">
                        Save 20%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Plans */}
            <div className="grid md:grid-cols-3 gap-5 mb-16">
              {displayedPlans.map((plan, i) => {
                const isCurrentPlan = currentPlan === plan.id
                const price =
                  plan.id === PLAN_IDS.AGENCY
                    ? null
                    : period === "yearly"
                    ? plan.yearlyPrice
                    : plan.price
                const isAgency = plan.id === PLAN_IDS.AGENCY

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-200 ${
                      plan.popular
                        ? "border-foreground ring-1 ring-foreground/10"
                        : "border-border hover:border-foreground/30"
                    } bg-background`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-bold px-4 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                        Most popular
                      </div>
                    )}

                    <div className="mb-6">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                        {plan.name}
                      </p>
                      {price !== null ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">${price}</span>
                          <span className="text-muted-foreground text-sm">/mo</span>
                        </div>
                      ) : (
                        <div className="text-3xl font-bold">Custom</div>
                      )}
                      {period === "yearly" && !isAgency && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Billed ${plan.yearlyPrice * 12}/year
                        </p>
                      )}
                      {plan.highlight && (
                        <p className="text-xs text-muted-foreground mt-2">{plan.highlight}</p>
                      )}
                    </div>

                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isLoading === plan.id || isCurrentPlan}
                      className={`w-full h-11 rounded-lg text-sm font-semibold mb-7 ${
                        plan.popular
                          ? "bg-foreground text-background hover:bg-foreground/90"
                          : "bg-transparent border border-border hover:bg-secondary text-foreground"
                      }`}
                      variant="ghost"
                    >
                      {isLoading === plan.id
                        ? "Redirecting..."
                        : isCurrentPlan
                        ? "Current plan"
                        : isAgency
                        ? "Contact sales"
                        : plan.cta}
                      {isAgency && <ExternalLink className="ml-2 w-3.5 h-3.5" />}
                    </Button>

                    <ul className="space-y-3 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <Check
                            className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                              plan.popular ? "text-foreground" : "text-muted-foreground"
                            }`}
                            strokeWidth={2.5}
                          />
                          <span className="text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )
              })}
            </div>

            {/* FAQs */}
            <div className="mb-16">
              <h2 className="font-display text-2xl font-bold mb-8">Common questions</h2>
              <div className="grid gap-5 md:grid-cols-2">
                {FAQS.map((faq, i) => (
                  <div key={i} className="bg-secondary/40 border border-border/60 rounded-xl p-5">
                    <h4 className="font-semibold text-sm text-foreground mb-2">{faq.q}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust footer */}
            <div className="border-t border-border pt-8 grid grid-cols-3 gap-6 text-center opacity-60">
              <div className="flex flex-col items-center gap-2">
                <Shield className="w-5 h-5" />
                <div>
                  <p className="text-xs font-semibold">Secure payment</p>
                  <p className="text-xs text-muted-foreground">256-bit SSL encryption</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-5 h-5" />
                <div>
                  <p className="text-xs font-semibold">Instant access</p>
                  <p className="text-xs text-muted-foreground">Start publishing immediately</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LayoutGrid className="w-5 h-5" />
                <div>
                  <p className="text-xs font-semibold">Cancel anytime</p>
                  <p className="text-xs text-muted-foreground">One click, no questions</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
