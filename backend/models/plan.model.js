import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            enum: ['FREE', 'STARTER', 'PRO', 'ENTERPRISE', 'MASTER'],
        },
        billingCycle: {
            type: String,
            required: true,
            enum: ['MONTHLY', 'YEARLY', 'LIFETIME'],               // MASTER uses LIFETIME
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },

        // ── Limits: null means UNLIMITED ──────────────────
        creditsIncluded: {
            type: Number,
            default: null,                                         // null = infinite credits
            min: 0,
        },
        maxCampaignsPerMonth: {
            type: Number,
            default: null,                                         // null = no cap
            min: 0,
        },
        maxRecipientsPerCampaign: {
            type: Number,
            default: null,                                         // null = no cap
            min: 0,
        },

        features: {
            analyticsAccess: { type: Boolean, default: false },
            prioritySupport: { type: Boolean, default: false },
            customTemplates: { type: Boolean, default: false },
            apiAccess: { type: Boolean, default: false },
        },

        isInternal: {
            type: Boolean,
            default: false,                                        // true = hidden from public /api/plans listing
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// Compound unique index: one plan per name + cycle combo
planSchema.index({ name: 1, billingCycle: 1 }, { unique: true });

export default mongoose.model('Plan', planSchema);