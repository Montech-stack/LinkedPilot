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
    id: "free",
    name: "Free Trial",
    price: 0,
    currency: "USD",
    tokens: 10,
    features: [
      "10 AI Posts / month",
      "Advanced Writing DNA",
      "1 Platform Connected",
      "7-day Analytics"
    ],
  },
  {
    id: "strategy",
    name: "Strategy",
    price: 49,
    currency: "USD",
    tokens: 1000, // Cap tokens as requested ("Agency is the only unlimited")
    popular: true,
    features: [
      "1,000 AI Posts / month",
      "Deep Voice Intelligence",
      "Repurpose Engine (1 → 7)",
      "ROI Analytics",
      "Smart Scheduling",
      "All Platforms",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    currency: "USD",
    tokens: 5000,
    features: [
      "5,000 AI Posts / month",
      "5 Client Workspaces",
      "White-label Reports",
      "Team Collaboration",
      "API Access",
      "Priority 24/7 Support",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: 0, // Contact Sales
    currency: "USD",
    tokens: -1, // Truly Unlimited
    features: [
      "Unlimited AI Content",
      "Unlimited Workspaces",
      "Custom Contracts",
      "Dedicated Success Manager",
      "SSO & Advanced Security",
      "Custom Integration"
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