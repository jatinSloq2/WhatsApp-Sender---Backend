import { ApiError } from '../middleware/errorHandler.js';
import CreditPurchaseRequest from '../models/creditPurchaseRequest.model.js';
import CreditTransaction from '../models/creditTransaction.model.js';
import User from '../models/user.model.js';

// ─── Preset packs ─────────────────────────────────────
const CREDIT_PACKS = [
  { id: 'pack_100',  credits: 100,  price: 99   },
  { id: 'pack_500',  credits: 500,  price: 399  },
  { id: 'pack_1000', credits: 1000, price: 699  },
  { id: 'pack_5000', credits: 5000, price: 2499 },
];

// ─── Custom-amount tiers (must stay in sync with frontend) ─
const CUSTOM_RATE_TIERS = [
  { min: 1,    max: 100,   rate: 0.99 },
  { min: 101,  max: 500,   rate: 0.80 },
  { min: 501,  max: 1000,  rate: 0.70 },
  { min: 1001, max: 10000, rate: 0.50 },
];
const CUSTOM_MIN = 50;
const CUSTOM_MAX = 10000;

const GST_RATE = 0.18;

// ─── helpers ──────────────────────────────────────────
/** Blended base price for N credits using tiered rates */
function calcCustomPrice(credits) {
  let total     = 0;
  let remaining = credits;

  for (const tier of CUSTOM_RATE_TIERS) {
    if (remaining <= 0) break;
    const chunkStart  = credits - remaining;           // how many already priced
    const tierStart   = tier.min - 1;                  // 0-based start of this tier
    const tierEnd     = tier.max;                      // 0-based end (inclusive)

    if (chunkStart >= tierEnd) continue;               // already past this tier

    const effectiveStart = Math.max(chunkStart, tierStart);
    const chunkInTier    = Math.min(tierEnd, credits) - effectiveStart;

    if (chunkInTier > 0) {
      total     += chunkInTier * tier.rate;
      remaining -= chunkInTier;
    }
  }
  return Math.round(total);                            // whole rupee, matches frontend
}

/** Return a preset pack or null */
const findPack = (packId) => CREDIT_PACKS.find((p) => p.id === packId);

// ═══════════════════════════════════════════════════════
// GET /api/credits/packs
// ═══════════════════════════════════════════════════════
export const listCreditPacks = async (_req, res) => {
  const packs = CREDIT_PACKS.map((p) => {
    const gstAmount   = Math.round(p.price * GST_RATE);
    return { ...p, gstAmount, totalAmount: p.price + gstAmount };
  });
  res.json({ success: true, data: packs });
};

// ═══════════════════════════════════════════════════════
// GET /api/credits/balance
// ═══════════════════════════════════════════════════════
export const getBalance = async (req, res) => {
  const user = await User.findById(req.user._id).select('credits');
  res.json({ success: true, data: { creditsBalance: user.credits.balance } });
};

// ═══════════════════════════════════════════════════════
// GET /api/credits/history
// ═══════════════════════════════════════════════════════
export const getCreditHistory = async (req, res) => {
  const page  = parseInt(req.query.page,  10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip  = (page - 1) * limit;

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
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
};

// ═══════════════════════════════════════════════════════
// POST /api/credits/buy-manual
// Body (multipart): packId, amount, transactionId, [credits]
// File : paymentProof
// ═══════════════════════════════════════════════════════
export const buyCreditPackManual = async (req, res) => {
  const { packId, amount, transactionId, credits: creditsRaw } = req.body;

  // ── basic guards ──
  if (!packId)                  throw new ApiError(400, 'packId is required.');
  if (!amount || !transactionId) throw new ApiError(400, 'Amount and transaction ID are required.');
  if (!req.file)                throw new ApiError(400, 'Payment proof screenshot is required.');

  // ── resolve credits & expected base amount ──
  let resolvedCredits, baseAmount;

  if (packId === 'pack_custom') {
    // ── CUSTOM path ──
    const credits = parseInt(creditsRaw, 10);
    if (isNaN(credits) || credits < CUSTOM_MIN || credits > CUSTOM_MAX)
      throw new ApiError(400, `Credits must be between ${CUSTOM_MIN} and ${CUSTOM_MAX}.`);

    resolvedCredits = credits;
    baseAmount      = calcCustomPrice(credits);
  } else {
    // ── PRESET path ──
    const pack = findPack(packId);
    if (!pack) throw new ApiError(400, 'Invalid credit pack.');
    resolvedCredits = pack.credits;
    baseAmount      = pack.price;
  }

  // ── amount verification (base + GST) ──
  const gstAmount   = Math.round(baseAmount * GST_RATE);
  const expectedAmt = baseAmount + gstAmount;

  if (parseFloat(amount) !== expectedAmt)
    throw new ApiError(400, `Amount mismatch. Expected ₹${expectedAmt} but received ₹${amount}.`);

  // ── duplicate txn guard ──
  const existing = await CreditPurchaseRequest.findOne({ transactionId: transactionId.trim() });
  if (existing) throw new ApiError(409, 'This transaction ID has already been submitted.');

  // ── persist ──
  const purchaseRequest = await CreditPurchaseRequest.create({
    userId:       req.user._id,
    packId,                                      // 'pack_custom' or 'pack_XXX'
    packCredits:   resolvedCredits,
    amount:        expectedAmt,
    baseAmount,
    gstAmount,
    transactionId: transactionId.trim(),
    paymentProof:  req.file.path,
    status:        'PENDING',
  });

  res.json({
    success: true,
    message: 'Payment proof submitted successfully. Credits will be added within 24 hours.',
    data: {
      requestId: purchaseRequest._id,
      status:    purchaseRequest.status,
      estimatedVerificationTime: '24 hours',
    },
  });
};

// ═══════════════════════════════════════════════════════
// GET /api/credits/my-purchase-requests
// ═══════════════════════════════════════════════════════
export const getMyPurchaseRequests = async (req, res) => {
  const requests = await CreditPurchaseRequest.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.json({ success: true, data: requests });
};

// ═══════════════════════════════════════════════════════
// GET /api/credits/pending-purchases   (ADMIN)
// ═══════════════════════════════════════════════════════
export const getPendingCreditPurchases = async (req, res) => {
  if (req.user.role !== 'ADMIN')
    throw new ApiError(403, 'Only admins can view pending credit purchases.');

  const requests = await CreditPurchaseRequest.find({ status: 'PENDING' })
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: requests });
};

// ═══════════════════════════════════════════════════════
// POST /api/credits/verify-purchase/:requestId   (ADMIN)
// Body: { action: 'APPROVE'|'REJECT', reason? }
// ═══════════════════════════════════════════════════════
export const verifyCreditPurchase = async (req, res) => {
  if (req.user.role !== 'ADMIN')
    throw new ApiError(403, 'Only admins can verify credit purchases.');

  const { requestId }      = req.params;
  const { action, reason } = req.body;

  if (!['APPROVE', 'REJECT'].includes(action))
    throw new ApiError(400, 'Action must be APPROVE or REJECT.');

  const purchaseRequest = await CreditPurchaseRequest.findById(requestId)
    .populate('userId');

  if (!purchaseRequest)
    throw new ApiError(404, 'Credit purchase request not found.');
  if (purchaseRequest.status !== 'PENDING')
    throw new ApiError(400, 'This request has already been processed.');

  const now = new Date();

  if (action === 'APPROVE') {
    const user = await User.findById(purchaseRequest.userId._id);
    user.credits.balance     += purchaseRequest.packCredits;
    user.credits.lastRefilled = now;
    await user.save();

    await CreditTransaction.create({
      userId:      user._id,
      type:         'PURCHASE',
      amount:       purchaseRequest.packCredits,
      balanceAfter: user.credits.balance,
      meta: {
        paymentRequestId: purchaseRequest._id,
        transactionId:    purchaseRequest.transactionId,
        note: `Purchased ${purchaseRequest.packCredits} credits${purchaseRequest.packId === 'pack_custom' ? ' (custom)' : ''} — verified`,
      },
    });

    purchaseRequest.status     = 'APPROVED';
    purchaseRequest.verifiedBy = req.user._id;
    purchaseRequest.verifiedAt = now;
    await purchaseRequest.save();

    return res.json({
      success: true,
      message: 'Credit purchase approved and credits added.',
      data: { userId: user._id, creditsAdded: purchaseRequest.packCredits, creditsBalance: user.credits.balance },
    });
  }

  // ── REJECT ──
  purchaseRequest.status          = 'REJECTED';
  purchaseRequest.rejectionReason = reason || 'Verification failed';
  purchaseRequest.verifiedBy      = req.user._id;
  purchaseRequest.verifiedAt      = now;
  await purchaseRequest.save();

  res.json({
    success: true,
    message: 'Credit purchase request rejected.',
    data: { requestId: purchaseRequest._id, reason: purchaseRequest.rejectionReason },
  });
};