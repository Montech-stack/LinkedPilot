
import mongoose, { Schema } from 'mongoose';

const DraftSchema = new Schema({
  userEmail: { type: String, required: true },
  content: { type: String, required: true },
  platform: { type: String, default: "LinkedIn" },
  type: { type: String, enum: ['text', 'image', 'video'], default: 'text' },
  media: { type: String },
  savedAt: { type: Date, default: Date.now },
});

export const Draft = mongoose.models.Draft || mongoose.model('Draft', DraftSchema);
