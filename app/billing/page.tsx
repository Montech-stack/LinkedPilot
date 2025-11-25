// app/billing/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle, AlertCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";

// Define plans with realistic pricing, tokens instead of posts
const plans = [
  {
    name: "Pay as You Go",
    price: 0,
    features: ["$1 per 100 tokens/mo", "$1 per connected account/mo", "Pay only for what you use", "Basic features", "No monthly commitment"],
    maxTokens: "Unlimited (pay per use)",
  },
  {
    name: "Free",
    price: 0,
    features: ["Up to 10 tokens per month", "Basic AI generation", "1 connected account", "Limited tones and lengths"],
    maxTokens: 10,
  },
  {
    name: "Pro",
    price: 29,
    features: ["Up to 1,000 tokens per month", "Advanced AI features", "Unlimited connected accounts", "All tones and lengths", "Priority support", "Media uploads"],
    maxTokens: 1000,
  },
  {
    name: "Enterprise",
    price: 99,
    features: ["Unlimited tokens", "All Pro features", "Custom AI models", "Team collaboration", "Dedicated account manager", "API access", "Advanced analytics"],
    maxTokens: "Unlimited",
  },
];

export default function BillingPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("free"); // Fetch from user data or API
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("user@example.com"); // Fetch from auth

  // For Pay as You Go custom form
  const [numAccounts, setNumAccounts] = useState(1);
  const [numTokens, setNumTokens] = useState(100);
  const accountPrice = 1; // $1 per account/mo
  const tokenPricePer100 = 1; // $1 per 100 tokens/mo
  const paygTotal = numAccounts * accountPrice + (numTokens / 100) * tokenPricePer100;

  // Simulate fetching current plan (replace with real API call)
  useEffect(() => {
    // Example: fetch('/api/user/plan').then(res => res.json()).then(data => setCurrentPlan(data.plan));
    setCurrentPlan("free"); // Default
  }, []);

  const handleSubscribe = async (planName: string, amount: number) => {
    setLoadingPlan(planName);
    try {
      // Call backend to initialize transaction with plan
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          amount: amount * 100, // Convert to subunits (kobo for NGN, adjust for currency)
          plan: planName.toLowerCase(), // Assume plan codes are lowercase
          ...(planName === "Pay as You Go" && { numAccounts, numTokens }), // Pass extra for payg
        }),
      });
      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("Failed to initialize subscription");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to start subscription. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col md:flex-row">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 w-full">
            <motion.div
              className="text-center mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#00FFFF] via-[#00BFFF] to-[#FFA500] bg-clip-text text-transparent mb-2">
                Upgrade Your AI Content Studio
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Unlock more tokens, advanced features, and seamless social media management.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <motion.div
                  key={plan.name}
                  className={`bg-[#1b1f2a] p-6 rounded-2xl border ${currentPlan === plan.name.toLowerCase() ? "border-[#00BFFF] shadow-[#00BFFF]/50" : "border-[#2c2f3a]"} shadow-xl hover:shadow-2xl transition-shadow`}
                  whileHover={{ scale: 1.05 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-semibold mb-4 text-center bg-gradient-to-r from-[#00FFFF] to-[#FFA500] bg-clip-text text-transparent">{plan.name}</h2>
                  <p className="text-4xl font-bold mb-6 text-center flex items-center justify-center gap-1">
                    {plan.price === 0 ? (plan.name === "Free" ? "Free" : "Variable") : <><DollarSign className="w-6 h-6" />{plan.price}</>}
                    {plan.price > 0 && <span className="text-sm font-normal">/month</span>}
                  </p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.name === "Pay as You Go" ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm mb-1">Number of Accounts ($1/mo each)</label>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={numAccounts}
                          onChange={(e) => setNumAccounts(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#11151c] border border-[#2c2f3a] rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm mb-1">Tokens ($1 per 100/mo)</label>
                        <input
                          type="number"
                          min={100}
                          step={100}
                          value={numTokens}
                          onChange={(e) => setNumTokens(Math.max(100, parseInt(e.target.value) || 100))}
                          className="w-full bg-[#11151c] border border-[#2c2f3a] rounded-lg p-2 text-white"
                        />
                      </div>
                      <p className="text-center font-bold">Total: ${paygTotal.toFixed(2)} /mo</p>
                      <Button
                        onClick={() => handleSubscribe(plan.name, paygTotal)}
                        disabled={loadingPlan === plan.name || currentPlan === plan.name.toLowerCase()}
                        className="w-full bg-gradient-to-r from-[#0077B5] to-[#005885] hover:opacity-90 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                      >
                        {loadingPlan === plan.name ? "Processing..." : "Pay Now"}
                        <CreditCard className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.name, plan.price)}
                      disabled={loadingPlan === plan.name || currentPlan === plan.name.toLowerCase()}
                      className="w-full bg-gradient-to-r from-[#0077B5] to-[#005885] hover:opacity-90 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      {currentPlan === plan.name.toLowerCase() ? "Current Plan" : loadingPlan === plan.name ? "Processing..." : "Subscribe Now"}
                      <CreditCard className="ml-2 w-4 h-4" />
                    </Button>
                  )}
                  {plan.name === "Free" && currentPlan !== "free" && (
                    <p className="text-center mt-4 text-red-400 flex items-center justify-center gap-1 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Downgrade not available
                    </p>
                  )}
                  {plan.name === "Pay as You Go" && (
                    <p className="text-center mt-4 text-gray-400 text-xs">
                      Billed based on selected usage. No fixed monthly fee beyond selections.
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            <p className="text-center mt-8 text-gray-400 text-sm">
              Prices are in USD and may vary by region. Powered by Paystack. <a href="/dashboard" className="text-[#00BFFF] hover:text-[#00FFFF] underline">Back to Dashboard</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}