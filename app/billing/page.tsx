"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Shield, Zap, LayoutGrid, AlertCircle, Coins, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import { SUBSCRIPTION_PLANS, useBillingStore } from "@/lib/billing-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no long-term contracts for Strategy or Enterprise monthly plans. You can cancel with one click."
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Your data is kept safe for 90 days. You will lose access to premium features like Deep DNA analysis."
  },
  {
    q: "Do unused tokens roll over?",
    a: "On monthly plans, tokens reset each billing cycle. Pay-As-You-Go tokens never expire."
  },
  {
    q: "How does the 'Agency' plan work?",
    a: "The Agency plan allows you to manage multiple client workspaces from one login. Contact sales for custom pricing."
  }
];

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { currentPlan, setCurrentPlan, tokensRemaining } = useBillingStore();

  const handleSubscribe = async (planId: string) => {
    setIsLoading(planId);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: useBillingStore.getState().userEmail || "user@example.com",
          plan: planId,
          amount: SUBSCRIPTION_PLANS.find(p => p.id === planId)?.price || 0,
          period
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Subscription failed");
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else if (planId === 'free') {
        setCurrentPlan(planId);
        toast.success("Free plan activated!");
      } else {
        toast.success("Plan updated!");
        setCurrentPlan(planId);
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to update plan");
    } finally {
      setIsLoading(null);
    }
  };

  const payPlans = SUBSCRIPTION_PLANS.filter(p => p.id !== 'payg');
  const paygPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'payg');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-background to-background">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
          <div className="max-w-7xl mx-auto px-6 py-12">

            <div className="text-center max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-5 text-foreground">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                Unlock Your Potential
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Choose the plan that fits your ambition. From solo creator to scaling agency.
              </p>

              {/* Toggle */}
              <div className="flex justify-center mt-10">
                <div className="bg-muted/50 p-1.5 rounded-full border border-border backdrop-blur-sm flex items-center relative gap-1">
                  {['monthly', 'yearly'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p as any)}
                      className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${period === p ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                      {p === 'yearly' && <span className="ml-2 text-[10px] bg-green-500/20 text-green-600 px-1.5 py-0.5 rounded-full font-bold tracking-wider">-20%</span>}
                    </button>
                  ))}
                  <div
                    className={`absolute top-1.5 bottom-1.5 rounded-full bg-primary shadow-lg transition-all duration-300 w-[120px] ${period === 'monthly' ? 'left-1.5' : 'left-[140px] translate-x-3'}`}
                  />
                </div>
              </div>
            </div>

            {/* Pay As You Go Banner */}
            {paygPlan && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-12 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm"
              >
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-500">
                    <Coins className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Prefer flexibility? Go Pay-As-You-Go.</h3>
                    <p className="text-muted-foreground">Buy tokens only when you need them. No monthly commitment.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-amber-500/50 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 h-10 px-6"
                  onClick={() => handleSubscribe('payg')}
                >
                  Switch to Pay-As-You-Go
                </Button>
              </motion.div>
            )}

            {/* Main Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start mb-20">
              {payPlans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative p-8 rounded-3xl border transition-all duration-300 flex flex-col h-full bg-card ${plan.popular
                    ? "border-primary shadow-2xl scale-105 z-10 ring-4 ring-primary/5"
                    : "border-border hover:border-primary/30 hover:shadow-lg"
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-foreground mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">
                        ${period === 'monthly' ? plan.price : Math.floor(plan.price * 12 * 0.8 / 12)}
                      </span>
                      <span className="text-muted-foreground text-sm font-medium">/mo</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {plan.id === 'free' ? 'For checking things out' : period === 'yearly' ? 'Billed annually' : 'Billed monthly'}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading === plan.id || currentPlan === plan.id}
                    className={`w-full h-11 text-sm rounded-xl font-semibold mb-8 transition-all ${plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                  >
                    {isLoading === plan.id ? "Processing..." : currentPlan === plan.id ? "Current Plan" : "Upgrade"}
                  </Button>

                  <div className="space-y-4 flex-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Features</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-foreground/80">
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={plan.popular ? 'font-medium' : ''}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* FAQs */}
            <div className="max-w-3xl mx-auto">
              <h3 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2">
                <HelpCircle className="w-6 h-6 text-primary" />
                Frequently Asked Questions
              </h3>
              <div className="grid gap-6">
                {FAQS.map((faq, i) => (
                  <div key={i} className="bg-card/50 border border-border/50 rounded-2xl p-6 hover:border-primary/20 transition-colors">
                    <h4 className="font-semibold text-foreground mb-2">{faq.q}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust Footer */}
            <div className="mt-20 pt-10 border-t border-border grid md:grid-cols-3 gap-8 text-center opacity-70">
              <div className="flex flex-col items-center gap-3">
                <Shield className="w-6 h-6 text-foreground" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Secure Payment</h4>
                  <p className="text-xs text-muted-foreground">Encrypted via Stripe</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <Zap className="w-6 h-6 text-foreground" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Instant Access</h4>
                  <p className="text-xs text-muted-foreground">Start creating immediately</p>
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <LayoutGrid className="w-6 h-6 text-foreground" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Cancel Anytime</h4>
                  <p className="text-xs text-muted-foreground">Manage logic in 1-click</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}