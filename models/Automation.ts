import mongoose, { Schema } from 'mongoose';

const AutomationSchema = new Schema(
  {
    topic: { type: String, required: true },
    tone: { type: String, required: true },
    length: { type: String, required: true },
    count: { type: Number, required: true },
    frequency: { type: String, default: 'daily' },
    nextRun: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Automation || mongoose.model('Automation', AutomationSchema);