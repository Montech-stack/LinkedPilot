"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Shield, Zap, LayoutGrid, AlertCircle, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import { SUBSCRIPTION_PLANS, useBillingStore } from "@/lib/billing-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
          email: useBillingStore.getState().userEmail || "user@example.com", // In real app, get from session
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

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border">
          <div className="max-w-7xl mx-auto px-6 py-12">

            <div className="text-center max-w-2xl mx-auto mb-16">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                Upgrade your <span className="text-primary">influence</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Choose the plan that fits your growth. 5 flexible tiers + Pay As You Go.
              </p>

              {/* Toggle */}
              <div className="flex justify-center mt-8">
                <div className="bg-muted p-1.5 rounded-full border border-border flex items-center relative gap-1">
                  {['monthly', 'yearly'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p as any)}
                      className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${period === p ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                      {p === 'yearly' && <span className="ml-2 text-[10px] text-green-500 font-bold tracking-wider">SAVE 20%</span>}
                    </button>
                  ))}
                  <div
                    className={`absolute top-1.5 bottom-1.5 rounded-full bg-primary shadow-lg transition-all duration-300 w-[120px] ${period === 'monthly' ? 'left-1.5' : 'left-[140px] translate-x-2'}`}
                  />
                </div>
              </div>
            </div>

            {/* Pay As You Go Banner */}
            {paygPlan && (
              <div className="mb-12 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/20 rounded-xl text-yellow-500">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Need flexibility? Go Pay-As-You-Go.</h3>
                    <p className="text-sm text-muted-foreground">Buy tokens only when you need them. No monthly fees.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  onClick={() => handleSubscribe('payg')}
                >
                  Switch to Pay As You Go is Active
                </Button>
              </div>
            )}

            {/* Main Grid */}
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
              {payPlans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative p-6 rounded-2xl border transition-all duration-300 flex flex-col h-full ${plan.popular
                    ? "bg-card border-primary shadow-2xl scale-105 z-10"
                    : "bg-card/50 border-border hover:border-primary/50"
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                      Best Value
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">
                        ${period === 'monthly' ? plan.price : Math.floor(plan.price * 12 * 0.8 / 12)}
                      </span>
                      <span className="text-muted-foreground text-xs font-medium">/mo</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading === plan.id || currentPlan === plan.id}
                    className={`w-full h-9 text-sm rounded-lg font-semibold mb-6 transition-all ${plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                      }`}
                  >
                    {isLoading === plan.id ? "..." : currentPlan === plan.id ? "Active" : "Select"}
                  </Button>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={plan.popular ? 'text-foreground' : ''}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            {/* Trust Footer */}
            <div className="mt-20 pt-10 border-t border-border grid md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <Shield className="w-8 h-8 text-muted-foreground mb-2" />
                <h4 className="font-semibold text-foreground">Secure Payment</h4>
                <p className="text-xs text-muted-foreground">256-bit SSL Encyption</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-8 h-8 text-muted-foreground mb-2" />
                <h4 className="font-semibold text-foreground">Instant Access</h4>
                <p className="text-xs text-muted-foreground">Start creating immediately</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <LayoutGrid className="w-8 h-8 text-muted-foreground mb-2" />
                <h4 className="font-semibold text-foreground">Cancel Anytime</h4>
                <p className="text-xs text-muted-foreground">No long-term contracts</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}