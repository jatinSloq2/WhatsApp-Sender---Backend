const whatsapp = require('../services/baileys.service');
const QRCode = require('qrcode');

exports.createSession = async (req, res) => {
    const { id } = req.body;

    console.log(`[CREATE] Request received for session: ${id}`);

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Session ID required"
        });
    }

    try {
        const existingStatus = await whatsapp.getSessionStatus(id);

        if (existingStatus === "connected") {
            return res.json({
                success: true,
                message: "Session already connected",
                data: { status: "connected" }
            });
        }

        // If session exists but not connected, delete it
        if (existingStatus !== "no_session") {
            await whatsapp.deleteSession(id);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log(`[CREATE] Starting new session: ${id}`);
        await whatsapp.createSession(id);

        console.log(`[CREATE] Waiting for QR...`);

        let qrString = null;
        const maxWait = 20000;       // 20 seconds
        const interval = 500;        // check every 0.5 sec
        let waited = 0;

        while (waited < maxWait) {
            qrString = whatsapp.getQR(id);

            if (qrString) break;

            // If session suddenly connects, stop waiting
            const status = await whatsapp.getSessionStatus(id);
            if (status === "connected") {
                return res.json({
                    success: true,
                    message: "Device connected",
                    data: { status: "connected" }
                });
            }

            await new Promise(resolve => setTimeout(resolve, interval));
            waited += interval;
        }

        if (!qrString) {
            return res.status(504).json({
                success: false,
                message: "QR generation timeout. Try again."
            });
        }

        const qrBase64 = await QRCode.toDataURL(qrString);

        return res.json({
            success: true,
            message: "QR generated",
            data: {
                sessionId: id,
                status: "qr_ready",
                qr: qrBase64
            }
        });

    } catch (error) {
        console.error(`[CREATE] Error:`, error);
        return res.status(500).json({
            success: false,
            message: "Failed to create session",
            error: error.message
        });
    }
};

// exports.createSession = async (req, res) => {
//     const { id } = req.body;

//     console.log(`[CREATE] Request received for session: ${id}`);

//     if (!id) {
//         console.log(`[CREATE] Missing session ID`);
//         return res.status(400).json({ success: false, message: "Session ID required" });
//     }

//     try {
//         console.log(`[CREATE] Checking existing session: ${id}`);
//         const existingStatus = await whatsapp.getSessionStatus(id);

//         console.log(`[CREATE] Existing session status for ${id}: ${existingStatus}`);

//         if (existingStatus === "connected") {
//             console.log(`[CREATE] Session already connected: ${id}`);
//             return res.json({
//                 success: true,
//                 message: "Session already connected",
//                 data: { status: "connected" }
//             });
//         }

//         if (existingStatus !== "no_session") {
//             console.log(`[CREATE] Cleaning up old session: ${id}`);
//             await whatsapp.deleteSession(id);

//             console.log(`[CREATE] Waiting for cleanup...`);
//             await new Promise(resolve => setTimeout(resolve, 1000));
//         }

//         console.log(`[CREATE] Creating new session: ${id}`);
//         const result = await whatsapp.createSession(id);

//         console.log(`[CREATE] Session created: ${id}, status: ${result.status}`);

//         return res.json({
//             success: true,
//             message: "Session initializing. Use /sessions/qr/:sessionId to get QR code",
//             data: { sessionId: id, status: result.status }
//         });
//     } catch (error) {
//         console.error(`[CREATE] Error creating session for ${id}:`, error);
//         return res.status(500).json({
//             success: false,
//             message: "Failed to create session",
//             error: error.message
//         });
//     }
// };








// // Get QR code (polled)
// exports.getQR = async (req, res) => {
//     const { sessionId } = req.params;

//     console.log(`[QR] Request for QR of session: ${sessionId}`);

//     try {
//         console.log(`[QR] Fetching session status: ${sessionId}`);
//         const status = await whatsapp.getSessionStatus(sessionId);
//         console.log(`[QR] Status for ${sessionId}: ${status}`);

//         if (status === "connected") {
//             console.log(`[QR] Session already connected: ${sessionId}`);
//             return res.json({
//                 success: true,
//                 status: "connected",
//                 message: "Device connected"
//             });
//         }

//         if (status === "no_session") {
//             console.log(`[QR] Session not found: ${sessionId}`);
//             return res.status(404).json({
//                 success: false,
//                 status: "no_session",
//                 message: "Session not found. Please create a session first."
//             });
//         }

//         console.log(`[QR] Checking QR string for session: ${sessionId}`);
//         const qrString = whatsapp.getQR(sessionId);

//         if (qrString) {
//             console.log(`[QR] QR found. Generating base64 for session: ${sessionId}`);

//             try {
//                 const qrBase64 = await QRCode.toDataURL(qrString);

//                 console.log(`[QR] QR generated successfully for session: ${sessionId}`);
//                 return res.json({
//                     success: true,
//                     status: "qr_ready",
//                     data: { qr: qrBase64 }
//                 });
//             } catch (err) {
//                 console.error(`[QR] Error generating QR for ${sessionId}:`, err);
//                 return res.status(500).json({
//                     success: false,
//                     message: "QR generation failed",
//                     error: err.message
//                 });
//             }
//         }

//         console.log(`[QR] QR not ready yet for session: ${sessionId}`);
//         return res.json({
//             success: true,
//             status: "initializing",
//             message: "QR not ready yet, please retry"
//         });

//     } catch (error) {
//         console.error(`[QR] Error fetching QR for ${sessionId}:`, error);
//         return res.status(500).json({
//             success: false,
//             message: "Error getting QR code",
//             error: error.message
//         });
//     }
// };

exports.getSessionStatus = async (req, res) => {
    const { sessionId } = req.params;

    console.log(`[STATUS] Request for session status: ${sessionId}`);

    try {
        const status = await whatsapp.getSessionStatus(sessionId);
        const sock = whatsapp.getSession(sessionId);

        console.log(`[STATUS] Current status of ${sessionId}: ${status}`);

        // If connected → return 200
        if (status === "connected") {
            return res.status(200).json({
                success: true,
                status: "connected",
                data: sock?.user ? { phone: sock.user.id } : null
            });
        }

        if (status === "no_session") {
            return res.status(404).json({
                success: false,
                status: "no_session",
            });
        }

        // Any other status → return 400
        return res.status(400).json({
            success: false,
            status,
            message: "Session not connected"
        });

    } catch (error) {
        console.error(`[STATUS] Error getting status for ${sessionId}:`, error);

        return res.status(500).json({
            success: false,
            message: "Error getting session status",
            error: error.message
        });
    }
};

// exports.getSessionStatus = async (req, res) => {
//     const { sessionId } = req.params;

//     console.log(`[STATUS] Request for session status: ${sessionId}`);

//     try {
//         const status = await whatsapp.getSessionStatus(sessionId);
//         const sock = whatsapp.getSession(sessionId);

//         console.log(`[STATUS] Current status of ${sessionId}: ${status}`);

//         return res.json({
//             success: true,
//             status,
//             data: sock?.user ? { phone: sock.user.id } : null
//         });
//     } catch (error) {
//         console.error(`[STATUS] Error getting status for ${sessionId}:`, error);
//         return res.status(500).json({
//             success: false,
//             message: "Error getting session status",
//             error: error.message
//         });
//     }
// };


exports.deleteSession = async (req, res) => {
    const { sessionId } = req.params;

    console.log(`[DELETE] Request to delete session: ${sessionId}`);

    try {
        await whatsapp.deleteSession(sessionId);

        console.log(`[DELETE] Session deleted: ${sessionId}`);

        return res.json({ success: true, message: "Session deleted" });
    } catch (error) {
        console.error(`[DELETE] Error deleting session ${sessionId}:`, error);
        return res.status(500).json({
            success: false,
            message: "Error deleting session",
            error: error.message
        });
    }
};


exports.listSessions = (req, res) => {
    console.log(`[LIST] Request to list all sessions`);

    try {
        const list = whatsapp.listSessions();

        console.log(`[LIST] Total sessions: ${list.length}`);

        return res.json({
            success: true,
            sessions: list
        });
    } catch (error) {
        console.error("[LIST] Error listing sessions:", error);
        return res.status(500).json({
            success: false,
            message: "Error listing sessions",
            error: error.message
        });
    }
};


exports.retryDisconectedSession = async (req, res) => {
    const { id } = req.body;

    console.log(`[CREATE] Request Retry Disconnected Session received for session: ${id}`);

    if (!id) {
        return res.status(400).json({
            success: false,
            message: "Session ID required"
        });
    }

    try {
        const existingStatus = await whatsapp.getSessionStatus(id);

        if (existingStatus === "connected") {
            return res.json({
                success: true,
                message: "Session already connected",
                data: { status: "connected" }
            });
        }

        // If session exists, we try to reconnect it without deleting
        console.log(`[CREATE] Retrying connection for session: ${id}`);

        // Just call createSession. The service handles idempotency and reloading from disk.
        // It will pick up existing auth files.
        await whatsapp.createSession(id);

        const maxWait = 1000;       // 1 seconds
        const interval = 500;       // check every 0.5 sec
        let waited = 0;

        while (waited <= maxWait) {

            await new Promise(resolve => setTimeout(resolve, interval));
            waited += interval;
            // If session suddenly connects, stop waiting
            const status = await whatsapp.getSessionStatus(id);
            if (status === "connected") {
                console.log(`[ReConnected] connected new session: ${id}`);
                return res.json({
                    success: true,
                    message: "Device connected",
                    data: { status: "connected" }
                });
            }
        }

        return res.json({
            success: true,
            message: "Retry Connect Requested",
            data: {
                sessionId: id
            }
        });

    } catch (error) {
        console.error(`[CREATE] Error:`, error);
        return res.status(500).json({
            success: false,
            message: "Failed to create session",
            error: error.message
        });
    }
};
