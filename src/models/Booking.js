const mongoose = require('mongoose');

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
  refundAmount: { type: Number, default: 0 },
  totalPrice: { type: Number },
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
