import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import {
    buyCreditPackManual,
    getBalance,
    getCreditHistory,
    getMyPurchaseRequests,
    getPendingCreditPurchases,
    listCreditPacks,
    verifyCreditPurchase,
} from '../controllers/credit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// ── Multer setup (mirrors your plans route) ───────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads', 'credit-proofs');
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },          // 5 MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    },
});

const router = express.Router();

// ── Public (still needs auth for balance/history) ─────
router.get('/packs', listCreditPacks);

// ── Authenticated ─────────────────────────────────────
router.get('/balance', authenticate, getBalance);
router.get('/history', authenticate, getCreditHistory);
router.post('/buy-manual', authenticate, upload.single('paymentProof'), buyCreditPackManual);
router.get('/my-purchase-requests', authenticate, getMyPurchaseRequests);

// ── Admin ─────────────────────────────────────────────
router.get('/pending-purchases', authenticate, getPendingCreditPurchases);
router.post('/verify-purchase/:requestId', authenticate, verifyCreditPurchase);

export default router;