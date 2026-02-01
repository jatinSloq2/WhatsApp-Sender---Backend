import mongoose from 'mongoose';

const creditTransactionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            required: true,
            enum: [
                'PLAN_REFILL',      // monthly/yearly auto-refill from subscription
                'PURCHASE',         // one-off credit buy
                'CAMPAIGN_SPEND',   // credits consumed by a campaign
                'REFUND',           // credits returned (e.g. failed campaign)
                'PLAN_UPGRADE_BONUS', // bonus credits on upgrade
            ],
        },
        amount: {
            type: Number,
            required: true,        // positive = added, negative = deducted
        },
        balanceAfter: {
            type: Number,
            required: true,        // snapshot of balance post-transaction
        },
        meta: {
            campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
            planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
            paymentId: { type: String, default: null },                          // e.g. Stripe payment_intent id
            note: { type: String, default: null },
        },
    },
    { timestamps: true }
);

export default mongoose.model('CreditTransaction', creditTransactionSchema);