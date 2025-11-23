"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CreditCard, Check, Crown, Download, Zap, Users, BarChart3, Settings, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import MobileHeader from "@/components/MobileHeader"
import Sidebar from "@/components/Sidebar"

export default function BillingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  const currentPlan = {
    name: "Pro",
    price: "$19",
    period: "/month",
    nextBilling: "February 15, 2025",
    status: "active",
  }

  const plans = [
    {
      name: "Free",
      price: billingCycle === "monthly" ? "$0" : "$0",
      period: billingCycle === "monthly" ? "/month" : "/year",
      description: "Perfect for getting started",
      features: ["5 posts per month", "Basic AI generation", "3 tone options", "Standard support"],
      current: false,
      popular: false,
    },
    {
      name: "Pro",
      price: billingCycle === "monthly" ? "$19" : "$190",
      period: billingCycle === "monthly" ? "/month" : "/year",
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
      current: true,
      popular: true,
      savings: billingCycle === "yearly" ? "Save $38/year" : null,
    },
    {
      name: "Enterprise",
      price: billingCycle === "monthly" ? "$49" : "$490",
      period: billingCycle === "monthly" ? "/month" : "/year",
      description: "For teams and agencies",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "Brand voice training",
        "API access",
        "Dedicated support",
        "Custom integrations",
      ],
      current: false,
      popular: false,
      savings: billingCycle === "yearly" ? "Save $98/year" : null,
    },
  ]

  const billingHistory = [
    {
      id: 1,
      date: "Jan 15, 2025",
      description: "Pro Plan - Monthly",
      amount: "$19.00",
      status: "paid",
      invoice: "INV-001",
    },
    {
      id: 2,
      date: "Dec 15, 2024",
      description: "Pro Plan - Monthly",
      amount: "$19.00",
      status: "paid",
      invoice: "INV-002",
    },
    {
      id: 3,
      date: "Nov 15, 2024",
      description: "Pro Plan - Monthly",
      amount: "$19.00",
      status: "paid",
      invoice: "INV-003",
    },
  ]

  const usageStats = [
    { label: "Posts Generated", value: "247", limit: "Unlimited", icon: Zap },
    { label: "Team Members", value: "1", limit: "5", icon: Users },
    { label: "Analytics Views", value: "89", limit: "Unlimited", icon: BarChart3 },
    { label: "API Calls", value: "1,234", limit: "10,000", icon: Settings },
  ]

  return (
    <div className="min-h-screen gradient-bg text-white flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-0">
        <MobileHeader onMenuClick={() => setSidebarOpen(true)} />

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            className="mb-8 text-center lg:text-left"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold mb-2 gradient-text">Billing & Subscription</h1>
            <p className="text-gray-400 text-lg">Manage your subscription, billing, and usage</p>
          </motion.div>

          {/* Current Plan */}
          <motion.div
            className="gradient-card rounded-xl p-6 mb-8 border border-[#2d3748] shadow-xl glow-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div>
                <h2 className="text-xl font-bold mb-2">Current Plan</h2>
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  <span className="text-lg font-semibold">{currentPlan.name}</span>
                  <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-sm shadow-lg">
                    Active
                  </span>
                </div>
              </div>
              <div className="text-left lg:text-right">
                <div className="text-2xl font-bold gradient-text">
                  {currentPlan.price}
                  <span className="text-gray-400 text-lg">{currentPlan.period}</span>
                </div>
                <div className="text-gray-400 text-sm">Next billing: {currentPlan.nextBilling}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white shadow-lg glow-button">
                <CreditCard className="w-4 h-4 mr-2" />
                Update Payment Method
              </Button>
              <Button variant="outline" className="border-[#2d3748] text-gray-300 hover:bg-[#2d3748] bg-transparent">
                Cancel Subscription
              </Button>
            </div>
          </motion.div>

          {/* Usage Stats */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {usageStats.map((stat, index) => (
              <div key={index} className="gradient-card rounded-xl p-6 border border-[#2d3748] shadow-lg glow-card">
                <div className="flex items-center gap-3 mb-3">
                  <stat.icon className="w-6 h-6 text-[#0077B5]" />
                  <span className="font-medium text-sm sm:text-base">{stat.label}</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">of {stat.limit}</div>
              </div>
            ))}
          </motion.div>

          {/* Plan Selection */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold">Available Plans</h2>
              <div className="flex items-center gradient-card rounded-lg p-1 border border-[#2d3748] shadow-lg">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === "monthly"
                      ? "bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === "yearly"
                      ? "bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Yearly
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  className={`relative gradient-card rounded-xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-300 ${
                    plan.current
                      ? "border-[#0077B5] ring-2 ring-[#0077B5] ring-opacity-20 scale-105"
                      : "border-[#2d3748]"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: plan.current ? 1.05 : 1.02 }}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-[#0077B5] to-[#00A0DC] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {plan.current && (
                    <div className="absolute -top-4 right-4">
                      <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-400 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-3xl font-bold gradient-text">{plan.price}</span>
                      <span className="text-gray-400 ml-1">{plan.period}</span>
                    </div>
                    {plan.savings && <div className="text-green-400 text-sm font-medium">{plan.savings}</div>}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-[#0077B5] flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full transition-all duration-300 ${
                      plan.current
                        ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                        : plan.popular
                          ? "bg-gradient-to-r from-[#0077B5] to-[#00A0DC] hover:from-[#004182] hover:to-[#0077B5] text-white shadow-lg glow-button"
                          : "bg-gradient-to-r from-[#2d3748] to-[#374151] hover:from-[#374151] hover:to-[#4a5568] text-white border border-[#374151]"
                    }`}
                    disabled={plan.current}
                  >
                    {plan.current ? "Current Plan" : plan.name === "Free" ? "Downgrade" : "Upgrade"}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Billing History */}
          <motion.div
            className="gradient-card rounded-xl p-6 border border-[#2d3748] shadow-xl glow-card mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold">Billing History</h2>
              <Button variant="outline" className="border-[#2d3748] text-gray-300 hover:bg-[#2d3748] bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            </div>

            <div className="space-y-4">
              {billingHistory.map((bill) => (
                <div
                  key={bill.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0a0b0f] rounded-lg border border-[#2d3748]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] bg-opacity-20 rounded-full flex items-center justify-center shadow-lg">
                      <CreditCard className="w-5 h-5 text-[#0077B5]" />
                    </div>
                    <div>
                      <div className="font-medium">{bill.description}</div>
                      <div className="text-gray-400 text-sm">{bill.date}</div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="text-left sm:text-right">
                      <div className="font-bold">{bill.amount}</div>
                      <div className="text-green-400 text-sm capitalize">{bill.status}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white hover:bg-[#2d3748] w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Payment Method */}
          <motion.div
            className="gradient-card rounded-xl p-6 border border-[#2d3748] shadow-xl glow-card mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-xl font-bold mb-6">Payment Method</h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0a0b0f] rounded-lg border border-[#2d3748]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-[#0077B5] to-[#00A0DC] bg-opacity-20 rounded-lg flex items-center justify-center shadow-lg">
                  <CreditCard className="w-6 h-6 text-[#0077B5]" />
                </div>
                <div>
                  <div className="font-medium">•••• •••• •••• 4242</div>
                  <div className="text-gray-400 text-sm">Expires 12/26</div>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-[#2d3748] text-gray-300 hover:bg-[#2d3748] bg-transparent w-full sm:w-auto"
              >
                Update
              </Button>
            </div>
          </motion.div>

          {/* Cancellation Notice */}
          <motion.div
            className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl p-6 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-400 mb-2">Need to cancel?</h3>
                <p className="text-gray-300 mb-4">
                  We're sorry to see you go! If you cancel, you'll continue to have access to Pro features until your
                  next billing date ({currentPlan.nextBilling}).
                </p>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white bg-transparent w-full sm:w-auto"
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

