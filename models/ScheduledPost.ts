import mongoose, { Document, Schema, Model } from "mongoose";

export interface IScheduledPost extends Document {
  linkedinId: string;
  content: string;
  media?: string | null;
  mediaType?: "image" | "video" | null;
  scheduledAt: Date;
  posted: boolean;
  error?: string | null;
  platform?: string;
  generateImage?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledPostSchema = new Schema<IScheduledPost>(
  {
    linkedinId: { type: String, required: true },
    content: { type: String, required: true },
    media: { type: String, default: null },
    mediaType: { type: String, enum: ["image", "video", null], default: null },
    scheduledAt: { type: Date, required: true },
    posted: { type: Boolean, default: false },
    error: { type: String, default: null },
    platform: { type: String, default: "linkedin" },
    generateImage: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const ScheduledPost: Model<IScheduledPost> =
  mongoose.models.ScheduledPost ||
  mongoose.model<IScheduledPost>("ScheduledPost", ScheduledPostSchema);

export default ScheduledPost;

