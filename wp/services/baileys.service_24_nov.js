const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");
const fs = require("fs");
const path = require("path");

// Stores
const sessions = new Map();
const qrStore = new Map();
const intentionalDeletions = new Set();
const keepAliveIntervals = new Map();
const retries = new Map();

// Config
const MAX_RETRIES = 5;
const RECONNECT_DELAY = 2000; // ms

const SESSION_DIR = path.join(__dirname, "../baileys_auth");
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

// =====================================================
// Logger helper (IST timestamp)
// =====================================================
function log(sessionId, message) {
    const ts = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false
    });
    console.log(`[${ts}] [${sessionId}] ${message}`);
}

// =====================================================
// Reconnect decision (uses retries counter)
// =====================================================
function shouldReconnect(sessionId) {
    // never reconnect if intentionally deleted
    if (intentionalDeletions.has(sessionId)) return false;

    let attempts = retries.get(sessionId) ?? 0;
    if (attempts < MAX_RETRIES) {
        attempts++;
        retries.set(sessionId, attempts);
        log(sessionId, `Reconnect attempt ${attempts}/${MAX_RETRIES}`);
        return true;
    }
    log(sessionId, `Max reconnect attempts reached (${MAX_RETRIES})`);
    return false;
}

// =====================================================
// Start socket (first connect + reconnect)
// =====================================================
async function startSocket(sessionId) {
    const authPath = path.join(SESSION_DIR, sessionId);
    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    log(sessionId, "Starting WhatsApp socket...");

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: P({ level: "silent" }),
        syncFullHistory: false
    });

    // store the socket
    sessions.set(sessionId, sock);

    // save creds whenever updated
    sock.ev.on("creds.update", saveCreds);

    // handle lifecycle + keepalive
    setupConnectionHandlers(sessionId, sock);
    setupKeepAlive(sessionId, sock);

    return sock;
}

// =====================================================
// Keep-alive: presence update + optional ws ping
// =====================================================
function setupKeepAlive(sessionId, sock) {
    // clear any existing interval
    const prev = keepAliveIntervals.get(sessionId);
    if (prev) {
        clearInterval(prev);
    }

    const interval = setInterval(async () => {
        try {
            log(sessionId, "Sending keep-alive presence...");
            await sock.sendPresenceUpdate("available");
            if (sock?.ws?.ping) {
                try { sock.ws.ping(); } catch (e) { /* ignore */ }
            }
        } catch (e) {
            log(sessionId, `Keep-alive error: ${e?.message || e}`);
        }
    }, 20_000); // every 20s

    keepAliveIntervals.set(sessionId, interval);
}

// =====================================================
// Connection handlers (with reconnect & status logging)
// =====================================================
function setupConnectionHandlers(sessionId, sock) {
    sock.ev.on("connection.update", async (update) => {
        try {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                qrStore.set(sessionId, qr);
                log(sessionId, "QR Generated");
            }

            if (connection === "open") {
                // connected ok -> reset retries
                retries.delete(sessionId);
                qrStore.delete(sessionId);
                intentionalDeletions.delete(sessionId);
                log(sessionId, "Connected successfully");
            }

            if (connection === "close") {
                const error = lastDisconnect?.error;
                const code =
                    error?.output?.statusCode ??
                    error?.output?.payload?.error ??
                    error?.statusCode ??
                    0;

                log(sessionId, `Connection closed with code ${code}`);

                const isLoggedOut = code === DisconnectReason.loggedOut;
                const isReplaced = code === DisconnectReason.connectionReplaced;
                const isBadSession = code === DisconnectReason.badSession;
                const wasManualDelete = intentionalDeletions.has(sessionId);

                // remove socket reference & clear keepalive
                sessions.delete(sessionId);
                const k = keepAliveIntervals.get(sessionId);
                if (k) {
                    clearInterval(k);
                    keepAliveIntervals.delete(sessionId);
                }

                // cases where we should NOT try to reconnect
                if (wasManualDelete) {
                    log(sessionId, "Manual deletion detected — skipping reconnect");
                    return;
                }

                if (isLoggedOut || isBadSession) {
                    log(sessionId, "Logged out / bad session — deleting session");
                    await deleteSession(sessionId);
                    return;
                }

                if (isReplaced) {
                    log(sessionId, "Connection replaced (opened elsewhere) — deleting session");
                    await deleteSession(sessionId);
                    return;
                }

                // automatic reconnect with attempts
                if (shouldReconnect(sessionId)) {
                    log(sessionId, `Reconnecting in ${RECONNECT_DELAY} ms...`);
                    return setTimeout(() => startSocket(sessionId).catch(err => log(sessionId, `Reconnection failed: ${err?.message || err}`)), RECONNECT_DELAY);
                }

                // max retries reached -> cleanup
                log(sessionId, "Reconnect disabled (max retries reached) — deleting session");
                await deleteSession(sessionId);
            }
        } catch (err) {
            log(sessionId, `connection.update handler error: ${err?.message || err}`);
        }
    });

    // also refresh presence when messages arrive to reduce idle risk
    sock.ev.on("messages.upsert", async () => {
        try {
            await sock.sendPresenceUpdate("available");
        } catch { /* ignore */ }
    });

    // low-level websocket handlers (extra guard)
    try {
        sock.ws.on("close", (code, reason) => {
            log(sessionId, `ws closed: ${code} ${reason || ''}`);
            // cleanup and attempt reconnect (if allowed)
            sessions.delete(sessionId);
            const k = keepAliveIntervals.get(sessionId);
            if (k) {
                clearInterval(k);
                keepAliveIntervals.delete(sessionId);
            }
            if (shouldReconnect(sessionId)) {
                log(sessionId, `ws reconnecting in ${RECONNECT_DELAY} ms...`);
                setTimeout(() => startSocket(sessionId).catch(err => log(sessionId, `ws reconnect failed: ${err?.message || err}`)), RECONNECT_DELAY);
            } else {
                log(sessionId, "ws reconnect not allowed (max retries or manual delete) — deleting session");
                deleteSession(sessionId).catch(e => log(sessionId, `deleteSession error: ${e?.message || e}`));
            }
        });

        sock.ws.on("error", (err) => {
            log(sessionId, `ws error: ${err?.message || err}`);
        });
    } catch (e) {
        // some builds may not expose ws immediately; ignore
    }
}

// =====================================================
// Create session helper
// =====================================================
async function createSession(sessionId) {
    log(sessionId, "Creating new session...");
    if (sessions.has(sessionId)) {
        await deleteSession(sessionId);
    }
    return await startSocket(sessionId);
}

// =====================================================
// Get session / QR
// =====================================================
function getSession(sessionId) {
    return sessions.get(sessionId) ?? null;
}

function getQR(sessionId) {
    return qrStore.get(sessionId) ?? null;
}

// =====================================================
// Delete session (logout, close ws, remove auth folder)
// =====================================================
async function deleteSession(sessionId) {
    log(sessionId, "Deleting session...");

    intentionalDeletions.add(sessionId);

    const sock = sessions.get(sessionId);

    if (sock) {
        try {
            log(sessionId, "Logging out from device...");
            await sock.logout();
            log(sessionId, "Logout success");
        } catch (e) {
            log(sessionId, `Logout error: ${e?.message || e}`);
        }

        try {
            log(sessionId, "Closing socket...");
            sock.ws?.close();
        } catch (e) {
            log(sessionId, `Socket close error: ${e?.message || e}`);
        }
    }

    // clear maps / intervals / retries
    sessions.delete(sessionId);

    const k = keepAliveIntervals.get(sessionId);
    if (k) {
        clearInterval(k);
        keepAliveIntervals.delete(sessionId);
    }

    retries.delete(sessionId);
    qrStore.delete(sessionId);

    // remove auth folder
    const authPath = path.join(SESSION_DIR, sessionId);
    if (fs.existsSync(authPath)) {
        try {
            fs.rmSync(authPath, { recursive: true, force: true });
            log(sessionId, "Auth folder removed");
        } catch (e) {
            log(sessionId, `Auth folder removal error: ${e?.message || e}`);
        }
    }

    intentionalDeletions.delete(sessionId);
    log(sessionId, "Session deleted completely");
    return true;
}

// =====================================================
// Status helpers
// =====================================================
function getSessionStatus(sessionId) {
    const sock = sessions.get(sessionId);
    if (!sock) return "no_session";
    if (qrStore.has(sessionId)) return "qr_waiting";
    if (sock.user) return "connected";
    return "initializing";
}

function listSessions() {
    return Array.from(sessions.keys()).map(id => ({
        sessionId: id,
        status: getSessionStatus(id)
    }));
}

// =====================================================
// Exports
// =====================================================
module.exports = {
    createSession,
    getSession,
    getQR,
    deleteSession,
    listSessions,
    getSessionStatus
};