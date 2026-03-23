import mongoose from 'mongoose';

const EmergencyAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
    },
    status: {
        type: String,
        enum: ['active', 'resolved', 'false_alarm'],
        default: 'active',
        index: true
    },
    notifiedContacts: [{
        name: String,
        phone: String,
        status: { type: String, enum: ['sent', 'failed'] }
    }],
    resolvedAt: {
        type: Date
    },
    resolutionNotes: {
        type: String
    }
}, { timestamps: true });

export default mongoose.models.EmergencyAlert || mongoose.model('EmergencyAlert', EmergencyAlertSchema);
