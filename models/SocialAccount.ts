// /models/SocialAccount.ts (UPDATED)
import mongoose, { Document, Schema, Model } from "mongoose"

export interface ISocialAccount extends Document {
  platform: string
  name: string
  email: string
  connected: boolean
  userId: string
  linkedinId?: string // ← NEW: Links to LinkedInUser
  createdAt: Date
  updatedAt: Date
}

const SocialAccountSchema = new Schema(
  {
    platform: { 
      type: String, 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true 
    },
    connected: { 
      type: Boolean, 
      default: false 
    },
    userId: { 
      type: String, 
      required: true 
    },
    linkedinId: { 
      type: String, 
      required: false // Only for LinkedIn accounts
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
)

// Create compound index for uniqueness
SocialAccountSchema.index({ platform: 1, email: 1, userId: 1 }, { unique: true })

const SocialAccount: Model<ISocialAccount> =
  mongoose.models.SocialAccount || mongoose.model<ISocialAccount>("SocialAccount", SocialAccountSchema)

export default SocialAccount