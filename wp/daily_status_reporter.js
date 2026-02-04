const whatsapp = require('./services/baileys.service');

const SESSION_ID = 'your-session-id'; // Replace with your session ID
const YOUR_PHONE = '919XXXXXXXXX@s.whatsapp.net'; // Your phone number in WhatsApp format

// Send daily status report
async function sendDailyStatus() {
    try {
        const sock = whatsapp.getSession(SESSION_ID);
        if (sock?.user) {
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);

            const message = `✅ Session Alive Report\nDay ${days}, Hour ${hours}\nSession: ${SESSION_ID}\nPhone: ${sock.user.id}\nTime: ${new Date().toLocaleString()}`;

            await sock.sendMessage(YOUR_PHONE, { text: message });
            console.log('Daily status sent successfully');
        } else {
            console.log('Session not connected, skipping daily report');
        }
    } catch (error) {
        console.error('Error sending daily status:', error.message);
    }
}

// Send immediately on start
sendDailyStatus();

// Then every 24 hours
setInterval(sendDailyStatus, 24 * 60 * 60 * 1000);

console.log('Daily WhatsApp status reporter started...');
