import mongoose from 'mongoose';

const automationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['response', 'schedule', 'analytics', 'crosspost', 'content'], required: true },
  isActive: { type: Boolean, default: true },
  lastRun: { type: Date },
  topic: { type: String }, // Changed from topicNiche; make optional if not always needed
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
  tone: { type: String, enum: ['professional', 'friendly', 'casual', 'inspirational'] },
  length: { type: String, enum: ['short', 'medium', 'long'] },
  selectedAccounts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SocialAccount' }],
  nextRun: { type: Date, default: null }, // Add with default to make optional
  count: { type: Number, default: 0 }, // Add with default to make optional
}, { timestamps: true });

export default mongoose.models.Automation || mongoose.model('Automation', automationSchema);