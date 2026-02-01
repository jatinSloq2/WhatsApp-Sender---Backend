import User from '../models/user.model.js';
import { ApiError } from '../middleware/errorHandler.js';

// ═══════════════════════════════════════════════════════
// GET /api/user/me
// ═══════════════════════════════════════════════════════
export const getProfile = async (req, res) => {
  // req.user already populated by authenticate middleware
  const user = await User.findById(req.user._id)
    .populate('subscription.planId', 'name billingCycle price creditsIncluded features');

  res.json({ success: true, data: user });
};

// ═══════════════════════════════════════════════════════
// PUT /api/user/me
// ═══════════════════════════════════════════════════════
export const updateProfile = async (req, res) => {
  const allowed = ['name'];                          // only these fields can be updated here
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });

  if (Object.keys(updates).length === 0) {
    throw new ApiError(400, 'No valid fields to update.');
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).populate('subscription.planId', 'name billingCycle price creditsIncluded features');

  res.json({ success: true, data: user });
};

// ═══════════════════════════════════════════════════════
// GET /api/user/subscription
// ═══════════════════════════════════════════════════════
export const getSubscriptionStatus = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('subscription.planId');

  const sub = user.subscription;
  const isActive = user.hasActiveSubscription();

  res.json({
    success: true,
    data: {
      plan:          sub.planId,
      billingCycle:  sub.billingCycle,
      startedAt:     sub.startedAt,
      expiresAt:     sub.expiresAt,
      isActive,
      creditsBalance: user.credits.balance,
      campaignsUsedThisMonth: user.campaignsUsedThisMonth,
    },
  });
};