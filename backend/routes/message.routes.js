import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { bulkMessageSender, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();
router.use(authenticate)
router.post('/send', sendMessage);
router.post('/bulk', bulkMessageSender);

export default router;