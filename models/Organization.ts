import mongoose, { Schema, Model } from 'mongoose';

export interface IOrganization {
    name: string;
    slug: string;
    ownerId: string;
    plan: string;
    credits: number;
    members: {
        userId: string;
        role: 'owner' | 'admin' | 'member';
        joinedAt: Date;
    }[];
    invites: {
        email: string;
        role: 'admin' | 'member';
        token: string;
        expiresAt: Date;
    }[];
}

const OrganizationSchema = new Schema<IOrganization>({
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    ownerId: { type: String, required: true }, // The user who pays
    plan: { type: String, default: 'free' },
    credits: { type: Number, default: 0 },
    members: [{
        userId: { type: String, required: true },
        role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now }
    }],
    invites: [{
        email: { type: String, required: true },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true }
    }]
}, {
    timestamps: true,
    collection: 'organizations'
});

const Organization: Model<IOrganization> = (mongoose.models.Organization as Model<IOrganization>) || mongoose.model<IOrganization>('Organization', OrganizationSchema);

export { Organization };
