import WhatsappSession from "../models/Session.model.js";
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
        const userId = req.user?.id; // optional

        if (!sessionId) {
            return res.status(400).json({ success: false, message: "sessionId required" });
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

        // Update DB with QR / status
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

        await WhatsappSession.findOneAndUpdate(
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
 * - Update DB
 */
export const listAllSessions = async (req, res) => {
    try {
        const sessions = await WhatsappSession.find().sort({ updatedAt: -1 });

        const updatedSessions = await Promise.all(
            sessions.map(async (session) => {
                try {
                    const response = await getRemoteSessionStatus(session.sessionId);

                    session.status = response.data.status;
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
            data: updatedSessions,
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
 * - Update DB
 */
export const listUserSessions = async (req, res) => {
    try {
        const userId = req.user.id;

        const sessions = await WhatsappSession
            .find({ userId })
            .sort({ updatedAt: -1 });

        const updatedSessions = await Promise.all(
            sessions.map(async (session) => {
                try {
                    const response = await getRemoteSessionStatus(session.sessionId);

                    session.status = response.data.status;
                    session.phone = response.data?.data?.phone || null;
                } catch (err) {
                    session.status = "disconnected";
                }

                await session.save();
                return session;
            })
        );

        return res.json({
            success: true,
            data: updatedSessions,
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