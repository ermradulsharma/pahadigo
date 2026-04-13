import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const AuditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE },
  action: { type: String, required: DEFAULTS.TRUE, uppercase: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
  target: { type: String, required: DEFAULTS.TRUE, uppercase: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
  targetId: { type: String },
  details: { type: mongoose.Schema.Types.Mixed, default: DEFAULTS.NULL },
  ipAddress: { type: String },
  userAgent: { type: String }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ action: 1 });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
