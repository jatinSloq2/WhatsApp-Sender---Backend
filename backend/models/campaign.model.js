// models/campaign.model.js
import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['SINGLE', 'BULK'],
      required: true,
    },
    message: {
      text: String,
      hasMedia: { type: Boolean, default: false },
      mediaType: {
        type: String,
        enum: ['image', 'video', 'audio', 'document', null],
      },
      mediaUrl: String,
      caption: String,
      mimetype: String,
    },
    recipients: {
      total: { type: Number, required: true },
      numbers: [String], // Store numbers for bulk campaigns
      receiver: String, // Store single receiver for single campaigns
    },
    credits: {
      costPerMessage: { type: Number, required: true, default: 1 },
      totalCost: { type: Number, required: true },
      deducted: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    results: {
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
    },
    sessionId: {
      type: String,
      required: true,
    },
    scheduledAt: Date,
    startedAt: Date,
    completedAt: Date,
    error: String,
  },
  { timestamps: true }
);

// Index for querying user campaigns
campaignSchema.index({ userId: 1, createdAt: -1 });
campaignSchema.index({ status: 1 });

export default mongoose.model('Campaign', campaignSchema);