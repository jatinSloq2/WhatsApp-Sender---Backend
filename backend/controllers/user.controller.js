import User from '../models/user.model.js';
import Plan from '../models/plan.model.js';
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
// PUT /api/user/update-password
// ═══════════════════════════════════════════════════════
export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validation
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required.');
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, 'New password must be at least 8 characters.');
  }

  // Get user with password field
  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  // Check if new password is different from current
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new ApiError(400, 'New password must be different from current password.');
  }

  // Update password (will be hashed by the pre-save hook)
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully.',
  });
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