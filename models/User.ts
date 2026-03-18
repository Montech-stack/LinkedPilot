// models/User.ts
import mongoose, { Schema, Model } from "mongoose"
import { PLAN_IDS } from "@/lib/billing-store"

interface IOnboardingData {
  businessType?: string
  platforms?: string[]
  goals?: string[]
  voiceSamples?: string[]
  postingFrequency?: string
}

export interface IUser {
  name: string
  email: string
  password?: string
  emailVerified?: Date
  image?: string
  role: string
  // Billing
  plan: string
  tokensRemaining: number
  trialEndsAt?: Date
  subscriptionEndDate?: Date
  pendingPlanId?: string
  pendingReference?: string
  planCancelledAt?: Date
  lastPaymentRef?: string
  lastPaymentFailed?: Date
  // Org
  organizationId?: string
  // Onboarding
  onboardingStep: number
  onboardingCompleted: boolean
  onboardingData: IOnboardingData
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    emailVerified: { type: Date },
    image: { type: String },
    password: { type: String, select: false },

    role: { type: String, default: "user" },

    // Billing — default to trial
    plan: { type: String, default: PLAN_IDS.TRIAL },
    tokensRemaining: { type: Number, default: 30 },
    trialEndsAt: { type: Date },
    subscriptionEndDate: { type: Date },
    pendingPlanId: { type: String },
    pendingReference: { type: String },
    planCancelledAt: { type: Date },
    lastPaymentRef: { type: String },
    lastPaymentFailed: { type: Date },

    organizationId: { type: String },

    onboardingStep: { type: Number, default: 0 },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingData: {
      businessType: { type: String },
      platforms: [{ type: String }],
      goals: [{ type: String }],
      voiceSamples: [{ type: String }],
      postingFrequency: { type: String },
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
)

// Index for fast email lookups
UserSchema.index({ email: 1 })
UserSchema.index({ pendingReference: 1 })

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema)

export { User }
