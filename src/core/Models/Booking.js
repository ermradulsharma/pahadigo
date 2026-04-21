import mongoose from 'mongoose';
import { DEFAULTS, PAYMENT_GATEWAYS } from '../Constants/index.js';

/**
 * Booking Model
 * Orchestrates the relationship between Travellers, Vendors, and specific Items.
 */
const BookingSchema = new mongoose.Schema({
  // --- Core Relationships ---
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE }, // The person who made the booking
  traveller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE }, // Final traveller identity
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE }, // The service provider
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: DEFAULTS.TRUE }, // The catalog document

  // --- Item Specifics ---
  bookingDetails: {
    category: { type: String, required: DEFAULTS.TRUE }, // homestay, trekking, hotel, etc.
    itemId: { type: mongoose.Schema.Types.ObjectId, required: DEFAULTS.TRUE }, // ID of the specific item inside the package
    itemTitle: { type: String }, // Snapshot of the title at booking time
  },

  // --- Schedule ---
  startDate: { type: Date, required: DEFAULTS.TRUE },
  endDate: { type: Date, required: DEFAULTS.TRUE },
  checkInTime: { type: String },
  checkOutTime: { type: String },

  // --- Capacity Breakdown ---
  adultCount: { type: Number, default: 1, min: 1 },
  childCount: { type: Number, default: 0, min: 0 },
  infantCount: { type: Number, default: 0, min: 0 },
  totalTravellers: { type: Number, required: DEFAULTS.TRUE }, // Total units/people

  // --- Detailed Traveller List ---
  travellerList: [{
    name: { type: String, required: DEFAULTS.TRUE },
    age: { type: Number },
    gender: { type: String },
    idProof: { type: String }, // URL to ID proof if collected
    phone: { type: String }
  }],

  // --- Financials ---
  basePrice: { type: Number, required: DEFAULTS.TRUE },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: DEFAULTS.TRUE },
  currency: { type: String, default: 'INR' },

  // --- Status & Lifecycle ---
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'expired'], 
    default: 'pending',
    index: DEFAULTS.TRUE
  },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'partially_paid', 'paid', 'refunded', 'failed'], 
    default: 'unpaid',
    index: DEFAULTS.TRUE
  },

  // --- Integration Data ---
  paymentGateway: {
    name: { type: String, default: 'razorpay' },
    orderId: { type: String, index: DEFAULTS.TRUE },
    paymentId: { type: String },
    signature: { type: String }
  },

  // --- Operations ---
  timeline: [{
    status: { type: String },
    remarks: { type: String },
    timestamp: { type: Date, default: Date.now },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Who made the update (System/Admin/Vendor)
  }],

  cancellationReason: { type: String },
  cancellationDate: { type: Date },
  
  isDisputed: { type: Boolean, default: DEFAULTS.FALSE },
  specialRequests: { type: String } // Extra notes from user
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE }
});

// Optimized Indexes
BookingSchema.index({ 'bookingDetails.itemId': 1 });
BookingSchema.index({ createdAt: -1 });

// Ensure any existing models are cleared (preventing re-definition errors in dev)
if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}

export default mongoose.model('Booking', BookingSchema);
