import mongoose, { Schema, Document, Model } from "mongoose";

export interface IImageContext extends Document {
  userId: string;
  name: string; // e.g., "Neon Cyberpunk", "Company Branding"
  triggerWord: string; // e.g., "in the style of @neon"
  description?: string;
  referenceImageUrls: string[]; // URLs to uploaded images
  createdAt: Date;
}

const ImageContextSchema = new Schema<IImageContext>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    triggerWord: { type: String, required: true },
    description: { type: String },
    referenceImageUrls: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent re-compilation error
const ImageContext: Model<IImageContext> =
  mongoose.models.ImageContext || mongoose.model<IImageContext>("ImageContext", ImageContextSchema);

export default ImageContext;
