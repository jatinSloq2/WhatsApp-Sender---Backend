// routes/message.routes.js
import express from "express";
import {
    bulkMessageSender,
    cancelCampaign,
    getCampaignById,
    getMyCampaigns,
    sendMessage,
} from "../controllers/message.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { messageUpload } from "../middleware/messageUpload.middleware.js";

const router = express.Router();

router.use(authenticate);

// Send messages
router.post("/send", messageUpload.single("media"), sendMessage);
router.post("/bulk", messageUpload.single("media"), bulkMessageSender);

// Campaign management
router.get("/campaigns", getMyCampaigns);
router.get("/campaigns/:campaignId", getCampaignById);
router.post("/campaigns/:campaignId/cancel", cancelCampaign);

export default router;