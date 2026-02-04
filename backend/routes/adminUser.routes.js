import { Router } from 'express';
import {
    addCreditsManually,
    assignPlanManually,
    cancelUserSubscription,
    deductCreditsManually,
    getAdminStats,
    getAllUsers,
    getUserDetails,
} from '../controllers/adminUser.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// ─── Dashboard Stats ──────────────────────────────────
router.get('/stats', getAdminStats);

// ─── User Management ──────────────────────────────────
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserDetails);

// ─── Credit Management ────────────────────────────────
router.post('/users/:userId/add-credits', addCreditsManually);
router.post('/users/:userId/deduct-credits', deductCreditsManually);

// ─── Plan Management ──────────────────────────────────
router.post('/users/:userId/assign-plan', assignPlanManually);
router.post('/users/:userId/cancel-subscription', cancelUserSubscription);

export default router;