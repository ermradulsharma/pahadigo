const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  businessName: { type: String, required: true },
  ownerName: { type: String }, // New field
  profileImage: { type: String }, // New field (URL)
  businessPhone: { type: String }, // New field
  description: { type: String },
  category: [{ type: String, required: true }], // Changed to Array of Strings for multiples
  address: { type: String },
  bankDetails: {
    accountHolder: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    bankName: { type: String }
  },
  isApproved: { type: Boolean, default: false }, // Admin approval
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
