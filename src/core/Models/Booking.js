import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    bookingDate: { type: Date, default: Date.now },
    travelDate: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    razorpay: {
        orderId: String,
        paymentId: String,
        signature: String
    },
    payoutStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' }, // Admin to Vendor
    refundStatus: { type: String, enum: ['none', 'refunded'], default: 'none' },
    refundAmount: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, min: 0 },
});

BookingSchema.index({ user: 1 });
BookingSchema.index({ package: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ 'razorpay.orderId': 1 });
BookingSchema.index({ createdAt: -1 });

export default mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
