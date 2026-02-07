// controllers/message.controller.js
import { ApiError } from "../middleware/errorHandler.js";
import Campaign from "../models/campaign.model.js";
import CreditTransaction from "../models/creditTransaction.model.js";
import User from "../models/user.model.js";
import { bulkMessageApi, sendMessageApi } from "../services/sessionServer.api.js";

// Credit cost per message (can be configured)
const CREDIT_COST_PER_MESSAGE = 1;

/**
 * Calculate credit cost based on message type
 */
const calculateCreditCost = (recipientCount, hasMedia) => {
    // You can adjust pricing: e.g., media messages cost more
    const baseRate = hasMedia ? 2 : 1; // 2 credits for media, 1 for text
    return recipientCount * baseRate;
};

/**
 * Deduct credits from user balance
 */
const deductCredits = async (userId, amount, campaignId, note) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.credits.balance < amount) {
        throw new ApiError(400, `Insufficient credits. Required: ${amount}, Available: ${user.credits.balance}`);
    }

    // Deduct credits
    user.credits.balance -= amount;
    await user.save();

    // Create transaction record
    await CreditTransaction.create({
        userId,
        type: 'DEDUCTION',
        amount: -amount, // Negative for deduction
        balanceAfter: user.credits.balance,
        meta: {
            campaignId,
            note: note || 'Message sending',
        },
    });

    return user.credits.balance;
};

/**
 * Send single message
 */
export const sendMessage = async (req, res) => {
    try {
        const { receiver, text, caption, mimetype, campaignName, sessionId } = req.body;
        const userId = req.user._id;

        // Validation
        if (!receiver) {
            return res.status(400).json({
                success: false,
                message: "Receiver phone number is required"
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required"
            });
        }

        if (!text && !req.file) {
            return res.status(400).json({
                success: false,
                message: "Either text message or media file is required"
            });
        }

        // Build message payload
        const message = {};
        let hasMedia = false;
        let mediaType = null;
        let mediaUrl = null;

        // Text message
        if (text) {
            message.text = text;
        }

        // Media handling
        if (req.file) {
            hasMedia = true;
            mediaUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

            // Detect media type based on mimetype
            if (req.file.mimetype.startsWith('image/')) {
                mediaType = 'image';
                message.image = { url: mediaUrl };
                if (caption) message.caption = caption;
            }
            else if (req.file.mimetype.startsWith('video/')) {
                mediaType = 'video';
                message.video = { url: mediaUrl };
                if (caption) message.caption = caption;
            }
            else if (req.file.mimetype.startsWith('audio/')) {
                mediaType = 'audio';
                message.audio = { url: mediaUrl };
                message.mimetype = req.file.mimetype;
            }
            else {
                mediaType = 'document';
                message.document = { url: mediaUrl };
                message.mimetype = req.file.mimetype;
                if (caption) message.caption = caption;
            }
        }

        // Calculate credit cost
        const creditCost = calculateCreditCost(1, hasMedia);

        // Create campaign record FIRST (before deducting credits)
        const campaign = await Campaign.create({
            userId,
            name: campaignName || `Single message to ${receiver}`,
            type: 'SINGLE',
            message: {
                text: text || null,
                hasMedia,
                mediaType,
                mediaUrl,
                caption: caption || null,
                mimetype: req.file?.mimetype || null,
            },
            recipients: {
                total: 1,
                receiver,
            },
            credits: {
                costPerMessage: creditCost,
                totalCost: creditCost,
                deducted: false,
            },
            status: 'PENDING',
            sessionId,
        });

        try {
            // Deduct credits
            const newBalance = await deductCredits(
                userId,
                creditCost,
                campaign._id,
                `Single message to ${receiver}`
            );

            // Update campaign - credits deducted
            campaign.credits.deducted = true;
            campaign.status = 'IN_PROGRESS';
            campaign.startedAt = new Date();
            await campaign.save();

            // Prepare API payload
            const payload = {
                id: sessionId, // Use sessionId from request body
                receiver,
                message
            };

            // Call WhatsApp API
            const response = await sendMessageApi(payload);

            // Update campaign - completed successfully
            campaign.status = 'COMPLETED';
            campaign.results.sent = 1;
            campaign.completedAt = new Date();
            await campaign.save();

            return res.status(200).json({
                success: true,
                message: "Message sent successfully",
                data: {
                    ...response.data,
                    campaign: {
                        id: campaign._id,
                        name: campaign.name,
                        creditsUsed: creditCost,
                        creditsRemaining: newBalance,
                    }
                }
            });

        } catch (sendError) {
            // If sending failed, refund credits if they were deducted
            if (campaign.credits.deducted) {
                const user = await User.findById(userId);
                user.credits.balance += creditCost;
                await user.save();

                await CreditTransaction.create({
                    userId,
                    type: 'REFUND',
                    amount: creditCost,
                    balanceAfter: user.credits.balance,
                    meta: {
                        campaignId: campaign._id,
                        note: 'Refund due to failed message sending',
                    },
                });
            }

            // Update campaign status
            campaign.status = 'FAILED';
            campaign.results.failed = 1;
            campaign.error = sendError.message;
            campaign.completedAt = new Date();
            await campaign.save();

            throw sendError;
        }

    } catch (error) {
        console.error('[SEND MESSAGE] Error:', error);

        return res.status(error.status || error.response?.status || 500).json({
            success: false,
            message: error.message || error.response?.data?.message || "Failed to send message",
            error: error.message
        });
    }
};

/**
 * Bulk message sender
 */
export const bulkMessageSender = async (req, res) => {
    try {
        const { numbers, text, caption, mimetype, delay, campaignName, sessionId } = req.body;
        const userId = req.user._id;

        // Validation
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required"
            });
        }

        if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Numbers array is required and must not be empty"
            });
        }

        if (numbers.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Maximum 1000 numbers allowed per bulk campaign"
            });
        }

        if (!text && !req.file) {
            return res.status(400).json({
                success: false,
                message: "Either text message or media file is required"
            });
        }

        // Build message payload
        const message = {};
        let hasMedia = false;
        let mediaType = null;
        let mediaUrl = null;

        if (text) {
            message.text = text;
        }

        if (req.file) {
            hasMedia = true;
            mediaUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

            if (req.file.mimetype.startsWith('image/')) {
                mediaType = 'image';
                message.image = { url: mediaUrl };
                if (caption) message.caption = caption;
            }
            else if (req.file.mimetype.startsWith('video/')) {
                mediaType = 'video';
                message.video = { url: mediaUrl };
                if (caption) message.caption = caption;
            }
            else if (req.file.mimetype.startsWith('audio/')) {
                mediaType = 'audio';
                message.audio = { url: mediaUrl };
                message.mimetype = req.file.mimetype;
            }
            else {
                mediaType = 'document';
                message.document = { url: mediaUrl };
                message.mimetype = req.file.mimetype;
                if (caption) message.caption = caption;
            }
        }

        // Calculate credit cost
        const creditCost = calculateCreditCost(numbers.length, hasMedia);

        // Create campaign record
        const campaign = await Campaign.create({
            userId,
            name: campaignName || `Bulk campaign - ${numbers.length} recipients`,
            type: 'BULK',
            message: {
                text: text || null,
                hasMedia,
                mediaType,
                mediaUrl,
                caption: caption || null,
                mimetype: req.file?.mimetype || null,
            },
            recipients: {
                total: numbers.length,
                numbers,
            },
            credits: {
                costPerMessage: calculateCreditCost(1, hasMedia),
                totalCost: creditCost,
                deducted: false,
            },
            status: 'PENDING',
            sessionId,
        });

        try {
            // Deduct credits BEFORE sending
            const newBalance = await deductCredits(
                userId,
                creditCost,
                campaign._id,
                `Bulk campaign - ${numbers.length} recipients`
            );

            // Update campaign
            campaign.credits.deducted = true;
            campaign.status = 'IN_PROGRESS';
            campaign.startedAt = new Date();
            await campaign.save();

            // Prepare bulk API payload
            const payload = {
                id: sessionId, // Use sessionId from request body
                numbers,
                message,
                delay: delay || 2000
            };

            // Call bulk WhatsApp API (runs in background)
            const response = await bulkMessageApi(payload);

            // Return immediate response (bulk sends in background)
            return res.status(200).json({
                success: true,
                message: "Bulk message campaign started",
                data: {
                    ...response.data,
                    campaign: {
                        id: campaign._id,
                        name: campaign.name,
                        totalRecipients: numbers.length,
                        creditsUsed: creditCost,
                        creditsRemaining: newBalance,
                        status: 'IN_PROGRESS'
                    }
                }
            });

            // Note: Campaign completion tracking should be handled via webhooks
            // or a separate background job that monitors the bulk sending status

        } catch (sendError) {
            // Refund credits if sending failed
            if (campaign.credits.deducted) {
                const user = await User.findById(userId);
                user.credits.balance += creditCost;
                await user.save();

                await CreditTransaction.create({
                    userId,
                    type: 'REFUND',
                    amount: creditCost,
                    balanceAfter: user.credits.balance,
                    meta: {
                        campaignId: campaign._id,
                        note: 'Refund due to failed bulk campaign',
                    },
                });
            }

            campaign.status = 'FAILED';
            campaign.error = sendError.message;
            campaign.completedAt = new Date();
            await campaign.save();

            throw sendError;
        }

    } catch (error) {
        console.error('[BULK MESSAGE] Error:', error);

        return res.status(error.status || error.response?.status || 500).json({
            success: false,
            message: error.message || error.response?.data?.message || "Failed to send bulk messages",
            error: error.message
        });
    }
};

/**
 * Get user campaigns
 */
export const getMyCampaigns = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const filter = { userId: req.user._id };

        // Optional status filter
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Optional type filter
        if (req.query.type) {
            filter.type = req.query.type;
        }

        const [campaigns, total] = await Promise.all([
            Campaign.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Campaign.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: campaigns,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('[GET CAMPAIGNS] Error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get single campaign details
 */
export const getCampaignById = async (req, res) => {
    try {
        const { campaignId } = req.params;

        const campaign = await Campaign.findOne({
            _id: campaignId,
            userId: req.user._id,
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found',
            });
        }

        res.json({
            success: true,
            data: campaign,
        });
    } catch (error) {
        console.error('[GET CAMPAIGN] Error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Cancel a pending campaign
 */
export const cancelCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;

        const campaign = await Campaign.findOne({
            _id: campaignId,
            userId: req.user._id,
        });

        if (!campaign) {
            return res.status(404).json({
                success: false,
                message: 'Campaign not found',
            });
        }

        if (!['PENDING', 'IN_PROGRESS'].includes(campaign.status)) {
            return res.status(400).json({
                success: false,
                message: 'Only pending or in-progress campaigns can be cancelled',
            });
        }

        // Refund credits if they were deducted
        if (campaign.credits.deducted) {
            const user = await User.findById(req.user._id);
            user.credits.balance += campaign.credits.totalCost;
            await user.save();

            await CreditTransaction.create({
                userId: req.user._id,
                type: 'REFUND',
                amount: campaign.credits.totalCost,
                balanceAfter: user.credits.balance,
                meta: {
                    campaignId: campaign._id,
                    note: 'Campaign cancelled by user',
                },
            });
        }

        campaign.status = 'CANCELLED';
        campaign.completedAt = new Date();
        await campaign.save();

        res.json({
            success: true,
            message: 'Campaign cancelled successfully',
            data: campaign,
        });
    } catch (error) {
        console.error('[CANCEL CAMPAIGN] Error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};