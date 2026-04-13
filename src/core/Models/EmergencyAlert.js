import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const EmergencyAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  location: { latitude: { type: Number, default: DEFAULTS.NULL }, longitude: { type: Number, default: DEFAULTS.NULL }, address: { type: String, default: DEFAULTS.NULL } },
  status: { type: String, enum: ['active', 'resolved', 'false_alarm'], default: 'active', index: DEFAULTS.TRUE },
  notifiedContacts: [{ name: String, phone: String, status: { type: String, enum: ['sent', 'failed'], default: 'sent' } }],
  resolvedAt: { type: Date, default: DEFAULTS.NULL },
  resolutionNotes: { type: String, default: DEFAULTS.NULL }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default mongoose.models.EmergencyAlert || mongoose.model('EmergencyAlert', EmergencyAlertSchema);
