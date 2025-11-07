import mongoose, { Schema, models } from "mongoose";

const LinkedInUserSchema = new Schema({
  linkedinId: { type: String, required: true, unique: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const LinkedInUser =
  models.LinkedInUser || mongoose.model("LinkedInUser", LinkedInUserSchema);

export default LinkedInUser;
