import mongoose from 'mongoose';

const creditPurchaseRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Credit pack details (snapshot at purchase time)
    packId: {
      type: String,
      required: true, // e.g. 'pack_100'
    },
    packCredits: {
      type: Number,
      required: true,
      min: 1,
    },

    // Payment details
    amount: {
      type: Number,
      required: true,
      min: 0,
    }, // total incl. GST
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
      type: String, // File path (Multer)
      required: true,
    },

    // Verification
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
  { timestamps: true }
);

creditPurchaseRequestSchema.index({ userId: 1, status: 1 });
creditPurchaseRequestSchema.index({ status: 1, createdAt: -1 });
creditPurchaseRequestSchema.index({ transactionId: 1 }, { unique: true });

export default mongoose.model('CreditPurchaseRequest', creditPurchaseRequestSchema);