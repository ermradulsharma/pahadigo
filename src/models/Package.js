const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true }, // e.g., '3 Days'
  images: [{ type: String }], // URLs
  availableDates: [{ type: Date }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Package || mongoose.model('Package', PackageSchema);
