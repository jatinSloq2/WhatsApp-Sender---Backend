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

        // ── 1. Upsert plans (by name + billingCycle) ─────
        for (const plan of plans) {
            await Plan.updateOne(
                {
                    name: plan.name,
                    billingCycle: plan.billingCycle,
                },
                {
                    $set: {
                        price: plan.price,
                        creditsIncluded: plan.creditsIncluded ?? null,
                        maxCampaignsPerMonth: plan.maxCampaignsPerMonth ?? null,
                        maxRecipientsPerCampaign: plan.maxRecipientsPerCampaign ?? null,
                        maxActiveSessions: plan.maxActiveSessions ?? null,
                        features: plan.features,
                        isInternal: plan.isInternal ?? false,
                        isActive: true,
                    },
                },
                { upsert: true }
            );
        }

        console.log(`✓ Plans upserted (${plans.length})`);

        // ── 2. Fetch MASTER plan safely ──────────────────
        const masterPlan = await Plan.findOne({
            name: 'MASTER',
            billingCycle: 'LIFETIME',
        });

        if (!masterPlan) {
            throw new Error('MASTER plan not found after seeding');
        }

        // ── 3. Upsert admin user ─────────────────────────
        const admin = await User.findOneAndUpdate(
            { email: ADMIN_EMAIL },
            {
                $set: {
                    name: ADMIN_NAME,
                    password: ADMIN_PASSWORD, // hashed via pre-save if changed
                    role: 'ADMIN',
                    isVerified: true,
                    subscription: {
                        planId: masterPlan._id,
                        billingCycle: 'LIFETIME',
                        startedAt: new Date(),
                        expiresAt: null,
                        isActive: true,
                    },
                    credits: {
                        balance: 0,
                        lastRefilled: new Date(),
                    },
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`\n✓ Admin user ready:`);
        console.log(`    • Name  : ${admin.name}`);
        console.log(`    • Email : ${admin.email}`);
        console.log(`    • Role  : ${admin.role}`);
        console.log(`    • Plan  : MASTER (LIFETIME)`);

        console.log(`\n⚡ Safe to re-run. No data loss.\n`);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
})();