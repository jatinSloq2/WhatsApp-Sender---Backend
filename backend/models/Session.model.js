import mongoose from "mongoose"

const SessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        status: {
            type: String,
            enum: ['created', 'qr_ready', 'connected', 'disconnected', 'deleted'],
            default: 'created',
        },

        phone: {
            type: String,
            default: null,
        },

        lastError: {
            type: String,
            default: null,
        },

        lastConnectedAt: {
            type: Date,
            default: null,
        },

        meta: {
            type: Object,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model('WhatsappSession', SessionSchema);
