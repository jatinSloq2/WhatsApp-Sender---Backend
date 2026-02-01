import { ApiError } from '../middleware/errorHandler.js';
import CreditTransaction from '../models/creditTransaction.model.js';
import Plan from '../models/plan.model.js';
import User from '../models/user.model.js';

// ─── helper: add months or years to a date ────────────
const addPeriod = (from, cycle) => {
    const d = new Date(from);
    cycle === 'YEARLY' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
    return d;
};

// ═══════════════════════════════════════════════════════
// GET /api/plans               — list all active plans
// ═══════════════════════════════════════════════════════
export const listPlans = async (_req, res) => {
    // isInternal plans (e.g. MASTER) are never shown publicly
    const plans = await Plan.find({ isActive: true, isInternal: { $ne: true } }).sort({ price: 1 });
    res.json({ success: true, data: plans });
};

// ═══════════════════════════════════════════════════════
// GET /api/plans/:planId
// ═══════════════════════════════════════════════════════
export const getPlan = async (req, res) => {
    const plan = await Plan.findById(req.params.planId);
    if (!plan) throw new ApiError(404, 'Plan not found.');
    res.json({ success: true, data: plan });
};

// ═══════════════════════════════════════════════════════
// POST /api/plans/subscribe     — pick a plan + billing cycle
// Body: { planId, billingCycle }
// ═══════════════════════════════════════════════════════
export const subscribeToPlan = async (req, res) => {
    const { planId, billingCycle } = req.body;

    if (!planId || !billingCycle) {
        throw new ApiError(400, 'planId and billingCycle are required.');
    }

    // ── Admins already have MASTER — block re-subscription ──
    if (req.user.role === 'ADMIN') {
        throw new ApiError(403, 'Admin accounts are on the MASTER plan and cannot change subscriptions.');
    }

    const plan = await Plan.findOne({ _id: planId, billingCycle, isActive: true });
    if (!plan) {
        throw new ApiError(404, 'Plan not found or not available for this billing cycle.');
    }

    // ── Regular users cannot subscribe to internal plans ──
    if (plan.isInternal) {
        throw new ApiError(403, 'This plan is not available for purchase.');
    }

    const user = await User.findById(req.user._id);

    // ── If already on the same plan, reject ──
    if (
        user.subscription.planId?.toString() === plan._id.toString() &&
        user.subscription.isActive
    ) {
        throw new ApiError(409, 'You are already on this plan.');
    }

    // ── TODO: integrate payment gateway (Stripe, etc.) here ──

    const now = new Date();

    user.subscription = {
        planId: plan._id,
        billingCycle: plan.billingCycle,
        startedAt: now,
        expiresAt: addPeriod(now, plan.billingCycle),
        isActive: true,
    };

    // ── Refill credits only if plan has a finite amount ──
    if (plan.creditsIncluded !== null) {
        user.credits.balance += plan.creditsIncluded;
        user.credits.lastRefilled = now;

        await CreditTransaction.create({
            userId: user._id,
            type: 'PLAN_REFILL',
            amount: plan.creditsIncluded,
            balanceAfter: user.credits.balance,
            meta: { planId: plan._id, note: `Subscribed to ${plan.name} (${plan.billingCycle})` },
        });
    }

    await user.save();

    res.json({
        success: true,
        message: `Subscribed to ${plan.name} (${plan.billingCycle}).`,
        data: {
            subscription: user.subscription,
            creditsBalance: user.credits.balance,
        },
    });
};

// ═══════════════════════════════════════════════════════
// POST /api/plans/cancel
// ═══════════════════════════════════════════════════════
export const cancelSubscription = async (req, res) => {
    // ── Admins cannot cancel MASTER ──
    if (req.user.role === 'ADMIN') {
        throw new ApiError(403, 'The MASTER plan cannot be cancelled.');
    }

    const user = await User.findById(req.user._id);

    if (!user.subscription.isActive) {
        throw new ApiError(400, 'You do not have an active subscription to cancel.');
    }

    // Mark inactive; keep expiresAt so credits remain usable until then
    user.subscription.isActive = false;
    await user.save();

    res.json({
        success: true,
        message: 'Subscription cancelled. It will remain active until the current period ends.',
        data: { expiresAt: user.subscription.expiresAt },
    });
};