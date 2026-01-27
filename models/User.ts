import mongoose, { Schema, Model } from 'mongoose';

// Define the shape of the user document (optional interface for better TS typing)
interface IOnboardingData {
  businessType?: string;
  platforms?: string[];
  goals?: string[];
  voiceSamples?: string[];
  postingFrequency?: string;
}

interface IUser {
  name: string;
  email: string;
  password?: string;
  emailVerified?: Date;
  image?: string;
  role: string;
  plan: string;
  tokensRemaining: number;
  // Onboarding fields
  onboardingStep: number;
  onboardingCompleted: boolean;
  onboardingData: IOnboardingData;
}

// Define the structure of the user document
const UserSchema = new Schema<IUser>({
  // Required fields for NextAuth
  name: { type: String },
  email: { type: String, unique: true, required: true },
  emailVerified: { type: Date },
  image: { type: String },

  // Fields for Credentials Provider authentication
  password: { type: String, select: false }, // Store hash, and never return it by default

  // Custom fields
  role: { type: String, default: 'user' },
  plan: { type: String, default: 'free' },
  tokensRemaining: { type: Number, default: 0 },

  // Onboarding fields
  onboardingStep: { type: Number, default: 0 },
  onboardingCompleted: { type: Boolean, default: false },
  onboardingData: {
    businessType: { type: String },
    platforms: [{ type: String }],
    goals: [{ type: String }],
    voiceSamples: [{ type: String }],
    postingFrequency: { type: String },
  },
}, {
  timestamps: true,
  collection: 'users',
});

// Helper function to get or create the User Model
// This prevents Mongoose from trying to recompile the model if it's already registered
const User: Model<IUser> = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export { User };