import mongoose from 'mongoose';

const VerifiedIdentitySchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true,
        index: true
    },
    docType: {
        type: String,
        enum: ['Aadhar', 'PAN'],
        required: true
    },
    idNumber: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: null
    },
    dateOfBirth: {
        type: String,
        default: null
    },
    rawOcrText: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Avoid duplicate verification records for the same document type for a vendor
VerifiedIdentitySchema.index({ vendor: 1, docType: 1 }, { unique: true });

const VerifiedIdentity = mongoose.models.VerifiedIdentity || mongoose.model('VerifiedIdentity', VerifiedIdentitySchema);
export default VerifiedIdentity;
