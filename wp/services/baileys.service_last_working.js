const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");
const fs = require("fs");
const path = require("path");

// STORES
const sessions = new Map();
const qrStore = new Map();
const intentionalDeletions = new Set();

const SESSION_DIR = path.join(__dirname, "../baileys_auth");
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });


// =====================================================
// START SOCKET (Used for both first-connect and reconnect)
// =====================================================
async function startSocket(sessionId) {
    const authPath = path.join(SESSION_DIR, sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    console.log(`[${sessionId}] Starting WhatsApp socket...`);

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: P({ level: "silent" }),
        syncFullHistory: false
    });

    sessions.set(sessionId, sock);

    sock.ev.on("creds.update", saveCreds);

    setupConnectionHandlers(sessionId, sock);

    return sock;
}


// =====================================================
// CONNECTION HANDLERS
// =====================================================
function setupConnectionHandlers(sessionId, sock) {
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrStore.set(sessionId, qr);
            console.log(`[${sessionId}] QR Generated`);
        }

        if (connection === "open") {
            qrStore.delete(sessionId);
            intentionalDeletions.delete(sessionId);
            console.log(`[${sessionId}] Connected Successfully`);
        }

        if (connection === "close") {
            const error = lastDisconnect?.error;
            const statusCode =
                error?.output?.statusCode ??
                error?.output?.payload?.error ??
                error?.statusCode ??
                0;

            const isLoggedOut = statusCode === DisconnectReason.loggedOut;
            const isReplaced = statusCode === DisconnectReason.connectionReplaced;
            const isBadSession = statusCode === DisconnectReason.badSession;

            const wasManualDelete = intentionalDeletions.has(sessionId);

            console.log(`[${sessionId}] Connection closed: ${statusCode}`);

            sessions.delete(sessionId);

            // AUTO RECONNECT LOGIC
            if (!wasManualDelete && !isLoggedOut && !isReplaced && !isBadSession) {
                console.log(`[${sessionId}] Reconnecting in 2 seconds...`);
                return setTimeout(() => startSocket(sessionId), 2000);
            }

            // DEVICE LOGGED OUT
            if (isLoggedOut || isBadSession) {
                console.log(`[${sessionId}] Logged out - removing auth folder`);
                await deleteSession(sessionId);
            }

            // CONNECTION REPLACED (Session opened on another device)
            if (isReplaced) {
                console.log(`[${sessionId}] Connection replaced - do NOT reconnect`);
                await deleteSession(sessionId);
            }
        }
    });
}


// =====================================================
// CREATE SESSION
// =====================================================
async function createSession(sessionId) {
    console.log(`[${sessionId}] Creating new session...`);

    if (sessions.has(sessionId)) {
        await deleteSession(sessionId);
    }

    return await startSocket(sessionId);
}


// =====================================================
// GET SESSION INSTANCE
// =====================================================
function getSession(sessionId) {
    return sessions.get(sessionId);
}


// =====================================================
// GET QR
// =====================================================
function getQR(sessionId) {
    return qrStore.get(sessionId);
}


// =====================================================
// DELETE SESSION (With Mobile Logout)
// =====================================================
async function deleteSession(sessionId) {
    console.log(`[${sessionId}] Deleting session...`);

    intentionalDeletions.add(sessionId);

    const sock = sessions.get(sessionId);

    if (sock) {
        try {
            console.log(`[${sessionId}] Logging out from WhatsApp mobile...`);
            await sock.logout();     // IMPORTANT: Remote logout on the phone
            console.log(`[${sessionId}] Remote logout completed.`);
        } catch (e) {
            console.log(`[${sessionId}] Logout error: ${e.message}`);
        }

        try {
            console.log(`[${sessionId}] Closing socket...`);
            sock.ws?.close();
        } catch (e) {
            console.log(`[${sessionId}] Socket close error: ${e.message}`);
        }

        sessions.delete(sessionId);
        console.log(`[${sessionId}] Removed from sessions map`);
    }

    qrStore.delete(sessionId);

    const authPath = path.join(SESSION_DIR, sessionId);
    if (fs.existsSync(authPath)) {
        fs.rmSync(authPath, { recursive: true, force: true });
        console.log(`[${sessionId}] Auth folder removed`);
    }

    intentionalDeletions.delete(sessionId);
    console.log(`[${sessionId}] Session deleted successfully`);
    return true;
}


// =====================================================
// LIST SESSIONS
// =====================================================
function listSessions() {
    return Array.from(sessions.keys()).map(id => ({
        sessionId: id,
        status: getSessionStatus(id)
    }));
}


// =====================================================
// GET SESSION STATUS
// =====================================================
function getSessionStatus(sessionId) {
    const sock = sessions.get(sessionId);

    if (!sock) return "no_session";
    if (qrStore.has(sessionId)) return "qr_waiting";
    if (sock.user) return "connected";

    return "initializing";
}


// =====================================================
// EXPORTS
// =====================================================
module.exports = {
    createSession,
    getSession,
    getQR,
    deleteSession,
    listSessions,
    getSessionStatus
};
