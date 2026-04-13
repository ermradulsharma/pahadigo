import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const PolicySchema = new mongoose.Schema({
  target: { type: String, enum: ['vendor', 'traveller', 'admin'], required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE, uppercase: DEFAULTS.TRUE },
  type: { type: String, enum: ['privacy_policy', 'terms_conditions', 'refund_policy', 'cancellation_policy'], required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE, uppercase: DEFAULTS.TRUE },
  content: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', trim: DEFAULTS.TRUE }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

// Ensure unique combination of target and type
PolicySchema.index({ target: 1, type: 1 }, { unique: true });

export default mongoose.models.Policy || mongoose.model('Policy', PolicySchema);
