import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const CouponSchema = new mongoose.Schema({
  code: { type: String, required: DEFAULTS.TRUE, unique: DEFAULTS.TRUE, uppercase: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
  discountType: { type: String, enum: ['percentage', 'fixed'], required: DEFAULTS.TRUE },
  value: { type: Number, required: DEFAULTS.TRUE },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 }, // 0 means no limit
  expiryDate: { type: Date, required: DEFAULTS.TRUE },
  usageLimit: { type: Number, default: 0 }, // 0 means unlimited
  usedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: DEFAULTS.TRUE }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
