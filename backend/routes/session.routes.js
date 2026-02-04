import express from "express";
import {
    createSession,
    deleteSession,
    getSessionStatus,
    listAllSessions,
    reconnectSession
} from "../controllers/session.controller.js";

const router = express.Router();

router.post("/", createSession);                 // create session
router.delete("/:sessionId", deleteSession);     // delete session
router.get("/:sessionId/status", getSessionStatus); // get status
router.get("/", listAllSessions);                   // list all sessions
router.get("/user", listUserSessions);                   // list user sessions
router.post("/:sessionId/reconnect", reconnectSession);

export default router;