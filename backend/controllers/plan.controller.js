import { ApiError } from '../middleware/errorHandler.js';
import CreditTransaction from '../models/creditTransaction.model.js';
import Plan from '../models/plan.model.js';
import User from '../models/user.model.js';
import PaymentRequest from '../models/paymentRequest.model.js';

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

const addPeriod = (from, cycle) => {
    const d = new Date(from);
    cycle === 'YEARLY' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
    return d;
};

// ═══════════════════════════════════════════════════════
// POST /api/plans/subscribe-manual
// Submit payment proof for manual verification
// ═══════════════════════════════════════════════════════
export const subscribeManual = async (req, res) => {
    const { planId, billingCycle, amount, transactionId, isFree } = req.body;

    if (!planId || !billingCycle) {
        throw new ApiError(400, 'planId and billingCycle are required.');
    }

    // Prevent admin from subscribing
    if (req.user.role === 'ADMIN') {
        throw new ApiError(403, 'Admin accounts cannot subscribe to plans.');
    }

    const plan = await Plan.findOne({ _id: planId, billingCycle, isActive: true });
    if (!plan) {
        throw new ApiError(404, 'Plan not found or not available for this billing cycle.');
    }

    if (plan.isInternal) {
        throw new ApiError(403, 'This plan is not available for purchase.');
    }

    const user = await User.findById(req.user._id);

    // Check if already on the same plan
    if (
        user.subscription.planId?.toString() === plan._id.toString() &&
        user.subscription.isActive
    ) {
        throw new ApiError(409, 'You are already on this plan.');
    }

    // ─── Handle FREE plan (immediate activation) ──────────
    if (plan.price === 0 || isFree === 'true') {
        const now = new Date();

        user.subscription = {
            planId: plan._id,
            billingCycle: plan.billingCycle,
            startedAt: now,
            expiresAt: addPeriod(now, plan.billingCycle),
            isActive: true,
        };

        // Add credits
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

        return res.json({
            success: true,
            message: `Subscribed to ${plan.name} (${plan.billingCycle}).`,
            data: {
                subscription: user.subscription,
                creditsBalance: user.credits.balance,
            },
        });
    }

    // ─── Handle PAID plan (requires verification) ─────────
    if (!amount || !transactionId) {
        throw new ApiError(400, 'Amount and transaction ID are required for paid plans.');
    }

    if (!req.file) {
        throw new ApiError(400, 'Payment proof screenshot is required.');
    }

    // Calculate expected amount with GST
    const baseAmount = plan.price;
    const gstRate = 0.18;
    const gstAmount = Math.round(baseAmount * gstRate);
    const expectedAmount = baseAmount + gstAmount;

    // Verify amount matches
    if (parseFloat(amount) !== expectedAmount) {
        throw new ApiError(400, `Amount mismatch. Expected ₹${expectedAmount} but received ₹${amount}.`);
    }

    // Check if transaction ID already exists
    const existingRequest = await PaymentRequest.findOne({ transactionId });
    if (existingRequest) {
        throw new ApiError(409, 'This transaction ID has already been submitted.');
    }

    // Create payment request
    const paymentRequest = await PaymentRequest.create({
        userId: user._id,
        planId: plan._id,
        billingCycle: plan.billingCycle,
        amount: expectedAmount,
        baseAmount,
        gstAmount,
        transactionId,
        paymentProof: req.file.path, // Multer stores file path
        status: 'PENDING',
    });

    // Send notification email (TODO: implement email service)
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Payment Verification in Progress',
    //   template: 'payment-submitted',
    //   data: { userName: user.name, planName: plan.name, amount: expectedAmount }
    // });

    res.json({
        success: true,
        message: 'Payment proof submitted successfully. We will verify and activate your plan within 24 hours.',
        data: {
            requestId: paymentRequest._id,
            status: paymentRequest.status,
            estimatedVerificationTime: '24 hours',
        },
    });
};

// ═══════════════════════════════════════════════════════
// GET /api/plans/pending-payments (ADMIN only)
// List all pending payment requests
// ═══════════════════════════════════════════════════════
export const getPendingPayments = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Only admins can view pending payments.');
    }

    const requests = await PaymentRequest.find({ status: 'PENDING' })
        .populate('userId', 'name email')
        .populate('planId', 'name billingCycle price')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: requests,
    });
};

// ═══════════════════════════════════════════════════════
// POST /api/plans/verify-payment/:requestId (ADMIN only)
// Approve or reject a payment request
// ═══════════════════════════════════════════════════════
export const verifyPayment = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Only admins can verify payments.');
    }

    const { requestId } = req.params;
    const { action, reason } = req.body; // action: 'APPROVE' or 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
        throw new ApiError(400, 'Action must be either APPROVE or REJECT.');
    }

    const paymentRequest = await PaymentRequest.findById(requestId)
        .populate('userId')
        .populate('planId');

    if (!paymentRequest) {
        throw new ApiError(404, 'Payment request not found.');
    }

    if (paymentRequest.status !== 'PENDING') {
        throw new ApiError(400, 'This payment request has already been processed.');
    }

    if (action === 'APPROVE') {
        // ─── Approve payment and activate subscription ────
        const user = await User.findById(paymentRequest.userId._id);
        const plan = paymentRequest.planId;
        const now = new Date();

        user.subscription = {
            planId: plan._id,
            billingCycle: paymentRequest.billingCycle,
            startedAt: now,
            expiresAt: addPeriod(now, paymentRequest.billingCycle),
            isActive: true,
        };

        // Add credits
        if (plan.creditsIncluded !== null) {
            user.credits.balance += plan.creditsIncluded;
            user.credits.lastRefilled = now;

            await CreditTransaction.create({
                userId: user._id,
                type: 'PLAN_REFILL',
                amount: plan.creditsIncluded,
                balanceAfter: user.credits.balance,
                meta: {
                    planId: plan._id,
                    note: `Subscribed to ${plan.name} (${paymentRequest.billingCycle})`,
                    paymentRequestId: paymentRequest._id,
                    transactionId: paymentRequest.transactionId,
                },
            });
        }

        await user.save();

        // Update payment request
        paymentRequest.status = 'APPROVED';
        paymentRequest.verifiedBy = req.user._id;
        paymentRequest.verifiedAt = now;
        await paymentRequest.save();

        // Send success email
        // await sendEmail({
        //   to: user.email,
        //   subject: 'Payment Verified - Subscription Activated!',
        //   template: 'payment-approved',
        //   data: { userName: user.name, planName: plan.name, credits: plan.creditsIncluded }
        // });

        res.json({
            success: true,
            message: 'Payment approved and subscription activated.',
            data: {
                userId: user._id,
                subscription: user.subscription,
                creditsBalance: user.credits.balance,
            },
        });
    } else {
        // ─── Reject payment ───────────────────────────────
        paymentRequest.status = 'REJECTED';
        paymentRequest.rejectionReason = reason || 'Payment verification failed';
        paymentRequest.verifiedBy = req.user._id;
        paymentRequest.verifiedAt = new Date();
        await paymentRequest.save();

        // Send rejection email
        // await sendEmail({
        //   to: paymentRequest.userId.email,
        //   subject: 'Payment Verification Issue',
        //   template: 'payment-rejected',
        //   data: {
        //     userName: paymentRequest.userId.name,
        //     reason: paymentRequest.rejectionReason
        //   }
        // });

        res.json({
            success: true,
            message: 'Payment request rejected.',
            data: {
                requestId: paymentRequest._id,
                reason: paymentRequest.rejectionReason,
            },
        });
    }
};

// ═══════════════════════════════════════════════════════
// GET /api/plans/my-payment-requests
// Get user's own payment requests
// ═══════════════════════════════════════════════════════
export const getMyPaymentRequests = async (req, res) => {
    const requests = await PaymentRequest.find({ userId: req.user._id })
        .populate('planId', 'name billingCycle price')
        .sort({ createdAt: -1 })
        .limit(10);

    res.json({
        success: true,
        data: requests,
    });
};