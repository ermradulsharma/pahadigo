import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const ConversationSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
    type: { type: String, enum: ['traveller-vendor', 'vendor-admin', 'traveller-admin'], required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
    traveller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: DEFAULTS.NULL, index: DEFAULTS.TRUE },
    lastMessage: { type: String, default: DEFAULTS.STRING },
    lastMessageAt: { type: Date, default: Date.now }
}, {
    timestamps: DEFAULTS.TRUE,
    toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
    toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

// Compound index to quickly find chat thread by bookingId and type
ConversationSchema.index({ bookingId: 1, type: 1 }, { unique: true });

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
