import mongoose from 'mongoose';
import { DEFAULTS, USER_ROLES } from '../Constants/index.js';

const NotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE },
    recipientRole: { type: String, enum: Object.values(USER_ROLES), default: DEFAULTS.USER_ROLE },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: DEFAULTS.NULL },
    title: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
    message: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
    type: { type: String, trim: DEFAULTS.TRUE, default: 'GENERAL', index: DEFAULTS.TRUE },
    category: {
        type: String,
        enum: ['booking', 'payment', 'vendor', 'package', 'account', 'security', 'system', 'chat', 'sos', 'general'],
        default: 'general',
        index: DEFAULTS.TRUE
    },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    groupKey: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    actionUrl: { type: String, default: DEFAULTS.NULL },
    imageUrl: { type: String, default: DEFAULTS.NULL },
    isRead: { type: Boolean, default: DEFAULTS.FALSE },
    readAt: { type: Date, default: DEFAULTS.NULL },
    isDeleted: { type: Boolean, default: DEFAULTS.FALSE },
    deletedAt: { type: Date, default: DEFAULTS.NULL },
    deliveryStatus: {
        inApp: { type: Boolean, default: DEFAULTS.TRUE },
        push: { sent: { type: Boolean, default: DEFAULTS.FALSE }, sentAt: { type: Date, default: DEFAULTS.NULL }, error: { type: String, default: DEFAULTS.NULL } },
        email: { sent: { type: Boolean, default: DEFAULTS.FALSE }, sentAt: { type: Date, default: DEFAULTS.NULL }, error: { type: String, default: DEFAULTS.NULL } },
        sms: { sent: { type: Boolean, default: DEFAULTS.FALSE }, sentAt: { type: Date, default: DEFAULTS.NULL }, error: { type: String, default: DEFAULTS.NULL } }
    },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) }
}, {
    timestamps: DEFAULTS.TRUE,
    toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
    toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});
NotificationSchema.index({ recipient: 1, isDeleted: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, isDeleted: 1, createdAt: -1 });
NotificationSchema.index({ groupKey: 1, recipient: 1 }, { sparse: true });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

NotificationSchema.methods.markAsRead = async function () {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

NotificationSchema.methods.dismiss = async function () {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
};

NotificationSchema.statics.getUnreadCount = function (recipientId) {
    return this.countDocuments({
        recipient: recipientId,
        isRead: false,
        isDeleted: false
    });
};

NotificationSchema.statics.markAllAsRead = function (recipientId) {
    return this.updateMany(
        { recipient: recipientId, isRead: false, isDeleted: false },
        { $set: { isRead: true, readAt: new Date() } }
    );
};

NotificationSchema.statics.clearAll = function (recipientId) {
    return this.updateMany(
        { recipient: recipientId, isDeleted: false },
        { $set: { isDeleted: true, deletedAt: new Date() } }
    );
};

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
