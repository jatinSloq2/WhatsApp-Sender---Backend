import { ApiError } from '../middleware/errorHandler.js';
import CreditTransaction from '../models/creditTransaction.model.js';
import User from '../models/user.model.js';

// ─── Credit pack options (configurable) ───────────────
// Prices are in USD; adjust as needed.
const CREDIT_PACKS = [
    { id: 'pack_100', credits: 100, price: 5.00 },
    { id: 'pack_500', credits: 500, price: 20.00 },
    { id: 'pack_1000', credits: 1000, price: 35.00 },
    { id: 'pack_5000', credits: 5000, price: 150.00 },
];

// ═══════════════════════════════════════════════════════
// GET /api/credits/packs        — list available packs
// ═══════════════════════════════════════════════════════
export const listCreditPacks = async (_req, res) => {
    res.json({ success: true, data: CREDIT_PACKS });
};

// ═══════════════════════════════════════════════════════
// POST /api/credits/buy         — purchase a credit pack
// Body: { packId }
// ═══════════════════════════════════════════════════════
export const buyCreditPack = async (req, res) => {
    const { packId } = req.body;

    if (!packId) {
        throw new ApiError(400, 'packId is required.');
    }

    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
        throw new ApiError(400, 'Invalid credit pack.');
    }

    // ── TODO: integrate payment gateway here ──
    // e.g. create a Stripe PaymentIntent, charge the user, get paymentId on success.
    // For now we assume payment succeeds and use a placeholder paymentId.
    const paymentId = `pay_placeholder_${Date.now()}`;

    const user = await User.findById(req.user._id);
    user.credits.balance += pack.credits;
    await user.save();

    // ── Log transaction ──
    await CreditTransaction.create({
        userId: user._id,
        type: 'PURCHASE',
        amount: pack.credits,
        balanceAfter: user.credits.balance,
        meta: {
            paymentId,
            note: `Purchased ${pack.credits} credits for $${pack.price.toFixed(2)}`,
        },
    });

    res.json({
        success: true,
        message: `${pack.credits} credits purchased.`,
        data: { creditsBalance: user.credits.balance },
    });
};

// ═══════════════════════════════════════════════════════
// GET /api/credits/balance
// ═══════════════════════════════════════════════════════
export const getBalance = async (req, res) => {
    const user = await User.findById(req.user._id).select('credits');
    res.json({ success: true, data: { creditsBalance: user.credits.balance } });
};

// ═══════════════════════════════════════════════════════
// GET /api/credits/history      — paginated transaction log
// Query: ?page=1&limit=20
// ═══════════════════════════════════════════════════════
export const getCreditHistory = async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
        CreditTransaction.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('meta.planId', 'name billingCycle'),
        CreditTransaction.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
        success: true,
        data: transactions,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
};