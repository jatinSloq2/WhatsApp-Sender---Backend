import 'dotenv/config';
import mongoose from 'mongoose';
import Plan from '../models/plan.model.js';
import User from '../models/user.model.js';

// ─── Plan definitions ─────────────────────────────────
const plans = [
    // ─── FREE ───────────────────────────────────────────
    {
        name: 'FREE', billingCycle: 'MONTHLY', price: 0,
        creditsIncluded: 50, maxCampaignsPerMonth: 2, maxRecipientsPerCampaign: 100,
        features: { analyticsAccess: false, prioritySupport: false, customTemplates: false, apiAccess: false },
    },
    // ─── STARTER ────────────────────────────────────────
    {
        name: 'STARTER', billingCycle: 'MONTHLY', price: 19,
        creditsIncluded: 500, maxCampaignsPerMonth: 10, maxRecipientsPerCampaign: 1000,
        features: { analyticsAccess: true, prioritySupport: false, customTemplates: false, apiAccess: false },
    },
    {
        name: 'STARTER', billingCycle: 'YEARLY', price: 190,
        creditsIncluded: 6000, maxCampaignsPerMonth: 10, maxRecipientsPerCampaign: 1000,
        features: { analyticsAccess: true, prioritySupport: false, customTemplates: false, apiAccess: false },
    },
    // ─── PRO ────────────────────────────────────────────
    {
        name: 'PRO', billingCycle: 'MONTHLY', price: 49,
        creditsIncluded: 2000, maxCampaignsPerMonth: 50, maxRecipientsPerCampaign: 5000,
        features: { analyticsAccess: true, prioritySupport: true, customTemplates: true, apiAccess: false },
    },
    {
        name: 'PRO', billingCycle: 'YEARLY', price: 490,
        creditsIncluded: 24000, maxCampaignsPerMonth: 50, maxRecipientsPerCampaign: 5000,
        features: { analyticsAccess: true, prioritySupport: true, customTemplates: true, apiAccess: false },
    },
    // ─── ENTERPRISE ─────────────────────────────────────
    {
        name: 'ENTERPRISE', billingCycle: 'MONTHLY', price: 149,
        creditsIncluded: 10000, maxCampaignsPerMonth: 200, maxRecipientsPerCampaign: 50000,
        features: { analyticsAccess: true, prioritySupport: true, customTemplates: true, apiAccess: true },
    },
    {
        name: 'ENTERPRISE', billingCycle: 'YEARLY', price: 1490,
        creditsIncluded: 120000, maxCampaignsPerMonth: 200, maxRecipientsPerCampaign: 50000,
        features: { analyticsAccess: true, prioritySupport: true, customTemplates: true, apiAccess: true },
    },
    // ─── MASTER (internal — admin only) ─────────────────
    {
        name: 'MASTER',
        billingCycle: 'LIFETIME',
        price: 0,
        creditsIncluded: null,
        maxCampaignsPerMonth: null,
        maxRecipientsPerCampaign: null,
        features: { analyticsAccess: true, prioritySupport: true, customTemplates: true, apiAccess: true },
        isInternal: true,
    },
];

// ─── Admin seed config (override via .env) ────────────
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@yourapp.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@12345';

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
            console.log(`    • ${p.name} (${p.billingCycle}) — $${p.price}/period` +
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