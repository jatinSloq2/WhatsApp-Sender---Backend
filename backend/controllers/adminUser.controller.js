import { ApiError } from '../middleware/errorHandler.js';
import User from '../models/user.model.js';
import Plan from '../models/plan.model.js';
import CreditTransaction from '../models/creditTransaction.model.js';

// ═══════════════════════════════════════════════════════
// GET /api/admin/users
// Get all users with their details
// ═══════════════════════════════════════════════════════
export const getAllUsers = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Only admins can view all users.');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    const searchQuery = search
        ? {
              $or: [
                  { name: { $regex: search, $options: 'i' } },
                  { email: { $regex: search, $options: 'i' } },
              ],
          }
        : {};

    const [users, total] = await Promise.all([
        User.find(searchQuery)
            .select('name email role credits subscription createdAt lastLogin')
            .populate('subscription.planId', 'name billingCycle price creditsIncluded')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        User.countDocuments(searchQuery),
    ]);

    res.json({
        success: true,
        data: users,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
};

// ═══════════════════════════════════════════════════════
// GET /api/admin/users/:userId
// Get single user details
// ═══════════════════════════════════════════════════════
export const getUserDetails = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Only admins can view user details.');
    }

    const user = await User.findById(req.params.userId)
        .populate('subscription.planId', 'name billingCycle price creditsIncluded features');

    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    // Get recent credit transactions
    const recentTransactions = await CreditTransaction.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('meta.planId', 'name billingCycle');

    res.json({
        success: true,
        data: {
            user,
            recentTransactions,
        },
    });
};

// ═══════════════════════════════════════════════════════
// POST /api/admin/users/:userId/add-credits
// Manually add credits to a user
// Body: { amount, note }
// ═══════════════════════════════════════════════════════
export const addCreditsManually = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Only admins can add credits manually.');
    }

    const { amount, note } = req.body;
    const { userId } = req.params;

    if (!amount || amount <= 0) {
        throw new ApiError(400, 'Amount must be a positive number.');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    // Add credits
    const creditsToAdd = parseInt(amount, 10);
    user.credits.balance += creditsToAdd;
    user.credits.lastRefilled = new Date();
    await user.save();

    // Create transaction record
    await CreditTransaction.create({
        userId: user._id,
        type: 'ADMIN_MANUAL',
        amount: creditsToAdd,
        balanceAfter: user.credits.balance,
        meta: {
            note: note || 'Credits added manually by admin',
            addedBy: req.user._id,
            addedByEmail: req.user.email,
        },
    });

    res.json({
        success: true,
        message: `Successfully added ${creditsToAdd} credits to ${user.name}`,
        data: {
            userId: user._id,
            userName: user.name,
            creditsAdded: creditsToAdd,
            newBalance: user.credits.balance,
        },
    });
};

// ═══════════════════════════════════════════════════════
// POST /api/admin/users/:userId/assign-plan
// Manually assign a plan to a user
// Body: { planId, billingCycle, note }
// ═══════════════════════════════════════════════════════
export const assignPlanManually = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Only admins can assign plans manually.');
    }

    const { planId, billingCycle, note } = req.body;
    const { userId } = req.params;

    if (!planId || !billingCycle) {
        throw new ApiError(400, 'planId and billingCycle are required.');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    const plan = await Plan.findOne({ _id: planId, billingCycle });
    if (!plan) {
        throw new ApiError(404, 'Plan not found or not available for this billing cycle.');
    }

    const now = new Date();
    const addPeriod = (from, cycle) => {
        const d = new Date(from);
        cycle === 'YEARLY' ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1);
        return d;
    };

    // Assign plan
    user.subscription = {
        planId: plan._id,
        billingCycle: plan.billingCycle,
        startedAt: now,
        expiresAt: addPeriod(now, plan.billingCycle),
        isActive: true,
    };

    // Add credits if plan includes them
    if (plan.creditsIncluded !== null) {
        user.credits.balance += plan.creditsIncluded;
        user.credits.lastRefilled = now;

        await CreditTransaction.create({
            userId: user._id,
            type: 'ADMIN_MANUAL',
            amount: plan.creditsIncluded,
            balanceAfter: user.credits.balance,
            meta: {
                planId: plan._id,
                note: note || `Plan assigned manually by admin: ${plan.name} (${plan.billingCycle})`,
                addedBy: req.user._id,
                addedByEmail: req.user.email,
            },
        });
    }

    await user.save();

    res.json({
        success: true,
        message: `Successfully assigned ${plan.name} (${plan.billingCycle}) to ${user.name}`,
        data: {
            userId: user._id,
            userName: user.name,
            subscription: user.subscription,
            creditsBalance: user.credits.balance,
        },
    });
};

// ═══════════════════════════════════════════════════════
// POST /api/admin/users/:userId/deduct-credits
// Manually deduct credits from a user
// Body: { amount, note }
// ═══════════════════════════════════════════════════════
export const deductCreditsManually = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Only admins can deduct credits manually.');
    }

    const { amount, note } = req.body;
    const { userId } = req.params;

    if (!amount || amount <= 0) {
        throw new ApiError(400, 'Amount must be a positive number.');
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    const creditsToDeduct = parseInt(amount, 10);

    if (user.credits.balance < creditsToDeduct) {
        throw new ApiError(400, `User only has ${user.credits.balance} credits. Cannot deduct ${creditsToDeduct}.`);
    }

    // Deduct credits
    user.credits.balance -= creditsToDeduct;
    await user.save();

    // Create transaction record (negative amount)
    await CreditTransaction.create({
        userId: user._id,
        type: 'ADMIN_MANUAL',
        amount: -creditsToDeduct,
        balanceAfter: user.credits.balance,
        meta: {
            note: note || 'Credits deducted manually by admin',
            addedBy: req.user._id,
            addedByEmail: req.user.email,
        },
    });

    res.json({
        success: true,
        message: `Successfully deducted ${creditsToDeduct} credits from ${user.name}`,
        data: {
            userId: user._id,
            userName: user.name,
            creditsDeducted: creditsToDeduct,
            newBalance: user.credits.balance,
        },
    });
};

// ═══════════════════════════════════════════════════════
// POST /api/admin/users/:userId/cancel-subscription
// Manually cancel a user's subscription
// Body: { note }
// ═══════════════════════════════════════════════════════
export const cancelUserSubscription = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Only admins can cancel user subscriptions.');
    }

    const { note } = req.body;
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found.');
    }

    if (!user.subscription.isActive) {
        throw new ApiError(400, 'User does not have an active subscription.');
    }

    // Mark subscription as inactive
    user.subscription.isActive = false;
    await user.save();

    res.json({
        success: true,
        message: `Successfully cancelled subscription for ${user.name}`,
        data: {
            userId: user._id,
            userName: user.name,
            expiresAt: user.subscription.expiresAt,
            note: note || 'Subscription cancelled manually by admin',
        },
    });
};

// ═══════════════════════════════════════════════════════
// GET /api/admin/stats
// Get admin dashboard statistics
// ═══════════════════════════════════════════════════════
export const getAdminStats = async (req, res) => {
    if (req.user.role !== 'ADMIN') {
        throw new ApiError(403, 'Only admins can view stats.');
    }

    const [
        totalUsers,
        activeSubscriptions,
        totalCreditsInCirculation,
        usersCreatedToday,
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ 'subscription.isActive': true }),
        User.aggregate([
            { $group: { _id: null, total: { $sum: '$credits.balance' } } },
        ]),
        User.countDocuments({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
        }),
    ]);

    res.json({
        success: true,
        data: {
            totalUsers,
            activeSubscriptions,
            totalCreditsInCirculation: totalCreditsInCirculation[0]?.total || 0,
            usersCreatedToday,
        },
    });
};