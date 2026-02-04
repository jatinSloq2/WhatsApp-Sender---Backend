const axios = require('axios');
const fs = require('fs');

// Configuration
const SERVER_URL = 'http://localhost:4000';
const SESSION_ID = 'your-test-session-id'; // Replace with your actual session ID
const CHECK_INTERVAL = 30 * 60 * 1000; // Check every 30 minutes
const LOG_FILE = 'session_persistence_test.log';

let checkCount = 0;
let successCount = 0;
let failCount = 0;

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(logMessage.trim());
    fs.appendFileSync(LOG_FILE, logMessage);
}

async function checkSessionStatus() {
    checkCount++;

    try {
        const response = await axios.get(`${SERVER_URL}/sessions/status/${SESSION_ID}`);

        if (response.status === 200 && response.data.status === 'connected') {
            successCount++;
            log(`✓ Check #${checkCount}: Session CONNECTED (${response.data.data?.phone || 'N/A'})`);
        } else {
            failCount++;
            log(`✗ Check #${checkCount}: Session NOT connected - Status: ${response.data.status}`);
        }
    } catch (error) {
        failCount++;
        log(`✗ Check #${checkCount}: ERROR - ${error.message}`);
    }

    // Print summary
    const uptime = (checkCount * CHECK_INTERVAL) / (1000 * 60 * 60); // hours
    log(`   Summary: ${successCount}/${checkCount} successful | Running for ${uptime.toFixed(2)} hours`);
}

// Initial check
log('=== Session Persistence Test Started ===');
log(`Session ID: ${SESSION_ID}`);
log(`Check Interval: ${CHECK_INTERVAL / 1000 / 60} minutes`);
checkSessionStatus();

// Schedule periodic checks
setInterval(checkSessionStatus, CHECK_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
    log('=== Test Stopped ===');
    log(`Final Stats: ${successCount}/${checkCount} checks passed`);
    log(`Success Rate: ${((successCount / checkCount) * 100).toFixed(2)}%`);
    process.exit(0);
});
