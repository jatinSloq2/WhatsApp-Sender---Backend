import { Router } from 'express';
import { getProfile, getSubscriptionStatus, updateProfile } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);   // every route below requires a valid accessToken cookie

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.get('/subscription', getSubscriptionStatus);

export default router;