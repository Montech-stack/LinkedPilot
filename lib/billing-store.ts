// ============================================
// FILE 1: /lib/billing-store.ts (UPDATED - MongoDB Sync)
// ============================================
import { create } from "zustand"

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency: string
  tokens: number // -1 = unlimited
  features: string[]
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "payg",
    name: "Pay As You Go",
    price: 0,
    currency: "USD",
    tokens: 0,
    features: [
      "Buy tokens as needed",
      "$0.10 per token",
      "No monthly commitment",
      "Full feature access",
    ],
  },
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    tokens: 5,
    features: [
      "5 Posts / month",
      "1 Platform",
      "Community Support"
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    currency: "USD",
    tokens: 50,
    features: [
      "50 Posts / month",
      "Basic Templates",
      "Priority support",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    price: 29.99,
    currency: "USD",
    tokens: 200,
    popular: true,
    features: [
      "200 Posts / month",
      "Viral Hooks",
      "All Platforms",
      "Analytics",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 49.99,
    currency: "USD",
    tokens: 1000,
    features: [
      "1000 Posts / month",
      "Voice Cloning",
      "Advanced Analytics",
      "Priority Support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99.99,
    currency: "USD",
    tokens: -1,
    features: [
      "Unlimited Posts",
      "White-label Reports",
      "Team Collaboration",
      "API Access",
      "Dedicated Account Manager",
    ],
  },
]


interface BillingState {
  currentPlan: string
  tokensRemaining: number
  totalTokens: number
  subscriptionEndDate: number | null
  userEmail: string
  hydrated: boolean
  setCurrentPlan: (planId: string) => void
  useToken: () => boolean
  addTokens: (amount: number) => void
  resetTokens: () => void
  syncFromDB: (data: { plan: string; tokens: number; totalTokens?: number; endDate?: number }) => void
  setHydrated: (value: boolean) => void
}

/**
 * Client-side Zustand store (no persistence)
 * Data comes from MongoDB via API calls
 */
export const useBillingStore = create<BillingState>((set, get) => ({
  currentPlan: "free",
  tokensRemaining: 0,
  totalTokens: 0,
  subscriptionEndDate: null,
  userEmail: "",
  hydrated: false,

  /**
   * Sync billing data from MongoDB
   * Called after fetching user data from database
   */
  syncFromDB: (data) => {
    console.log("💾 [BILLING] Syncing from MongoDB:", data)
    // Strictly use DB data as requested
    set({
      currentPlan: data.plan,
      tokensRemaining: data.tokens,
      totalTokens: data.totalTokens || data.tokens, // Fallback if not provided
      subscriptionEndDate: data.endDate || null,
      hydrated: true,
    })
  },

  /**
   * Switch or activate a plan (updates locally and triggers DB sync)
   */
  setCurrentPlan: (planId: string) => {
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
    if (!plan) return

    if (plan.id === "payg") {
      set({
        currentPlan: "payg",
        tokensRemaining: get().tokensRemaining,
        totalTokens: 0,
        subscriptionEndDate: null,
      })
    } else {
      set({
        currentPlan: planId,
        tokensRemaining: plan.tokens === -1 ? -1 : plan.tokens,
        totalTokens: plan.tokens,
        subscriptionEndDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      })
    }

    // Trigger DB sync
    fetch("/api/user/update-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    }).catch(console.error)
  },

  /**
   * Use a token when generating an image
   */
  useToken: () => {
    const { tokensRemaining } = get()

    if (tokensRemaining === -1) return true
    if (tokensRemaining <= 0) return false

    set({ tokensRemaining: tokensRemaining - 1 })

    // Sync to DB in background
    fetch("/api/user/use-token", {
      method: "POST",
    }).catch(console.error)

    return true
  },

  /**
   * Add tokens (for PAYG purchases)
   */
  addTokens: (amount: number) => {
    const { tokensRemaining } = get()
    if (tokensRemaining === -1) return

    set({ tokensRemaining: tokensRemaining + amount })

    // Sync to DB
    fetch("/api/user/add-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }).catch(console.error)
  },

  /**
   * Reset monthly tokens
   */
  resetTokens: () => {
    const { currentPlan } = get()
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === currentPlan)
    if (!plan || plan.tokens === -1) return

    set({
      tokensRemaining: plan.tokens,
      totalTokens: plan.tokens,
      subscriptionEndDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })
  },

  setHydrated: (value: boolean) => set({ hydrated: value }),
}))