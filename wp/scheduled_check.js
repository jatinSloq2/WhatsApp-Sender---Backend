const axios = require('axios');
const fs = require('fs');

const SESSION_ID = process.argv[2] || 'default-session';
const LOG_FILE = 'scheduled_checks.log';

async function quickCheck() {
    const timestamp = new Date().toISOString();

    try {
        const response = await axios.get(`http://localhost:4000/sessions/status/${SESSION_ID}`, {
            timeout: 5000
        });

        const status = response.data.status;
        const message = `${timestamp} | ${status === 'connected' ? '✓' : '✗'} ${status}\n`;

        fs.appendFileSync(LOG_FILE, message);
        console.log(message.trim());

        process.exit(status === 'connected' ? 0 : 1);
    } catch (error) {
        const message = `${timestamp} | ✗ ERROR: ${error.message}\n`;
        fs.appendFileSync(LOG_FILE, message);
        console.log(message.trim());
        process.exit(1);
    }
}

quickCheck();
