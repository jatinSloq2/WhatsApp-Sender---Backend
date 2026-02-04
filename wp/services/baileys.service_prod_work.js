// services/baileys.service.js
// Compatible with @whiskeysockets/baileys v6+
// No makeInMemoryStore usage.

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
const MAX_RETRIES = 5;
const RECONNECT_DELAY = 2000;      // ms
const KEEP_ALIVE_INTERVAL = 30_000; // ms
const PONG_TIMEOUT = 60_000;       // ms - force reconnect if no pong in this period
const STORE_BACKUP_INTERVAL = 120_000; // optional file backup for other metadata (used if needed)

// ======= Internal state =======
const sessions = new Map();        // sessionId -> { sock, meta }
const qrStore = new Map();         // sessionId -> qr string
const retries = new Map();         // sessionId -> count
const intentionalDeletions = new Set();

const socketActive = new Map();    // sessionId -> boolean (true while starting/active)
const startLocks = new Set();      // sessionId lock (optional)
const deleteLocks = new Set();     // sessionId delete lock

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
  if (intentionalDeletions.has(sessionId)) {
    log(sessionId, "shouldReconnect: intentional deletion -> false");
    return false;
  }
  const attempts = retries.get(sessionId) ?? 0;
  if (attempts < MAX_RETRIES) {
    retries.set(sessionId, attempts + 1);
    log(sessionId, `Reconnect attempt ${attempts + 1}/${MAX_RETRIES}`);
    return true;
  }
  log(sessionId, `Max reconnect attempts reached (${MAX_RETRIES})`);
  return false;
}
function resetRetries(sessionId) {
  if (retries.has(sessionId)) retries.delete(sessionId);
}

// ======= Internal start (actual creation) =======
async function _startSocketInternal(sessionId) {
  const authPath = authPathFor(sessionId);
  if (!fs.existsSync(authPath)) fs.mkdirSync(authPath, { recursive: true });

  // Multi-file auth state
  const { state, saveCreds } = await useMultiFileAuthState(authPath);

  // get latest WA Web version
  const { version } = await fetchLatestBaileysVersion();

  log(sessionId, "Starting WhatsApp socket (internal)...");

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    syncFullHistory: false,
    markOnlineOnConnect: false
  });

  // meta holds keepalive/backup refs and lastPong timestamp
  const meta = {
    keepAliveIntervalId: null,
    backupIntervalId: null,
    lastPong: Date.now()
  };

  // Save session entry
  sessions.set(sessionId, { sock, meta });

  // Save credentials when updated
  sock.ev.on("creds.update", saveCreds);

  // ===== Keep-alive & pong handling =====
  function startKeepAlive() {
    // Clear previous if exists
    if (meta.keepAliveIntervalId) {
      clearInterval(meta.keepAliveIntervalId);
      meta.keepAliveIntervalId = null;
    }

    // Update lastPong when pong arrives
    try {
      sock.ws?.on("pong", () => {
        meta.lastPong = Date.now();
        log(sessionId, "PONG received");
      });
    } catch (e) {
      // ws might not be available immediately; handler may be attached later
    }

    meta.keepAliveIntervalId = setInterval(async () => {
      try {
        // Only send presence after socket has a connected user (avoid 'undefined user' errors)
        if (sock?.user) {
          log(sessionId, "Sending keep-alive presence & ping");
          try { await sock.sendPresenceUpdate("available"); } catch (e) { /* ignore */ }
          try { sock.ws?.ping(); } catch (e) { /* ignore */ }
        } else {
          log(sessionId, "Skipping presence (not connected yet)");
        }

        // If no pong received recently, force a reconnect to recover
        if (Date.now() - meta.lastPong > PONG_TIMEOUT) {
          log(sessionId, `No PONG for ${PONG_TIMEOUT}ms — forcing socket close to reconnect`);
          try { sock.ws?.close(); } catch (e) { /* ignore */ }
        }
      } catch (e) {
        log(sessionId, `KeepAlive loop error: ${e?.message || e}`);
      }
    }, KEEP_ALIVE_INTERVAL);
  }

  startKeepAlive();

  // Optional: periodic backup of small meta file if you need (not socket store)
  try {
    meta.backupIntervalId = setInterval(() => {
      // You can write any meta you want. Here we'll just touch a small file to indicate alive.
      try {
        const f = path.join(authPath, ".alive");
        fs.writeFileSync(f, `${new Date().toISOString()}\n`, { encoding: "utf8" });
      } catch (e) {
        log(sessionId, `Backup write error: ${e?.message || e}`);
      }
    }, STORE_BACKUP_INTERVAL);
  } catch (e) {
    log(sessionId, `Backup interval setup error: ${e?.message || e}`);
  }

  // ===== Event handlers =====
  sock.ev.on("messages.upsert", () => {
    // refresh lastPong/activity
    meta.lastPong = Date.now();
  });

  sock.ev.on("connection.update", async update => {
    try {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrStore.set(sessionId, qr);
        log(sessionId, "QR Generated");
      }

      if (connection === "open") {
        log(sessionId, "Connected successfully");
        resetRetries(sessionId);
        qrStore.delete(sessionId);
        intentionalDeletions.delete(sessionId);
        meta.lastPong = Date.now();
      }

      if (connection === "close") {
        const error = lastDisconnect?.error;
        const code =
          error?.output?.statusCode ??
          error?.output?.payload?.error ??
          error?.statusCode ??
          0;

        log(sessionId, `Connection closed with code ${code}`);

        // mark not active so startSocket can be called again
        socketActive.set(sessionId, false);

        const isLoggedOut = code === DisconnectReason.loggedOut;
        const isReplaced = code === DisconnectReason.connectionReplaced;
        const isBadSession = code === DisconnectReason.badSession;

        // cleanup intervals
        try {
          if (meta.keepAliveIntervalId) { clearInterval(meta.keepAliveIntervalId); meta.keepAliveIntervalId = null; }
          if (meta.backupIntervalId) { clearInterval(meta.backupIntervalId); meta.backupIntervalId = null; }
        } catch (e) {}

        // remove session entry (we will recreate on reconnect)
        sessions.delete(sessionId);

        // Terminal cases -> delete session entirely
        if (isLoggedOut || isBadSession || isReplaced) {
          log(sessionId, "Terminal disconnect (logout/badSession/replaced). Deleting session.");
          await deleteSession(sessionId).catch(err => log(sessionId, `deleteSession error: ${err?.message || err}`));
          return;
        }

        // Non-terminal -> attempt reconnect
        if (shouldReconnect(sessionId)) {
          log(sessionId, `Reconnecting in ${RECONNECT_DELAY} ms...`);
          setTimeout(() => {
            if (socketActive.get(sessionId)) {
              log(sessionId, "Reconnect aborted: another start in progress");
              return;
            }
            startSocket(sessionId).catch(err => log(sessionId, `Reconnection failed: ${err?.message || err}`));
          }, RECONNECT_DELAY);
          return;
        }

        log(sessionId, "Reconnect disabled (max retries). Cleaning up session.");
        await deleteSession(sessionId).catch(() => {});
      }
    } catch (e) {
      log(sessionId, `connection.update handler error: ${e?.message || e}`);
    }
  });

  // Low-level WS events
  try {
    sock.ws.on("close", (code, reason) => {
      log(sessionId, `ws closed: ${code} ${reason || ""}`);
      socketActive.set(sessionId, false);
      // connection.update manages reconnect decisions
    });
    sock.ws.on("error", err => log(sessionId, `ws error: ${err?.message || err}`));
  } catch (e) {
    // ws may not always exist immediately
  }

  // mark active true while alive
  socketActive.set(sessionId, true);

  return sock;
}

// ======= Public start wrapper (prevents duplicate starts) =======
async function startSocket(sessionId) {
  if (socketActive.get(sessionId)) {
    log(sessionId, "startSocket skipped: already active/starting");
    const ent = sessions.get(sessionId);
    return ent?.sock ?? null;
  }

  // guard start with a lock
  if (startLocks.has(sessionId)) {
    log(sessionId, "startSocket skipped: start lock present");
    const ent = sessions.get(sessionId);
    return ent?.sock ?? null;
  }
  startLocks.add(sessionId);

  try {
    // If session already exists and sock present, return it
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

// ======= Public createSession (idempotent) =======
async function createSession(sessionId) {
  const status = getSessionStatus(sessionId);
  log(sessionId, `createSession called (status: ${status})`);
  if (status === "connected" || status === "initializing" || status === "qr_waiting") {
    log(sessionId, `createSession: already ${status} — skipping`);
    return;
  }

  // reset retries
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

// ======= Delete session (safe) =======
async function deleteSession(sessionId) {
  if (deleteLocks.has(sessionId)) {
    log(sessionId, "deleteSession skipped: already deleting");
    return;
  }
  deleteLocks.add(sessionId);
  intentionalDeletions.add(sessionId);

  try {
    log(sessionId, "Deleting session...");
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
        log(sessionId, "Closing ws...");
        sock.ws?.close();
      } catch (e) {
        log(sessionId, `ws close error: ${e?.message || e}`);
      }
    }

    // clear intervals if present
    try {
      if (ent?.meta?.keepAliveIntervalId) { clearInterval(ent.meta.keepAliveIntervalId); }
      if (ent?.meta?.backupIntervalId) { clearInterval(ent.meta.backupIntervalId); }
    } catch (e) {}

    sessions.delete(sessionId);
    retries.delete(sessionId);
    qrStore.delete(sessionId);

    // remove auth folder
    const authPath = authPathFor(sessionId);
    if (fs.existsSync(authPath)) {
      try { fs.rmSync(authPath, { recursive: true, force: true }); log(sessionId, "Auth folder removed"); }
      catch (e) { log(sessionId, `Auth removal failed: ${e?.message || e}`); }
    }

    log(sessionId, "Session deleted");
    return true;
  } finally {
    intentionalDeletions.delete(sessionId);
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
  return Array.from(ids).map(id => ({ sessionId: id, status: getSessionStatus(id) }));
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
