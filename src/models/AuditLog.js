import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    target: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    targetId: {
        type: String
    },
    details: {
        type: mongoose.Schema.Types.Mixed // Flexible to store changes
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    }
}, { timestamps: true });

// Optimize for recent logs and filtering by admin/action
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ adminId: 1 });
AuditLogSchema.index({ action: 1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
