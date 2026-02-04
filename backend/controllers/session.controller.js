import WhatsappSession from "../models/Session.model.js";
import User from "../models/user.model.js";
import { plans } from "../scripts/seedPlan.js";
import {
    createRemoteSession,
    deleteRemoteSession,
    getRemoteSessionStatus,
    retryRemoteSession
} from "../services/sessionServer.api.js";

/**
 * CREATE SESSION
 * - Save in DB
 * - Call session server
 * - Return QR to frontend
 */
export const createSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user?.id;

        if (!sessionId) {
            return res.status(400).json({ success: false, message: "sessionId required" });
        }

        // Fetch user and plan
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const plan = plans.find(p => p.name === user.planName && p.billingCycle === user.billingCycle);
        const maxSessions = plan?.maxActiveSessions;

        // Count user's active sessions
        const activeSessionsCount = await WhatsappSession.countDocuments({
            userId,
            status: { $nin: ["disconnected", "no_session"] },
        });

        if (maxSessions !== null && activeSessionsCount >= maxSessions) {
            return res.status(403).json({
                success: false,
                message: `You have reached your plan's active session limit (${maxSessions}).`,
            });
        }

        // Create or update DB entry
        const session = await WhatsappSession.findOneAndUpdate(
            { sessionId },
            { sessionId, userId, status: "created" },
            { upsert: true, new: true }
        );

        // Call session server
        const response = await createRemoteSession(sessionId);
        const { status, qr } = response.data?.data || {};

        session.status = status || "created";
        if (qr) session.qr = qr;
        await session.save();

        return res.json({
            success: true,
            data: {
                sessionId,
                status: session.status,
                qr: qr || null,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create session",
            error: error.message,
        });
    }
};

/**
 * DELETE SESSION
 */
export const deleteSession = async (req, res) => {
    try {
        const { sessionId } = req.params;

        await deleteRemoteSession(sessionId);
        await WhatsappSession.findOneAndDelete({ sessionId });

        return res.json({
            success: true,
            message: "Session deleted",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete session",
            error: error.message,
        });
    }
};

/**
 * GET SINGLE SESSION STATUS
 * - Fetch from session server
 * - Sync DB
 */
export const getSessionStatus = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const response = await getRemoteSessionStatus(sessionId);
        const { status, data } = response.data;

        if (status === "no_session") {
            // Delete the session from DB if no_session
            await WhatsappSession.findOneAndDelete({ sessionId });

            return res.json({
                success: true,
                status,
                message: "Session deleted because it does not exist",
            });
        } else {
            // Update session normally
            const updatedSession = await WhatsappSession.findOneAndUpdate(
                { sessionId },
                {
                    status,
                    phone: data?.phone || null,
                },
                { new: true }
            );

            return res.json({
                success: true,
                status,
                phone: data?.phone || null,
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to get session status",
            error: error.message,
        });
    }
};


/**
 * LIST ALL SESSIONS
 * - Read from DB
 * - For each session → check live status
 * - Update DB or delete if no_session
 */
export const listAllSessions = async (req, res) => {
    try {
        const sessions = await WhatsappSession.find().sort({ updatedAt: -1 });

        const updatedSessions = await Promise.all(
            sessions.map(async (session) => {
                try {
                    const response = await getRemoteSessionStatus(session.sessionId);
                    const status = response.data.status;

                    if (status === "no_session") {
                        await WhatsappSession.findOneAndDelete({ sessionId: session.sessionId });
                        return null; // skip from updatedSessions
                    }

                    session.status = status;
                    session.phone = response.data?.data?.phone || null;
                    await session.save();
                } catch {
                    session.status = "disconnected";
                    await session.save();
                }

                return session;
            })
        );

        return res.json({
            success: true,
            data: updatedSessions.filter(Boolean), // remove deleted sessions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to list sessions",
            error: error.message,
        });
    }
};

/**
 * LIST USER SESSIONS
 * - Read user sessions from DB
 * - For each session → check live status
 * - Update DB or delete if no_session
 */
export const listUserSessions = async (req, res) => {
    console.log("API")
    try {
        const userId = req.user.id;

        const sessions = await WhatsappSession.find({ userId }).sort({ updatedAt: -1 });

        const updatedSessions = await Promise.all(
            sessions.map(async (session) => {
                try {
                    const response = await getRemoteSessionStatus(session.sessionId);
                    const status = response.data.status;
                    console.log(`Session ${session.sessionId} status:`, status);

                    if (status === "no_session") {
                        console.log(`Deleting session ${session.sessionId}`);
                        await WhatsappSession.findOneAndDelete({ sessionId: session.sessionId });
                        return null;
                    }

                    session.status = status;
                    session.phone = response.data?.data?.phone || null;
                } catch (err) {
                    console.error(`Error fetching status for ${session.sessionId}:`, err.message);
                    session.status = "disconnected";
                }

                await session.save();
                console.log(`Saved session ${session.sessionId}`);
                return session;
            })
        );

        return res.json({
            success: true,
            data: updatedSessions.filter(Boolean), // remove deleted sessions
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to list user sessions",
            error: error.message,
        });
    }
};

/**
 * RECONNECT SESSION
 * - Call session server retry
 * - Update DB
 */
export const reconnectSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?.id;

        const session = await WhatsappSession.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        // Optional ownership check
        if (userId && session.userId?.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "Not authorized for this session",
            });
        }

        // Call session server retry
        const response = await retryRemoteSession(sessionId);

        // After retry, immediately re-check status
        try {
            const statusResponse = await getRemoteSessionStatus(sessionId);

            session.status = statusResponse.data.status;
            session.phone = statusResponse.data?.data?.phone || null;
        } catch {
            session.status = "disconnected";
        }

        await session.save();

        return res.json({
            success: true,
            message: "Reconnect requested",
            data: {
                sessionId,
                status: session.status,
            },
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to reconnect session",
            error: error.message,
        });
    }
};