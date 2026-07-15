import mongoose from 'mongoose';

const WebhookEventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true, // Prevents duplicate inserts (replay attacks)
        index: true
    },
    gateway: {
        type: String,
        required: true,
        enum: ['razorpay', 'stripe', 'other'],
        default: 'razorpay'
    },
    eventTypes: [{ type: String }],
    status: {
        type: String,
        enum: ['processed', 'failed'],
        default: 'processed'
    },
    error: { type: String },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30d' // Automatically delete after 30 days
    }
});

const WebhookEvent = mongoose.models.WebhookEvent || mongoose.model('WebhookEvent', WebhookEventSchema);

export default WebhookEvent;
