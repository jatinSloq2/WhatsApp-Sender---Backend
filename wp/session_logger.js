const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./session_events.db');

// Create table
db.run(`
    CREATE TABLE IF NOT EXISTS session_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        event_type TEXT,
        status TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        details TEXT
    )
`);

function logEvent(sessionId, eventType, status, details = '') {
    db.run(
        'INSERT INTO session_events (session_id, event_type, status, details) VALUES (?, ?, ?, ?)',
        [sessionId, eventType, status, details]
    );
}

// Add this to your baileys.service.js in connection.update handler:
// logEvent(sessionId, 'connection', connection, JSON.stringify({ code, qr: !!qr }));

module.exports = { logEvent, db };
