import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const ReviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: DEFAULTS.TRUE },
  item: {
    itemId: { type: mongoose.Schema.Types.ObjectId, required: DEFAULTS.TRUE },
    itemType: { type: String, required: DEFAULTS.TRUE },
    title: { type: String }
  },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: DEFAULTS.TRUE },
  serviceId: { type: String, default: DEFAULTS.NULL },
  rating: { type: Number, required: DEFAULTS.TRUE, min: 1, max: 5 },
  comment: { type: String, trim: DEFAULTS.TRUE, maxlength: 1000 },
  isVisible: { type: Boolean, default: DEFAULTS.TRUE },
  reply: { comment: String, repliedAt: Date }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

// Optimize lookups
ReviewSchema.index({ vendor: 1, createdAt: -1 });
ReviewSchema.index({ user: 1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
