import { Router } from 'express';
import { buyCreditPack, getBalance, getCreditHistory, listCreditPacks } from '../controllers/credit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);   // all credit endpoints need auth

router.get('/packs', listCreditPacks);
router.post('/buy', buyCreditPack);
router.get('/balance', getBalance);
router.get('/history', getCreditHistory);

export default router;