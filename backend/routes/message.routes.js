// routes/message.routes.js
import express from "express";
import { bulkMessageSender, sendMessage } from "../controllers/message.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { messageUpload } from "../middleware/messageUpload.middleware.js";

const router = express.Router();

router.use(authenticate);

// single file → image / video / doc
router.post("/send", messageUpload.single("media"), sendMessage);

// bulk also supports single shared media
router.post("/bulk", messageUpload.single("media"), bulkMessageSender);

export default router;
