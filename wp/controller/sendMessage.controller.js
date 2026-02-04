const whatsappService = require('../services/baileys.service');
const axios = require('axios');

// Helper: download media buffer
async function downloadMedia(url) {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
}
/**
 * Format phone number for WhatsApp
 */
function formatPhoneNumber(number) {
    console.log(`[FORMAT] Raw input: ${number}`);

    let clean = String(number).replace(/\D/g, "");

    if (clean.length === 10) {
        clean = "91" + clean;
        console.log(`[FORMAT] Added +91 → ${clean}`);
    }

    if (clean.length < 10) {
        console.log(`[FORMAT] Invalid number: ${number}`);
        return null;
    }

    const jid = `${clean}@s.whatsapp.net`;
    console.log(`[FORMAT] Final JID: ${jid}`);
    return jid;
}

/**
 * Check if number exists on WhatsApp
 */
async function isNumberOnWhatsApp(sock, jid) {
    console.log(`[CHECK] Checking WhatsApp registration: ${jid}`);

    try {
        const [result] = await sock.onWhatsApp(jid);
        console.log(`[CHECK] Exists = ${result?.exists}`);
        return result && result.exists;
    } catch (error) {
        console.error(`[CHECK] Error checking number:`, error);
        return false;
    }
}

/**
 * Send single message
 */
exports.sendMessage = async (req, res) => {
    

    try {
        //console.log(`[SEND] Request received`, req.body);
        console.log(`[SEND] Request received, receiver`, req.body.receiver);
        const { id } = req.query;
        const { receiver: to, message } = req.body;

        // Basic validation
        if (!id || !to) {
            return res.status(400).json({
                success: false,
                message: "id and receiver are required"
            });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "message payload must be an object"
            });
        }

        // Get session
        const sock = whatsappService.getSession(id);
        if (!sock) {
            return res.status(404).json({
                success: false,
                message: "Session not found. Create a session first."
            });
        }

        // Check connection
        const status = whatsappService.getSessionStatus(id);
        if (status !== "connected") {
            return res.status(400).json({
                success: false,
                message: `Session not connected. Current status: ${status}`
            });
        }

        // Format number
        const jid = formatPhoneNumber(to);
        if (!jid) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number format"
            });
        }

        // Check if number exists
        const exists = await isNumberOnWhatsApp(sock, jid);
        if (!exists) {
            return res.status(400).json({
                success: false,
                message: "Number is not registered on WhatsApp"
            });
        }

        // Prepare payload holder
        let payload = null;

        // -------------------------------------------------------------------
        // TEXT MESSAGE
        // -------------------------------------------------------------------
        if (message.text) {
            payload = { text: message.text };
        }

        // -------------------------------------------------------------------
        // MEDIA TYPES (IMAGE, VIDEO, AUDIO, DOCUMENT)
        // -------------------------------------------------------------------
        const mediaUrl =
            message?.image?.url ||
            message?.video?.url ||
            message?.audio?.url ||
            message?.document?.url ||
            null;

        if (mediaUrl) {
            console.log(`[SEND] Downloading media: ${mediaUrl}`);
            const buffer = await downloadMedia(mediaUrl);
            const mime = message.mimetype || "";
            const caption = message.caption || "";

            if (message.image?.url) {
                payload = { image: buffer, caption };
            }
            else if (message.video?.url) {
                payload = { video: buffer, caption };
            }
            else if (message.audio?.url) {
                payload = {
                    audio: buffer,
                    mimetype: mime
                };
            }
            else if (message.document?.url) {
                payload = {
                    document: buffer,
                    mimetype: mime,
                    fileName: mediaUrl.split("/").pop() || "file",
                    caption
                };
            }
        }

        // No parser matched
        if (!payload) {
            return res.status(400).json({
                success: false,
                message: "Unsupported or missing message fields"
            });
        }

        // SEND MESSAGE
        const sentMessage = await sock.sendMessage(jid, payload);

        return res.json({
            success: true,
            message: "Message sent successfully",
            data: {
                messageId: sentMessage.key.id,
                to: jid,
                timestamp: sentMessage.messageTimestamp
            }
        });

    } catch (error) {
        console.error(`[SEND] Fatal error:`, error);
        return res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: error.message
        });
    }
};
/**
 * Bulk Message Sender (same payload format as sendMessage)
 */
exports.bulkMessageSender = async (req, res) => {
    console.log(`[BULK] Request received`, req.body);

    try {
        const { id, numbers, message, delay = 2000 } = req.body;

        // Validation
        if (!id || !numbers || !Array.isArray(numbers) || numbers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "id and non-empty numbers array are required"
            });
        }

        if (!message || typeof message !== "object") {
            return res.status(400).json({
                success: false,
                message: "message must be an object payload"
            });
        }

        // Get session
        const sock = whatsappService.getSession(id);
        if (!sock) {
            return res.status(404).json({
                success: false,
                message: "Session not found"
            });
        }

        const status = whatsappService.getSessionStatus(id);
        if (status !== "connected") {
            return res.status(400).json({
                success: false,
                message: `Session not connected. Current status: ${status}`
            });
        }

        // Respond immediately
        res.json({
            success: true,
            message: "Bulk request accepted. Messages sending in background.",
            totalNumbers: numbers.length,
            estimatedTime: `${Math.ceil(numbers.length * delay / 1000)} seconds`
        });

        // Detect media URL
        const mediaUrl =
            message?.image?.url ||
            message?.video?.url ||
            message?.audio?.url ||
            message?.document?.url ||
            null;

        // Download media ONCE
        let mediaBuffer = null;
        let mime = message.mimetype || "";
        let caption = message.caption || "";
        let mediaType = null;

        if (mediaUrl) {
            console.log(`[BULK] Downloading media once: ${mediaUrl}`);
            mediaBuffer = await downloadMedia(mediaUrl);

            if (message.image?.url) mediaType = "image";
            else if (message.video?.url) mediaType = "video";
            else if (message.audio?.url) mediaType = "audio";
            else if (message.document?.url) mediaType = "document";

            console.log(`[BULK] Media downloaded. Type: ${mediaType}`);
        }

        // BACKGROUND SENDING
        (async () => {
            let success = 0;
            let fail = 0;
            let skipped = 0;

            for (let i = 0; i < numbers.length; i++) {
                const num = numbers[i];

                console.log(`[BULK] Processing ${num} (${i + 1}/${numbers.length})`);

                try {
                    const jid = formatPhoneNumber(num);
                    if (!jid) {
                        skipped++;
                        continue;
                    }

                    const exists = await isNumberOnWhatsApp(sock, jid);
                    if (!exists) {
                        skipped++;
                        continue;
                    }

                    // FINAL PAYLOAD BUILDER (same as single-send)
                    let payload = null;

                    if (message.text) {
                        payload = { text: message.text };
                    }

                    if (mediaBuffer) {
                        if (mediaType === "image") {
                            payload = { image: mediaBuffer, caption };
                        }
                        else if (mediaType === "video") {
                            payload = { video: mediaBuffer, caption };
                        }
                        else if (mediaType === "audio") {
                            payload = {
                                audio: mediaBuffer,
                                mimetype: mime
                            };
                        }
                        else if (mediaType === "document") {
                            payload = {
                                document: mediaBuffer,
                                mimetype: mime,
                                caption,
                                fileName: mediaUrl.split("/").pop() || "file"
                            };
                        }
                    }

                    if (!payload) {
                        console.log(`[BULK] Unsupported message for ${num}`);
                        skipped++;
                        continue;
                    }

                    // Send message
                    await sock.sendMessage(jid, payload);
                    success++;

                    // Delay to avoid rate-limits
                    if (i < numbers.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }

                } catch (err) {
                    fail++;
                    console.error(`[BULK] Failed for ${num}:`, err.message);
                }
            }

            console.log(
                `[BULK ${id}] Completed → Success: ${success}, Failed: ${fail}, Skipped: ${skipped}`
            );
        })();

    } catch (error) {
        console.error(`[BULK] Fatal:`, error);
        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    }
};



// /**
//  * Get chat list
//  */
// exports.getChatList = async (req, res) => {
//     console.log(`[CHAT LIST] Request received`, req.params);

//     try {
//         const { id } = req.params;

//         if (!id) {
//             console.log(`[CHAT LIST] Missing id`);
//             return res.status(400).json({
//                 success: false,
//                 message: "id required"
//             });
//         }

//         const sock = whatsappService.getSession(id);

//         if (!sock) {
//             console.log(`[CHAT LIST] Session not found: ${id}`);
//             return res.status(404).json({
//                 success: false,
//                 message: "Session not found"
//             });
//         }

//         const status = whatsappService.getSessionStatus(id);
//         console.log(`[CHAT LIST] Session status: ${status}`);

//         if (status !== "connected") {
//             return res.status(400).json({
//                 success: false,
//                 message: `Session not connected. Current status: ${status}`
//             });
//         }

//         return res.json({
//             success: true,
//             message: "Chat list feature requires message event listeners to be implemented",
//             data: {
//                 note: "Baileys stores chats in the auth state. Implement listeners to track chats.",
//                 suggestion: "Use sock.ev.on('messages.upsert', ...) to track messages"
//             }
//         });

//     } catch (error) {
//         console.error(`[CHAT LIST] Fatal error:`, error);
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };