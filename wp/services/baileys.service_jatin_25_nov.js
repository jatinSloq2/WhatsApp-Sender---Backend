const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const P = require("pino");
const fs = require("fs");
const path = require("path");

const SESSION_DIR = path.join(__dirname, "../baileys_auth");
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

// ======= Configuration =======
const MAX_RETRIES = Infinity; // NEVER give up on reconnecting
const RECONNECT_DELAY = 5000;
const KEEP_ALIVE_INTERVAL = 45_000; // 45 seconds
const PONG_TIMEOUT = 120_000; // 2 minutes (very lenient)

// ======= Internal state =======
const sessions = new Map();
const qrStore = new Map();
const retries = new Map();
const intentionalDeletions = new Set();
const socketActive = new Map();
const startLocks = new Set();
const deleteLocks = new Set();

// ======= Helpers =======
function ts() {
  return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour12: false });
}
function log(sessionId, message) {
  console.log(`[${ts()}] [${sessionId}] ${message}`);
}
function authPathFor(sessionId) {
  return path.join(SESSION_DIR, sessionId);
}

// ======= Retry logic =======
function shouldReconnect(sessionId) {
  // Only stop reconnecting if intentionally deleted
  if (intentionalDeletions.has(sessionId)) {
    log(sessionId, "shouldReconnect: intentional deletion -> false");
    return false;
  }

  // Always reconnect (infinite retries)
  const attempts = retries.get(sessionId) ?? 0;
  retries.set(sessionId, attempts + 1);
  log(sessionId, `Reconnect attempt ${attempts + 1}`);
  return true;
}

function resetRetries(sessionId) {
  if (retries.has(sessionId)) retries.delete(sessionId);
}

// ======= Internal start (actual creation) =======
async function _startSocketInternal(sessionId) {
  const authPath = authPathFor(sessionId);
  if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authPath);
  const { version } = await fetchLatestBaileysVersion();

  log(sessionId, "Starting WhatsApp socket (internal)...");

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    syncFullHistory: false,
    markOnlineOnConnect: false, // Don't auto-mark online to avoid detection
    getMessage: async () => undefined,
    shouldIgnoreJid: jid => false,
    retryRequestDelayMs: 250,
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: undefined,
    keepAliveIntervalMs: KEEP_ALIVE_INTERVAL,
    emitOwnEvents: false,
    fireInitQueries: true,
    generateHighQualityLinkPreview: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"], // Better browser identity
    syncFullHistory: false
  });

  const meta = {
    keepAliveIntervalId: null,
    lastPong: Date.now(),
    lastActivity: Date.now(),
    pongHandlerAttached: false
  };

  sessions.set(sessionId, { sock, meta });
  sock.ev.on("creds.update", saveCreds);

  // ===== Attach pong handler when WebSocket is ready =====
  function attachPongHandler() {
    if (meta.pongHandlerAttached || !sock.ws) return;

    try {
      if (sock.ws.readyState === 1) {
        sock.ws.on("pong", () => {
          meta.lastPong = Date.now();
          meta.lastActivity = Date.now();
          log(sessionId, "PONG received");
        });
        meta.pongHandlerAttached = true;
        log(sessionId, "Pong handler attached");
      }
    } catch (e) {
      log(sessionId, `Failed to attach pong handler: ${e?.message}`);
    }
  }

  // ===== Keep-alive - ONLY ping, no force disconnect =====
  function startKeepAlive() {
    if (meta.keepAliveIntervalId) {
      clearInterval(meta.keepAliveIntervalId);
      meta.keepAliveIntervalId = null;
    }

    meta.keepAliveIntervalId = setInterval(async () => {
      try {
        if (!meta.pongHandlerAttached) {
          attachPongHandler();
        }

        // Check if socket exists and is open
        if (!sock?.ws || sock.ws.readyState !== 1) {
          log(sessionId, "Skipping keep-alive (WebSocket not open)");
          return;
        }

        // Only send ping if we have a connected user
        if (sock?.user) {
          try {
            sock.ws.ping();
            log(sessionId, "Ping sent");
          } catch (e) {
            log(sessionId, `Ping error: ${e?.message}`);
          }
        }

        // Log time since last pong but DON'T force disconnect
        const timeSinceLastPong = Date.now() - meta.lastPong;
        const timeSinceLastActivity = Date.now() - meta.lastActivity;

        if (timeSinceLastPong > PONG_TIMEOUT) {
          log(sessionId, `No PONG for ${Math.floor(timeSinceLastPong / 1000)}s (but keeping connection)`);
        }

      } catch (e) {
        log(sessionId, `KeepAlive error: ${e?.message || e}`);
      }
    }, KEEP_ALIVE_INTERVAL);
  }

  startKeepAlive();

  // ===== Event handlers =====
  sock.ev.on("messages.upsert", () => {
    meta.lastPong = Date.now();
    meta.lastActivity = Date.now();
  });

  sock.ev.on("messaging-history.set", () => {
    meta.lastActivity = Date.now();
  });

  sock.ev.on("chats.set", () => {
    meta.lastActivity = Date.now();
  });

  sock.ev.on("contacts.set", () => {
    meta.lastActivity = Date.now();
  });

  sock.ev.on("connection.update", async update => {
    try {
      const { connection, lastDisconnect, qr, isNewLogin } = update;

      if (qr) {
        qrStore.set(sessionId, qr);
        log(sessionId, "QR Generated");
      }

      if (connection === "connecting") {
        log(sessionId, "Connecting...");
        meta.lastActivity = Date.now();
      }

      if (connection === "open") {
        log(sessionId, `Connected successfully${isNewLogin ? " (new login)" : ""}`);
        resetRetries(sessionId);
        qrStore.delete(sessionId);
        intentionalDeletions.delete(sessionId);
        meta.lastPong = Date.now();
        meta.lastActivity = Date.now();

        setTimeout(() => attachPongHandler(), 1000);
      }

      if (connection === "close") {
        const error = lastDisconnect?.error;
        const code =
          error?.output?.statusCode ??
          error?.output?.payload?.statusCode ??
          error?.statusCode ??
          0;

        log(sessionId, `Connection closed with code ${code}: ${error?.message || 'Unknown'}`);

        socketActive.set(sessionId, false);

        // Check for TERMINAL disconnects only (user logged out, replaced, bad session)
        const isLoggedOut = code === DisconnectReason.loggedOut;
        const isReplaced = code === DisconnectReason.connectionReplaced;
        const isBadSession = code === DisconnectReason.badSession;
        const isUnauthorized = code === 401;

        // Cleanup intervals
        try {
          if (meta.keepAliveIntervalId) {
            clearInterval(meta.keepAliveIntervalId);
            meta.keepAliveIntervalId = null;
          }
        } catch (e) { }

        sessions.delete(sessionId);

        // ONLY delete session on these terminal conditions
        if (isLoggedOut || isBadSession || isUnauthorized) {
          log(sessionId, "Terminal disconnect (logged out/bad session/replaced). Deleting session.");
          await deleteSession(sessionId).catch(err =>
            log(sessionId, `deleteSession error: ${err?.message || err}`)
          );
          return;
        }

        // For ALL other disconnect reasons, just reconnect
        log(sessionId, "Non-terminal disconnect. Will reconnect.");

        // Special handling for restart required
        const reconnectDelay = code === DisconnectReason.restartRequired ? 1000 : RECONNECT_DELAY;

        if (shouldReconnect(sessionId)) {
          log(sessionId, `Reconnecting in ${reconnectDelay} ms...`);
          setTimeout(() => {
            if (socketActive.get(sessionId)) {
              log(sessionId, "Reconnect aborted: another start in progress");
              return;
            }
            startSocket(sessionId).catch(err =>
              log(sessionId, `Reconnection failed: ${err?.message || err}`)
            );
          }, reconnectDelay);
        }
      }
    } catch (e) {
      log(sessionId, `connection.update handler error: ${e?.message || e}`);
    }
  });

  // WebSocket events
  try {
    sock.ws.on("close", (code, reason) => {
      log(sessionId, `ws closed: ${code} ${reason?.toString() || ""}`);
      socketActive.set(sessionId, false);
      meta.pongHandlerAttached = false;
    });

    sock.ws.on("error", err => {
      log(sessionId, `ws error: ${err?.message || err}`);
      meta.lastActivity = Date.now();
    });

    sock.ws.on("open", () => {
      log(sessionId, "WebSocket opened");
      meta.lastActivity = Date.now();
      setTimeout(() => attachPongHandler(), 500);
    });
  } catch (e) {
    log(sessionId, `WebSocket event binding error: ${e?.message}`);
  }

  socketActive.set(sessionId, true);
  return sock;
}

// ======= Public start wrapper =======
async function startSocket(sessionId) {
  if (socketActive.get(sessionId)) {
    log(sessionId, "startSocket skipped: already active/starting");
    const ent = sessions.get(sessionId);
    return ent?.sock ?? null;
  }

  if (startLocks.has(sessionId)) {
    log(sessionId, "startSocket skipped: start lock present");
    const ent = sessions.get(sessionId);
    return ent?.sock ?? null;
  }
  startLocks.add(sessionId);

  try {
    const existing = sessions.get(sessionId);
    if (existing?.sock) {
      log(sessionId, "startSocket aborted: socket already present");
      socketActive.set(sessionId, true);
      return existing.sock;
    }
    const sock = await _startSocketInternal(sessionId);
    return sock;
  } finally {
    startLocks.delete(sessionId);
  }
}

// ======= Public createSession =======
async function createSession(sessionId) {
  const status = getSessionStatus(sessionId);
  log(sessionId, `createSession called (status: ${status})`);
  if (status === "connected" || status === "initializing" || status === "qr_waiting") {
    log(sessionId, `createSession: already ${status} — skipping`);
    return;
  }

  retries.delete(sessionId);
  await startSocket(sessionId);
}

// ======= Public getters =======
function getSession(sessionId) {
  return sessions.get(sessionId)?.sock ?? null;
}
function getQR(sessionId) {
  return qrStore.get(sessionId) ?? null;
}

// ======= Delete session (ONLY way to permanently disconnect) =======
async function deleteSession(sessionId) {
  if (deleteLocks.has(sessionId)) {
    log(sessionId, "deleteSession skipped: already deleting");
    return;
  }
  deleteLocks.add(sessionId);

  // Mark as intentional so reconnection stops
  intentionalDeletions.add(sessionId);

  try {
    log(sessionId, "Deleting session (manual/terminal disconnect)...");
    const ent = sessions.get(sessionId);
    const sock = ent?.sock;

    if (sock) {
      try {
        log(sessionId, "Logging out remotely...");
        await sock.logout();
      } catch (e) {
        log(sessionId, `Logout error: ${e?.message || e}`);
      }
      try {
        log(sessionId, "Terminating ws...");
        sock.ws?.terminate();
      } catch (e) {
        log(sessionId, `ws terminate error: ${e?.message || e}`);
      }
    }

    try {
      if (ent?.meta?.keepAliveIntervalId) {
        clearInterval(ent.meta.keepAliveIntervalId);
      }
    } catch (e) { }

    sessions.delete(sessionId);
    retries.delete(sessionId);
    qrStore.delete(sessionId);

    const authPath = authPathFor(sessionId);
    if (fs.existsSync(authPath)) {
      try {
        fs.rmSync(authPath, { recursive: true, force: true });
        log(sessionId, "Auth folder removed");
      } catch (e) {
        log(sessionId, `Auth removal failed: ${e?.message || e}`);
      }
    }

    log(sessionId, "Session deleted successfully");
    return true;
  } finally {
    // Keep intentionalDeletions for a bit to prevent immediate reconnect
    setTimeout(() => intentionalDeletions.delete(sessionId), 5000);
    deleteLocks.delete(sessionId);
    socketActive.set(sessionId, false);
  }
}

// ======= Status helpers =======
function getSessionStatus(sessionId) {
  const ent = sessions.get(sessionId);
  if (!ent) {
    if (qrStore.has(sessionId)) return "qr_waiting";
    return "no_session";
  }
  const sock = ent.sock;
  if (sock?.user) return "connected";
  if (qrStore.has(sessionId)) return "qr_waiting";
  return "initializing";
}

function listSessions() {
  const ids = new Set([...sessions.keys(), ...qrStore.keys()]);
  return Array.from(ids).map(id => ({
    sessionId: id,
    status: getSessionStatus(id),
    retryCount: retries.get(id) ?? 0
  }));
}

// ======= Exports =======
module.exports = {
  createSession,
  getSession,
  getQR,
  deleteSession,
  listSessions,
  getSessionStatus
};