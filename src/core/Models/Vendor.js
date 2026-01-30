import mongoose from 'mongoose';
import { VERIFICATION_STATUS, DEFAULTS } from '@/constants/index.js';

const VendorSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true },
    ownerName: { type: String, default: null },
    businessNumber: { type: String, default: null },
    businessRegistration: { type: String, default: null },
    gstNumber: { type: String, default: null },
    businessAbout: { type: String, default: null },
    isApproved: { type: Boolean, default: DEFAULTS.VENDOR_IS_APPROVED },
    profileImage: { type: String, default: null },
    category: [{
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
    }],
    businessAddress: {
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
    bankDetails: {
        accountHolder: { type: String, default: null, required: true },
        accountNumber: { type: String, default: null, required: true },
        ifscCode: { type: String, default: null, required: true },
        bankName: { type: String, default: null, required: true },
        cancelledCheque: {
            url: { type: String, default: null, required: true },
            status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
            reason: { type: String, default: null }
        },
    },
    documents: {
        aadharCard: [{
            url: { type: String, required: true, default: null },
            status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
            reason: { type: String, default: null }
        }],
        panCard: {
            url: { type: String, required: true, default: null },
            status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
            reason: { type: String, default: null }
        },
        businessRegistration: {
            url: { type: String, required: true, default: null },
            status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
            reason: { type: String, default: null }
        },
        gstRegistration: {
            url: { type: String, required: true, default: null },
            status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
            reason: { type: String, default: null }
        }
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true, minimize: false },
    toObject: { virtuals: true, getters: true, minimize: false }
});

if (mongoose.models.Vendor) {
    delete mongoose.models.Vendor;
}
export default mongoose.model('Vendor', VendorSchema);
