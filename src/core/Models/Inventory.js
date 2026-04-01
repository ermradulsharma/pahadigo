import mongoose from 'mongoose';

/**
 * Calendar Day represents availability and pricing for a specific 24-hour block.
 * Designed to adapt to various Package types (Homestays, Treks, Rentals).
 */
const CalendarDaySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    // Generic 'units' can represent Rooms (Hotels) or Slots (Treks)
    totalUnits: {
        type: Number,
        default: 0
    },
    bookedUnits: {
        type: Number,
        default: 0
    },
    availableUnits: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['available', 'sold_out', 'closed', 'holiday', 'maintenance'],
        default: 'available'
    },
    // Granular pricing overrides to match PackageSchema structures
    pricing: {
        basePrice: { type: Number, default: null }, // Overrides pricePerNight or pricePerPerson
        priceAdjustmentAmount: { type: Number, default: null }, // Example: +500 INR
        priceAdjustmentPercent: { type: Number, default: null }, // Example: +20%
        childPrice: { type: Number, default: null },
        extraBedPrice: { type: Number, default: null },
        porterPrice: { type: Number, default: null }
    },
    note: { type: String, default: '' }
});

const InventorySchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    serviceType: {
        type: String,
        required: true,
        description: 'The discriminator key matching PackageSchema types (e.g., homestay, trekking)'
    },
    calendar: [CalendarDaySchema],
    lastSyncAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Optimization: Ensure fast lookups for specific dates across vendor items
InventorySchema.index({ itemId: 1, 'calendar.date': 1 });
InventorySchema.index({ vendorId: 1, serviceType: 1 });

export default mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);
