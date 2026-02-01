import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        // ─── Role ───────────────────────────────────────
        role: {
            type: String,
            required: true,
            enum: ['USER', 'ADMIN'],
            default: 'USER',
        },

        // ─── Identity ───────────────────────────────────
        name:  { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },   // never returned by default

        // ─── Subscription ───────────────────────────────
        subscription: {
            planId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
            billingCycle: { type: String, enum: ['MONTHLY', 'YEARLY', 'LIFETIME'], default: null }, // ← LIFETIME added
            startedAt:    { type: Date, default: null },
            expiresAt:    { type: Date, default: null },   // null = never expires (MASTER/LIFETIME)
            isActive:     { type: Boolean, default: false },
        },

        // ─── Credits ────────────────────────────────────
        credits: {
            balance:      { type: Number, default: 0, min: 0 },
            lastRefilled: { type: Date, default: null },
        },

        // ─── Campaigns usage (rolling monthly counter) ─
        campaignsUsedThisMonth: { type: Number, default: 0 },
        campaignsMonthReset:    { type: Date, default: null },

        // ─── Auth flags ─────────────────────────────────
        isVerified:             { type: Boolean, default: false },
        emailVerifyToken:       { type: String, select: false, default: null },
        emailVerifyExp:         { type: Date,   select: false, default: null },
        passwordResetToken:     { type: String, select: false, default: null },
        passwordResetExp:       { type: Date,   select: false, default: null },
    },
    { timestamps: true }
);

// ─── Pre-save: hash password ────────────────────────
// Modern Mongoose supports returning a promise directly —
// no need for the `next` callback.
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// ─── Instance method: compare password ──────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// ─── Instance method: check if subscription is live ─
userSchema.methods.hasActiveSubscription = function () {
    // expiresAt === null means LIFETIME (never expires)
    if (this.subscription.expiresAt === null && this.subscription.isActive) return true;
    return this.subscription.isActive && this.subscription.expiresAt > new Date();
};

// ─── Instance method: admin or MASTER plan = unlimited ─
userSchema.methods.hasUnlimitedAccess = function () {
    return this.role === 'ADMIN';
};

export default mongoose.model('User', userSchema);