import mongoose from 'mongoose';

const paymentRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    billingCycle: {
      type: String,
      required: true,
      enum: ['MONTHLY', 'YEARLY'],
    },
    
    // Payment details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    baseAmount: {
      type: Number,
      required: true,
    },
    gstAmount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    paymentProof: {
      type: String, // File path to uploaded screenshot
      required: true,
    },

    // Verification status
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  { 
    timestamps: true 
  }
);

// Index for faster queries
paymentRequestSchema.index({ userId: 1, status: 1 });
paymentRequestSchema.index({ status: 1, createdAt: -1 });
paymentRequestSchema.index({ transactionId: 1 }, { unique: true });

export default mongoose.model('PaymentRequest', paymentRequestSchema);