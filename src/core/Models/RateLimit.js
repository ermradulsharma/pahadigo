import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const RateLimitSchema = new mongoose.Schema({
  key: { type: String, required: DEFAULTS.TRUE, unique: DEFAULTS.TRUE },
  count: { type: Number, default: 0 },
  resetAt: { type: Date, required: DEFAULTS.TRUE }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

// TTL index to automatically delete expired rate limits
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);
