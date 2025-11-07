import mongoose, { Document, Schema, Model } from "mongoose";

export interface ISocialAccount extends Document {
  platform: string;
  name: string;
  email: string;
  connected: boolean;
  userId: string;
}

const SocialAccountSchema = new Schema<ISocialAccount>({
  platform: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  connected: { type: Boolean, default: false },
  userId: { type: String, required: true },
});

const SocialAccount: Model<ISocialAccount> =
  mongoose.models.SocialAccount ||
  mongoose.model<ISocialAccount>("SocialAccount", SocialAccountSchema);

export default SocialAccount;
