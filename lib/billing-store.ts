import { create } from "zustand"

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  yearlyPrice: number
  tokens: number // -1 = unlimited
  trialDays: number
  features: string[]
  highlight?: string
  popular?: boolean
  cta: string
}

// Single source of truth for ALL plan IDs used across the entire app
export const PLAN_IDS = {
  TRIAL: "trial",
  STRATEGY: "strategy",
  ENTERPRISE: "enterprise",
  AGENCY: "agency",
} as const

export type PlanId = typeof PLAN_IDS[keyof typeof PLAN_IDS]

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: PLAN_IDS.TRIAL,
    name: "14-Day Trial",
    price: 0,
    yearlyPrice: 0,
    tokens: 30,
    trialDays: 14,
    features: [
      "30 AI posts during trial",
      "Basic voice profile",
      "1 connected platform",
      "7-day analytics",
    ],
    cta: "Start your free trial",
  },
  {
    id: PLAN_IDS.STRATEGY,
    name: "Strategy",
    price: 49,
    yearlyPrice: 39, // per month billed annually
    tokens: 1000,
    trialDays: 0,
    popular: true,
    highlight: "Best for coaches & consultants",
    features: [
      "1,000 AI posts per month",
      "Deep voice profile — sounds exactly like you",
      "One idea repurposed into 7 formats",
      "Client ROI analytics",
      "Smart scheduling across all platforms",
      "LinkedIn, X, Instagram, TikTok, Threads",
    ],
    cta: "Start Strategy",
  },
  {
    id: PLAN_IDS.ENTERPRISE,
    name: "Enterprise",
    price: 199,
    yearlyPrice: 159,
    tokens: 5000,
    trialDays: 0,
    highlight: "Best for agencies managing clients",
    features: [
      "5,000 AI posts per month",
      "5 client workspaces",
      "White-label reports",
      "Team collaboration tools",
      "API access",
      "Priority support — real humans, fast",
    ],
    cta: "Start Enterprise",
  },
  {
    id: PLAN_IDS.AGENCY,
    name: "Agency",
    price: 0, // Contact sales
    yearlyPrice: 0,
    tokens: -1,
    trialDays: 0,
    highlight: "For large teams and enterprises",
    features: [
      "Unlimited AI content",
      "Unlimited client workspaces",
      "Custom contracts and SLA",
      "Dedicated success manager",
      "SSO and advanced security",
      "Custom integrations",
    ],
    cta: "Talk to sales",
  },
]

export const getPlanById = (id: string): SubscriptionPlan | undefined =>
  SUBSCRIPTION_PLANS.find((p) => p.id === id)

export const getPlanTokens = (id: string): number =>
  getPlanById(id)?.tokens ?? 30

export const isTrialPlan = (id: string) => id === PLAN_IDS.TRIAL
export const isPaidPlan = (id: string) =>
  [PLAN_IDS.STRATEGY, PLAN_IDS.ENTERPRISE, PLAN_IDS.AGENCY].includes(id as PlanId)

interface BillingState {
  currentPlan: string
  tokensRemaining: number
  totalTokens: number
  trialEndsAt: number | null
  subscriptionEndDate: number | null
  userEmail: string
  hydrated: boolean
  setCurrentPlan: (planId: string) => void
  useToken: () => boolean
  addTokens: (amount: number) => void
  resetTokens: () => void
  syncFromDB: (data: {
    plan: string
    tokens: number
    totalTokens?: number
    endDate?: number
    trialEndsAt?: number
  }) => void
  setHydrated: (value: boolean) => void
  isTrialExpired: () => boolean
  daysLeftInTrial: () => number
}

export const useBillingStore = create<BillingState>((set, get) => ({
  currentPlan: PLAN_IDS.TRIAL,
  tokensRemaining: 30,
  totalTokens: 30,
  trialEndsAt: null,
  subscriptionEndDate: null,
  userEmail: "",
  hydrated: false,

  syncFromDB: (data) => {
    set({
      currentPlan: data.plan,
      tokensRemaining: data.tokens,
      totalTokens: data.totalTokens ?? data.tokens,
      subscriptionEndDate: data.endDate ?? null,
      trialEndsAt: data.trialEndsAt ?? null,
      hydrated: true,
    })
  },

  setCurrentPlan: (planId: string) => {
    const plan = getPlanById(planId)
    if (!plan) return

    set({
      currentPlan: planId,
      tokensRemaining: plan.tokens === -1 ? -1 : plan.tokens,
      totalTokens: plan.tokens,
      subscriptionEndDate:
        plan.price > 0 ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null,
    })

    fetch("/api/user/update-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    }).catch(console.error)
  },

  useToken: () => {
    const { tokensRemaining } = get()
    if (tokensRemaining === -1) return true
    if (tokensRemaining <= 0) return false
    set({ tokensRemaining: tokensRemaining - 1 })
    fetch("/api/deduct-token", { method: "POST" }).catch(console.error)
    return true
  },

  addTokens: (amount: number) => {
    const { tokensRemaining } = get()
    if (tokensRemaining === -1) return
    set({ tokensRemaining: tokensRemaining + amount })
    fetch("/api/user/add-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }).catch(console.error)
  },

  resetTokens: () => {
    const { currentPlan } = get()
    const plan = getPlanById(currentPlan)
    if (!plan || plan.tokens === -1) return
    set({
      tokensRemaining: plan.tokens,
      totalTokens: plan.tokens,
      subscriptionEndDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    })
  },

  isTrialExpired: () => {
    const { currentPlan, trialEndsAt } = get()
    if (currentPlan !== PLAN_IDS.TRIAL) return false
    if (!trialEndsAt) return false
    return Date.now() > trialEndsAt
  },

  daysLeftInTrial: () => {
    const { trialEndsAt } = get()
    if (!trialEndsAt) return 14
    const ms = trialEndsAt - Date.now()
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
  },

  setHydrated: (value: boolean) => set({ hydrated: value }),
}))
