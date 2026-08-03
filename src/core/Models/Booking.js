import mongoose from 'mongoose';
import { DEFAULTS, PAYMENT_GATEWAYS, BOOKING_STATUS, PAYMENT_STATUS, REFUND_STATUS } from '../Constants/index.js';

const BookingSchema = new mongoose.Schema({
    bookingCode: { type: String, unique: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorPackage', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
    item: {
        itemId: { type: mongoose.Schema.Types.ObjectId, required: DEFAULTS.TRUE },
        itemType: { type: String, required: DEFAULTS.TRUE },
        title: { type: String, required: DEFAULTS.TRUE },
        url: { type: String, default: DEFAULTS.NULL }
    },
    traveller: {
        name: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
        phone: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
        email: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
    },
    startDate: { type: Date, required: DEFAULTS.TRUE },
    endDate: { type: Date, required: DEFAULTS.TRUE },
    occupancy: {
        adults: { type: Number, default: 1 },
        children: { type: Number, default: 0 },
        includeMe: { type: Boolean, default: DEFAULTS.TRUE },
        units: { type: Number, default: 1 },
        guestDetails: [{
            name: { type: String, required: DEFAULTS.TRUE },
            phone: { type: String, required: DEFAULTS.TRUE }
        }]
    },
    pricing: {
        basePrice: { type: Number, required: DEFAULTS.TRUE },
        subTotal: { type: Number, required: DEFAULTS.TRUE },
        serviceFee: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        coupon: { type: String, default: DEFAULTS.NULL },
        couponAmount: { type: Number, default: 0 },
        taxRate: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        total: { type: Number, required: DEFAULTS.TRUE },
        currency: { type: String, default: 'INR' },
        refundStatus: { type: String, enum: Object.values(REFUND_STATUS), default: REFUND_STATUS.NONE },
        refundAmount: { type: Number, default: 0 },
        refundDate: { type: Date, default: DEFAULTS.NULL },
        refundId: { type: String, default: DEFAULTS.NULL }
    },

    status: { type: String, enum: Object.values(BOOKING_STATUS), default: BOOKING_STATUS.PENDING, index: DEFAULTS.TRUE },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.UNPAID, index: DEFAULTS.TRUE },
    expiresAt: { type: Date, default: DEFAULTS.NULL, index: DEFAULTS.TRUE },
    adminNotes: { type: String, default: DEFAULTS.NULL },

    payment: {
        gateway: { type: String, default: PAYMENT_GATEWAYS.RAZORPAY, index: DEFAULTS.TRUE },
        orderId: { type: String, index: DEFAULTS.TRUE, default: DEFAULTS.NULL },
        paymentId: { type: String, index: DEFAULTS.TRUE, default: DEFAULTS.NULL },
        signature: { type: String, index: DEFAULTS.TRUE, default: DEFAULTS.NULL },
        paidAt: { type: Date, index: DEFAULTS.TRUE, default: DEFAULTS.NULL }
    },

    payout: {
        amount: { type: Number, default: 0 },
        status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled', 'dispute', 'rejected', 'hold', 'not-paid', 'not-refunded'], default: 'pending', index: DEFAULTS.TRUE },
        transactionId: { type: String, default: DEFAULTS.NULL },
        paidAt: { type: Date, default: DEFAULTS.NULL },
        businessName: { type: String, default: DEFAULTS.NULL },
        ownerName: { type: String, default: DEFAULTS.NULL },
        bankDetails: {
            accountHolderName: { type: String, default: DEFAULTS.NULL },
            accountNumber: { type: String, default: DEFAULTS.NULL },
            ifscCode: { type: String, default: DEFAULTS.NULL },
            bankName: { type: String, default: DEFAULTS.NULL }
        }
    },

    verification: {
        startOTP: { type: String, default: DEFAULTS.NULL },
        isStartVerified: { type: Boolean, default: DEFAULTS.FALSE },
        startVerifiedAt: { type: Date, default: DEFAULTS.NULL },
        endOTP: { type: String, default: DEFAULTS.NULL },
        isEndVerified: { type: Boolean, default: DEFAULTS.FALSE },
        endVerifiedAt: { type: Date, default: DEFAULTS.NULL }
    },

    timeline: [{
        status: { type: String, index: DEFAULTS.TRUE, default: DEFAULTS.NULL },
        remarks: { type: String, default: DEFAULTS.NULL },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: DEFAULTS.NULL },
        timestamp: { type: Date, default: Date.now, index: DEFAULTS.TRUE }
    }],

    cancellation: {
        reason: { type: String, default: DEFAULTS.NULL },
        date: { type: Date, default: DEFAULTS.NULL },
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: DEFAULTS.NULL },
        cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: DEFAULTS.NULL },
        cancelledAt: { type: Date, default: DEFAULTS.NULL },
        role: { type: String, default: DEFAULTS.NULL }
    }
}, {
    timestamps: DEFAULTS.TRUE,
    toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE },
    toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE }
});

BookingSchema.index({ 'item.itemId': 1 });
BookingSchema.index({ 'item.itemId': 1, status: 1, startDate: 1, endDate: 1 });
BookingSchema.index({ createdAt: -1 });

const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
export default Booking;


