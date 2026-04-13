import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const BookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  traveller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: DEFAULTS.TRUE },
  bookingDate: { type: Date, default: Date.now },
  travelStartTime: { type: Date, required: DEFAULTS.TRUE }, // Full Date + Time (Precision based)
  travelEndTime: { type: Date, required: DEFAULTS.TRUE }, // Full Date + Time (Precision based)

  // Traveler Breakdown
  adultCount: { type: Number, default: 1, min: 1 },
  childCount: { type: Number, default: 0, min: 0 },
  units: { type: Number, default: 1, min: 1 }, // Total slots (adults + children)

  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },

  // Group Booking Details
  includeBooker: { type: Boolean, default: DEFAULTS.TRUE },
  travelerDetails: [{
    name: { type: String, required: DEFAULTS.TRUE },
    phone: { type: String }
  }],

  razorpay: {
    orderId: String,
    paymentId: String,
    signature: String
  },
  payoutStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' }, // Admin to Vendor
  refundStatus: { type: String, enum: ['none', 'refunded'], default: 'none' },
  refundAmount: { type: Number, default: 0, min: 0 },
  totalPrice: { type: Number, min: 0 },
  preferences: {
    category: { type: String }, // homestay, trekking, etc.
    itemId: { type: mongoose.Schema.Types.ObjectId }
  },
  timeline: [{
    title: { type: String, required: DEFAULTS.TRUE },
    description: { type: String },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  isDisputed: { type: Boolean, default: DEFAULTS.FALSE }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

BookingSchema.index({ user: 1 });
BookingSchema.index({ package: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ 'razorpay.orderId': 1 });
BookingSchema.index({ createdAt: -1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
