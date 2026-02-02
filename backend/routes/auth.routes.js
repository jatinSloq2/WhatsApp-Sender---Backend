import { Router } from 'express';
import {
    forgotPassword,
    login,
    logout,
    refreshToken,
    register,
    resendOTP,
    resetPassword,
    verifyOTP
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// ── Public ────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);

router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// ── Protected ─────────────────────────────────────────
router.post('/logout', authenticate, logout);

export default router;
