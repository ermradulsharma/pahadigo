import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const DisputeSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  traveller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  reason: { type: String, required: DEFAULTS.TRUE, enum: ['vendor_no_show', 'quality_issue', 'safety_concern', 'wrong_information', 'other'] },
  description: { type: String, required: DEFAULTS.TRUE },
  evidenceUrls: [{ url: String, publicId: String }],
  status: { type: String, enum: ['open', 'investigating', 'resolved_refunded', 'resolved_rejected'], default: 'open', index: DEFAULTS.TRUE },
  adminNotes: { type: String, default: DEFAULTS.NULL },
  resolvedAt: { type: Date, default: DEFAULTS.NULL }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default mongoose.models.Dispute || mongoose.model('Dispute', DisputeSchema);
