import { Router } from 'express';
import { cancelSubscription, getPlan, listPlans, subscribeToPlan } from '../controllers/plan.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// ── Public (anyone can browse plans) ──────────────────
router.get('/', listPlans);
router.get('/:planId', getPlan);

// ── Protected (must be logged in to subscribe) ────────
router.post('/subscribe', authenticate, subscribeToPlan);
router.post('/cancel', authenticate, cancelSubscription);

export default router;