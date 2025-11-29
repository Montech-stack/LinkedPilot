// app/billing/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Define plans based on your app's PLAN_LIMITS
const plans = [
  {
    name: "Free",
    price: 0,
    features: ["Up to 5 posts", "Basic features", "Limited quotas"],
    maxPosts: 5,
  },
  {
    name: "Pro",
    price: 1000, // $10 USD, but adjust for your currency (e.g., 100000 kobo for 1000 NGN)
    features: ["Up to 50 posts", "Advanced features", "Higher quotas", "Priority support"],
    maxPosts: 50,
  },
  {
    name: "Enterprise",
    price: 5000, // $50 USD
    features: ["Up to 100 posts", "All features", "Unlimited quotas", "Dedicated support", "Custom integrations"],
    maxPosts: 100,
  },
];

export default function BillingPage() {
  const router = useRouter();
  const [currentPlan, setCurrentPlan] = useState("free"); // Fetch from user data or API
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("user@example.com"); // Fetch from auth

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
          amount: amount * 100, // Convert to subunits (kobo for NGN)
          plan: planName.toLowerCase(), // Assume plan codes are lowercase
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
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center p-4">
      <motion.div
        className="max-w-4xl w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-[#00FFFF] to-[#FFA500] bg-clip-text text-transparent">
          Choose Your Plan
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              className={`bg-[#1b1f2a] p-6 rounded-2xl border ${currentPlan === plan.name.toLowerCase() ? "border-[#00BFFF]" : "border-[#2c2f3a]"} shadow-xl`}
              whileHover={{ scale: 1.05 }}
            >
              <h2 className="text-2xl font-semibold mb-4 text-center">{plan.name}</h2>
              <p className="text-4xl font-bold mb-6 text-center">
                ${plan.price}
                <span className="text-sm font-normal">/month</span>
              </p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => handleSubscribe(plan.name, plan.price)}
                disabled={loadingPlan === plan.name || currentPlan === plan.name.toLowerCase()}
                className="w-full bg-gradient-to-r from-[#0077B5] to-[#005885] hover:opacity-90"
              >
                {currentPlan === plan.name.toLowerCase() ? "Current Plan" : loadingPlan === plan.name ? "Processing..." : "Subscribe"}
                <CreditCard className="ml-2 w-4 h-4" />
              </Button>
              {plan.name === "Free" && currentPlan !== "free" && (
                <p className="text-center mt-4 text-red-500 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Downgrade not available
                </p>
              )}
            </motion.div>
          ))}
        </div>
        <p className="text-center mt-8 text-gray-400">
          Powered by Paystack. <a href="/dashboard" className="text-blue-400 hover:underline">Back to Dashboard</a>
        </p>
      </motion.div>
    </div>
  );
}