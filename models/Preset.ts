import mongoose, { Schema, Document } from 'mongoose';

export interface IPreset extends Document {
    userId: string;
    name: string;
    description: string;
    promptSnippet: string;
    category: string;
    createdAt: Date;
}

const PresetSchema = new Schema<IPreset>({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    promptSnippet: { type: String, required: true },
    category: { type: String, default: 'Custom' },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Preset || mongoose.model<IPreset>('Preset', PresetSchema);
