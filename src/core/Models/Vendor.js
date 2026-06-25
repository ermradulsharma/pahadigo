import mongoose from 'mongoose';
import { VERIFICATION_STATUS, USER_ROLES, AUTH_PROVIDERS, DEFAULTS, VENDOR_PROFILE_TYPES, STATUS } from '../Constants/index.js';


const VendorSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, unique: DEFAULTS.TRUE },

    // profile type
    profileType: { type: String, enum: Object.values(VENDOR_PROFILE_TYPES), default: VENDOR_PROFILE_TYPES.BUSINESS },
    profileImage: { type: String, default: DEFAULTS.NULL },

    // owner name
    ownerName: { type: String, default: DEFAULTS.NULL },

    // personal details
    personalNumber: { type: String, default: DEFAULTS.NULL },
    personalPanCard: { type: String, default: DEFAULTS.NULL },
    personalAbout: { type: String, default: DEFAULTS.NULL },

    // business details
    businessName: { type: String, default: DEFAULTS.NULL },
    businessNumber: { type: String, default: DEFAULTS.NULL },
    businessRegistration: { type: String, default: DEFAULTS.NULL },
    gstNumber: { type: String, default: DEFAULTS.NULL },
    businessAbout: { type: String, default: DEFAULTS.NULL },


    isOperating: { type: Boolean, default: DEFAULTS.TRUE },
    isApproved: { type: Boolean, default: DEFAULTS.FALSE },
    status: { type: String, enum: Object.values(STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
    // quality & trust
    trustBadge: { type: String, enum: ['none', 'verified', 'super_partner'], default: 'none' },

    // category
    category: [{
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: DEFAULTS.TRUE },
        name: { type: String, required: DEFAULTS.TRUE },
        slug: { type: String, required: DEFAULTS.TRUE },
    }],

    // address
    address: {
        addressLine1: { type: String, default: DEFAULTS.NULL },
        addressLine2: { type: String, default: DEFAULTS.NULL },
        city: { type: String, default: DEFAULTS.NULL },
        state: { type: String, default: DEFAULTS.NULL },
        country: { type: String, default: DEFAULTS.COUNTRY },
        pincode: { type: String, default: DEFAULTS.NULL },
        latitude: { type: String, default: DEFAULTS.NULL },
        longitude: { type: String, default: DEFAULTS.NULL },
        location: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },

    // bank details
    bankDetails: {
        accountHolderName: { type: String, default: DEFAULTS.NULL },
        accountNumber: { type: String, default: DEFAULTS.NULL },
        ifscCode: { type: String, default: DEFAULTS.NULL },
        bankName: { type: String, default: DEFAULTS.NULL },
        cancelledCheque: {
            url: { type: String, default: DEFAULTS.NULL },
            publicId: { type: String, default: DEFAULTS.NULL },
            status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
            reason: { type: String, default: DEFAULTS.NULL }
        },
    },

    // documents
    documents: {
        aadharCard: [{
            url: { type: String, default: DEFAULTS.NULL },
            publicId: { type: String, default: DEFAULTS.NULL },
            status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
            reason: { type: String, default: DEFAULTS.NULL },
            ocrData: {
                identifiedId: { type: String, default: DEFAULTS.NULL },
                text: { type: String, default: DEFAULTS.NULL }
            }
        }],

        panCard: {
            url: { type: String, default: DEFAULTS.NULL },
            publicId: { type: String, default: DEFAULTS.NULL },
            status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
            reason: { type: String, default: DEFAULTS.NULL },
            ocrData: {
                identifiedId: { type: String, default: DEFAULTS.NULL },
                text: { type: String, default: DEFAULTS.NULL }
            }
        },

        businessRegistration: {
            url: { type: String, default: DEFAULTS.NULL },
            publicId: { type: String, default: DEFAULTS.NULL },
            status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
            reason: { type: String, default: DEFAULTS.NULL }
        },

        gstRegistration: {
            url: { type: String, default: DEFAULTS.NULL },
            publicId: { type: String, default: DEFAULTS.NULL },
            status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: DEFAULTS.VENDOR_VERIFICATION_STATUS },
            reason: { type: String, default: DEFAULTS.NULL }
        }
    },
    deletedAt: { type: Date, default: DEFAULTS.NULL },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: DEFAULTS.NULL },
}, {
    timestamps: DEFAULTS.TRUE,
    toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
    toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

VendorSchema.index({ status: 1 });
VendorSchema.index({ 'address.location': '2dsphere' });
export default mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);
