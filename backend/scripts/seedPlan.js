import 'dotenv/config';
import mongoose from 'mongoose';
import Plan from '../models/plan.model.js';
import User from '../models/user.model.js';

export const plans = [
    // ─── FREE ───────────────────────────────────────────
    {
        name: 'FREE',
        billingCycle: 'MONTHLY',
        price: 0,
        creditsIncluded: 500,
        maxCampaignsPerMonth: 20,
        maxRecipientsPerCampaign: 1000,
        maxActiveSessions: 1, // ✅ new field
        features: {
            analyticsAccess: false,
            prioritySupport: false,
            customTemplates: false,
            apiAccess: false,
        },
    },

    // ─── STARTER ────────────────────────────────────────
    {
        name: 'STARTER',
        billingCycle: 'MONTHLY',
        price: 49,
        creditsIncluded: 5000,
        maxCampaignsPerMonth: 100,
        maxRecipientsPerCampaign: 10000,
        maxActiveSessions: 3,
        features: {
            analyticsAccess: true,
            prioritySupport: false,
            customTemplates: false,
            apiAccess: false,
        },
    },
    {
        name: 'STARTER',
        billingCycle: 'YEARLY',
        price: 290,
        creditsIncluded: 60000,
        maxCampaignsPerMonth: 100,
        maxRecipientsPerCampaign: 10000,
        maxActiveSessions: 3,
        features: {
            analyticsAccess: true,
            prioritySupport: false,
            customTemplates: false,
            apiAccess: false,
        },
    },

    // ─── PRO ────────────────────────────────────────────
    {
        name: 'PRO',
        billingCycle: 'MONTHLY',
        price: 99,
        creditsIncluded: 20000,
        maxCampaignsPerMonth: 500,
        maxRecipientsPerCampaign: 50000,
        maxActiveSessions: 5,
        features: {
            analyticsAccess: true,
            prioritySupport: true,
            customTemplates: true,
            apiAccess: false,
        },
    },
    {
        name: 'PRO',
        billingCycle: 'YEARLY',
        price: 990,
        creditsIncluded: 240000,
        maxCampaignsPerMonth: 500,
        maxRecipientsPerCampaign: 50000,
        maxActiveSessions: 5,
        features: {
            analyticsAccess: true,
            prioritySupport: true,
            customTemplates: true,
            apiAccess: false,
        },
    },

    // ─── ENTERPRISE ─────────────────────────────────────
    {
        name: 'ENTERPRISE',
        billingCycle: 'MONTHLY',
        price: 249,
        creditsIncluded: 100000,
        maxCampaignsPerMonth: 2000,
        maxRecipientsPerCampaign: 500000,
        maxActiveSessions: null, // unlimited
        features: {
            analyticsAccess: true,
            prioritySupport: true,
            customTemplates: true,
            apiAccess: true,
        },
    },
    {
        name: 'ENTERPRISE',
        billingCycle: 'YEARLY',
        price: 2490,
        creditsIncluded: 1200000,
        maxCampaignsPerMonth: 2000,
        maxRecipientsPerCampaign: 500000,
        maxActiveSessions: null, // unlimited
        features: {
            analyticsAccess: true,
            prioritySupport: true,
            customTemplates: true,
            apiAccess: true,
        },
    },

    // ─── MASTER (internal — admin only) ─────────────────
    {
        name: 'MASTER',
        billingCycle: 'LIFETIME',
        price: 0,
        creditsIncluded: null,
        maxCampaignsPerMonth: null,
        maxRecipientsPerCampaign: null,
        maxActiveSessions: null, // unlimited
        features: {
            analyticsAccess: true,
            prioritySupport: true,
            customTemplates: true,
            apiAccess: true,
        },
        isInternal: true,
    },
];


// ─── Admin seed config (override via .env) ────────────
const ADMIN_NAME = process.env.ADMIN_NAME;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// ═══════════════════════════════════════════════════════
(async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.\n');

        // ── 1. Seed plans ───────────────────────────────
        await Plan.deleteMany({});
        const insertedPlans = await Plan.insertMany(plans);
        console.log(`✓ Seeded ${insertedPlans.length} plans:`);
        insertedPlans.forEach((p) =>
            console.log(`    • ${p.name} (${p.billingCycle}) — ${p.price}/period` +
                (p.isInternal ? '  [INTERNAL]' : ''))
        );

        // ── 2. Seed admin user ──────────────────────────
        const masterPlan = insertedPlans.find((p) => p.name === 'MASTER');

        // Remove existing admin so the seed is idempotent
        await User.deleteOne({ email: ADMIN_EMAIL });

        // Pass plain password — the pre('save') hook hashes it automatically
        const admin = await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'ADMIN',
            isVerified: true,
            subscription: {
                planId: masterPlan._id,
                billingCycle: 'LIFETIME',
                startedAt: new Date(),
                expiresAt: null,         // never expires
                isActive: true,
            },
            credits: {
                balance: 0,            // irrelevant — hasUnlimitedAccess() bypasses balance checks
                lastRefilled: new Date(),
            },
        });

        console.log(`\n✓ Admin user seeded:`);
        console.log(`    • Name  : ${admin.name}`);
        console.log(`    • Email : ${admin.email}`);
        console.log(`    • Role  : ${admin.role}`);
        console.log(`    • Plan  : MASTER (LIFETIME)`);
        console.log(`\n  ⚡ Change ADMIN_EMAIL / ADMIN_PASSWORD in .env before deploying!\n`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
})();