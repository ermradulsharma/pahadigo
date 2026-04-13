import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

/**
 * Calendar Day represents availability and pricing for a specific 24-hour block.
 * Designed to adapt to various Package types (Homestays, Treks, Rentals).
 */
const CalendarDaySchema = new mongoose.Schema({
  date: { type: Date, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  // Generic 'units' can represent Rooms (Hotels) or Slots (Treks)
  totalUnits: { type: Number, default: 0 },
  bookedUnits: { type: Number, default: 0 },
  availableUnits: { type: Number, default: 0 },
  status: { type: String, enum: ['available', 'sold_out', 'closed', 'holiday', 'maintenance'], default: 'available' },
  // Granular pricing overrides to match PackageSchema structures
  pricing: {
    basePrice: { type: Number, default: DEFAULTS.NULL }, // Overrides pricePerNight or pricePerPerson
    priceAdjustmentAmount: { type: Number, default: DEFAULTS.NULL }, // Example: +500 INR
    priceAdjustmentPercent: { type: Number, default: DEFAULTS.NULL }, // Example: +20%
    childPrice: { type: Number, default: DEFAULTS.NULL },
    extraBedPrice: { type: Number, default: DEFAULTS.NULL },
    porterPrice: { type: Number, default: DEFAULTS.NULL }
  },
  note: { type: String, default: DEFAULTS.NULL }
});

const InventorySchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: DEFAULTS.TRUE },
  serviceType: { type: String, required: DEFAULTS.TRUE, description: 'The discriminator key matching PackageSchema types (e.g., homestay, trekking)' },
  calendar: [CalendarDaySchema],
  lastSyncAt: { type: Date, default: Date.now }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

// Optimization: Ensure fast lookups for specific dates across vendor items
InventorySchema.index({ itemId: 1, 'calendar.date': 1 });
InventorySchema.index({ vendorId: 1, serviceType: 1 });

export default mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
