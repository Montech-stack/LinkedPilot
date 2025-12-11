import mongoose from 'mongoose';

const automationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['response', 'schedule', 'analytics', 'crosspost', 'content'], required: true },
  isActive: { type: Boolean, default: true },
  lastRun: { type: Date },
  topic: { type: String },
  postTime: { type: String }, // "HH:mm" format
  tone: { type: String, enum: ['professional', 'friendly', 'casual', 'inspirational'] },
  length: { type: String, enum: ['short', 'medium', 'long'] },
  selectedAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SocialAccount' }],
  nextRun: { type: Date, default: null },
  count: { type: Number, default: 0 },
  automateImages: { type: Boolean, default: false },
  username: { type: String },
  profileImageUrl: { type: String },
}, { timestamps: true });

export default mongoose.models.Automation || mongoose.model('Automation', automationSchema);