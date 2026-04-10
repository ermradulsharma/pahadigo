import mongoose from 'mongoose';
import { VERIFICATION_STATUS, DEFAULTS, VENDOR_PROFILE_TYPES, STATUS } from '@/constants/index.js';

const VendorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  // profile type
  profileType: { type: String, enum: Object.values(VENDOR_PROFILE_TYPES), default: VENDOR_PROFILE_TYPES.BUSINESS },
  profileImage: { type: String, default: null },

  // owner name
  ownerName: { type: String, default: null },

  // personal details
  personalNumber: { type: String, default: null },
  personalPanCard: { type: String, default: null },
  personalAbout: { type: String, default: null },

  // business details
  businessName: { type: String, required: true },
  businessNumber: { type: String, default: null },
  businessRegistration: { type: String, default: null },
  gstNumber: { type: String, default: null },
  businessAbout: { type: String, default: null },

  // approval status
  status: { type: String, enum: Object.values(STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },

  // vendor operational status (controls online/offline independent of admin approval)
  isOperating: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  // quality & trust
  trustBadge: { type: String, enum: ['none', 'verified', 'super_partner'], default: 'none' },

  // category
  category: [{
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
  }],

  // address
  address: {
    addressLine1: { type: String, default: null },
    addressLine2: { type: String, default: null },
    city: { type: String, default: null },
    state: { type: String, default: null },
    country: { type: String, default: DEFAULTS.COUNTRY },
    pincode: { type: String, default: null },
    latitude: { type: String, default: null },
    longitude: { type: String, default: null },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },

  // bank details
  bankDetails: {
    accountHolderName: { type: String, default: null },
    accountNumber: { type: String, default: null },
    ifscCode: { type: String, default: null },
    bankName: { type: String, default: null },
    cancelledCheque: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
      reason: { type: String, default: null }
    },
  },

  // documents
  documents: {
    aadharCard: [{
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
      reason: { type: String, default: null },
      ocrData: {
        identifiedId: { type: String, default: null },
        text: { type: String, default: null }
      }
    }],

    panCard: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
      reason: { type: String, default: null },
      ocrData: {
        identifiedId: { type: String, default: null },
        text: { type: String, default: null }
      }
    },

    businessRegistration: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
      reason: { type: String, default: null }
    },

    gstRegistration: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
      reason: { type: String, default: null }
    }
  },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true, getters: true, minimize: false },
  toObject: { virtuals: true, getters: true, minimize: false }
});

VendorSchema.index({ status: 1 });
VendorSchema.index({ 'address.location': '2dsphere' });
if (mongoose.models.Vendor) {
  delete mongoose.models.Vendor;
}
export default mongoose.model('Vendor', VendorSchema);
