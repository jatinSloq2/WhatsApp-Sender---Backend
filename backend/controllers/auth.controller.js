import crypto from 'crypto';
import { ApiError } from '../middleware/errorHandler.js';
import { generateOTP, otpExpiry } from '../utils/otp.utils.js';
import { sendOTPEmail } from '../utils/sendOTPEmail.js';
import User from '../models/user.model.js';
import {
    clearAuthCookies,
    setAuthCookies,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from '../utils/jwt.utils.js';

// ─── helpers ──────────────────────────────────────────
const sanitizeUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    subscription: user.subscription,
    credits: user.credits,
});

// ═══════════════════════════════════════════════════════
// POST /api/auth/register
// ═══════════════════════════════════════════════════════
export const register = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, 'name, email, and password are required.');
    }

    if (password.length < 8) {
        throw new ApiError(400, 'Password must be at least 8 characters.');
    }

    const existing = await User.findOne({ email });
    if (existing) {
        throw new ApiError(409, 'Email already registered.');
    }

    const otp = generateOTP();

    const user = await User.create({
        name,
        email,
        password,
        emailOTP: otp,
        emailOTPExp: otpExpiry(),
        isVerified: false,
    });

    await sendOTPEmail({
        email,
        name,
        otp,
    });


    res.status(201).json({
        success: true,
        message: 'OTP sent to email. Please verify.',
    });
};


// ═══════════════════════════════════════════════════════
// POST /api/auth/login
// ═══════════════════════════════════════════════════════
// POST /api/auth/login
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, 'email and password are required.');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        throw new ApiError(401, 'Invalid email or password.');
    }

    const otp = generateOTP();
    user.emailOTP = otp;
    user.emailOTPExp = otpExpiry();
    await user.save({ validateModifiedOnly: true });

    await sendOTPEmail({
        email: user.email,
        name: user.name,
        otp,
    });


    res.json({
        success: true,
        message: 'OTP sent to email.',
    });
};

// POST /api/auth/verify-otp
export const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new ApiError(400, 'email and otp are required.');
    }

    const user = await User.findOne({
        email,
        emailOTP: otp,
        emailOTPExp: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, 'OTP is invalid or expired.');
    }

    user.emailOTP = null;
    user.emailOTPExp = null;
    user.isVerified = true;
    await user.save({ validateModifiedOnly: true });

    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
        success: true,
        data: sanitizeUser(user),
    });
};


// POST /api/auth/resend-otp
export const resendOTP = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, 'email is required.');
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.json({ success: true });
    }

    const otp = generateOTP();
    user.emailOTP = otp;
    user.emailOTPExp = otpExpiry();
    await user.save({ validateModifiedOnly: true });


    await sendOTPEmail({
        email: user.email,
        name: user.name,
        otp,
    });
    res.json({
        success: true,
        message: 'OTP resent successfully.',
    });
};


// ═══════════════════════════════════════════════════════
// POST /api/auth/refresh   — reads refreshToken cookie
// ═══════════════════════════════════════════════════════
export const refreshToken = async (req, res) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
        throw new ApiError(401, 'No refresh token.');
    }

    let payload;
    try {
        payload = verifyRefreshToken(token);
    } catch {
        throw new ApiError(401, 'Refresh token invalid or expired.');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
        throw new ApiError(401, 'User not found.');
    }

    const newAccess = signAccessToken(user._id);
    const newRefresh = signRefreshToken(user._id);
    setAuthCookies(res, newAccess, newRefresh);

    res.json({ success: true, data: sanitizeUser(user) });
};

// ═══════════════════════════════════════════════════════
// POST /api/auth/logout
// ═══════════════════════════════════════════════════════
export const logout = async (_req, res) => {
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out.' });
};

// ═══════════════════════════════════════════════════════
// GET  /api/auth/verify-email/:token
// ═══════════════════════════════════════════════════════
export const verifyEmail = async (req, res) => {
    const { token } = req.params;

    const user = await User.findOne({
        emailVerifyToken: token,
        emailVerifyExp: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, 'Token is invalid or has expired.');
    }

    user.isVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExp = null;
    await user.save({ validateModifiedOnly: true });

    res.json({ success: true, message: 'Email verified.' });
};

// ═══════════════════════════════════════════════════════
// POST /api/auth/forgot-password
// ═══════════════════════════════════════════════════════
export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'email is required.');

    const user = await User.findOne({ email });
    // Always respond 200 — don't reveal whether email exists
    if (!user) {
        return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExp = Date.now() + 1 * 60 * 60 * 1000; // 1 h
    await user.save({ validateModifiedOnly: true });

    // TODO: send password reset email with resetToken

    res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
};

// ═══════════════════════════════════════════════════════
// POST /api/auth/reset-password/:token
// ═══════════════════════════════════════════════════════
export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
        throw new ApiError(400, 'Password must be at least 8 characters.');
    }

    const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExp: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, 'Reset token is invalid or has expired.');
    }

    user.password = password;   // pre('save') will hash it
    user.passwordResetToken = null;
    user.passwordResetExp = null;
    await user.save();

    res.json({ success: true, message: 'Password has been reset.' });
};