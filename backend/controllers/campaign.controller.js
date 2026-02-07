// controllers/campaign.controller.js
import Campaign from '../models/campaign.model.js';

/**
 * Get campaign statistics for dashboard
 */
export const getCampaignStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Campaign.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          totalMessagesSent: { $sum: '$results.sent' },
          totalMessagesFailed: { $sum: '$results.failed' },
          totalMessagesSkipped: { $sum: '$results.skipped' },
          totalCreditsSpent: { $sum: '$credits.totalCost' },
          activeCampaigns: {
            $sum: {
              $cond: [
                { $in: ['$status', ['PENDING', 'IN_PROGRESS']] },
                1,
                0,
              ],
            },
          },
          completedCampaigns: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
          },
          failedCampaigns: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0] },
          },
        },
      },
    ]);

    const recentCampaigns = await Campaign.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name type status recipients.total credits.totalCost createdAt completedAt');

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalCampaigns: 0,
          totalMessagesSent: 0,
          totalMessagesFailed: 0,
          totalMessagesSkipped: 0,
          totalCreditsSpent: 0,
          activeCampaigns: 0,
          completedCampaigns: 0,
          failedCampaigns: 0,
        },
        recentCampaigns,
      },
    });
  } catch (error) {
    console.error('[CAMPAIGN STATS] Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};