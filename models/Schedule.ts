import mongoose, { Schema } from 'mongoose';

const ScheduleSchema = new Schema(
  {
    postId: { type: String, required: true },
    content: { type: String, required: true },
    scheduleTime: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'posted', 'failed'], default: 'pending' },
    recurring: { type: String, enum: ['daily', 'weekly', 'monthly', null], default: null },
    error: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);