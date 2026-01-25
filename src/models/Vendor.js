import mongoose from 'mongoose';

const VendorSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true },
    ownerName: { type: String },
    profileImage: { type: String },
    businessPhone: { type: String },
    businessRegistration: { type: String },
    description: { type: String },
    category: [{ type: String, required: true }],
    address: { type: String },
    bankDetails: {
        accountHolder: { type: String },
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String },
        cancelledCheque: { type: String },
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
        reason: { type: String }
    },
    isApproved: { type: Boolean, default: false },
    documents: {
        aadharCard: [{
            url: { type: String, required: true },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        panCard: {
            url: { type: String, required: true },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        },
        businessRegistration: {
            url: { type: String, required: true },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        },
        gstRegistration: {
            url: { type: String, required: true },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        },
        travelAgentPermit: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        passengerInsurancePolicy: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        adventureSportLicense: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        guidCertification: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        liabilityWaiverForm: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        safetyEmergencyPlan: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        riverRaftingPermit: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        technicalSafetyCertificate: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        insuranceCoverageDocument: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        homestayRegistrationCertificate: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        hotelLicense: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        fssaiLicense: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        safetyAuditReport: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        structuralFitnessCertificate: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        rtoPermit: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }],
        insuranceTaxReceipt: [{
            url: { type: String },
            status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
            reason: { type: String }
        }]
    },
    createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Vendor) {
    delete mongoose.models.Vendor;
}
export default mongoose.model('Vendor', VendorSchema);
