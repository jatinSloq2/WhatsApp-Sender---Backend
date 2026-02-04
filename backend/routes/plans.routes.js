import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import {
    cancelSubscription,
    getMyPaymentRequests,
    getPaymentHistory,
    getPendingPayments,
    getPlan, listPlans,
    subscribeManual,
    subscribeToPlan,
    verifyPayment
} from '../controllers/plan.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();




// ─── Multer configuration for file uploads ────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/payment-proofs/'); // Make sure this directory exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `proof-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    }
});

// ─── User routes (require authentication) ─────────────
router.post('/subscribe-manual', authenticate, upload.single('paymentProof'), subscribeManual);
router.get('/my-payment-requests', authenticate, getMyPaymentRequests);

// ─── Admin routes (require admin role) ────────────────
router.get('/pending-payments', authenticate, requireAdmin, getPendingPayments);
router.get('/payment-history', authenticate, getPaymentHistory);
router.post('/verify-payment/:requestId', authenticate, requireAdmin, verifyPayment);

// ── Public (anyone can browse plans) ──────────────────
router.get('/', listPlans);

// ── Protected (must be logged in to subscribe) ────────
router.post('/subscribe', authenticate, subscribeToPlan);
router.post('/cancel', authenticate, cancelSubscription);
router.get('/:planId', getPlan);

export default router;