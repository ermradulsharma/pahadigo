const mongoose = require('mongoose');

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
        cancelledCheque: { type: String }
    },
    isApproved: { type: Boolean, default: false },
    documents: {
        aadharCardFront: { type: String, required: true },
        aadharCardBack: { type: String, required: true },
        panCard: { type: String, required: true },
        businessRegistration: { type: String, required: true },
        travelAgentPermit: [{ type: String }],
        passengerInsurancePolicy: [{ type: String }],
        adventureSportLicense: [{ type: String }],
        guidCertification: [{ type: String }],
        liabilityWaiverForm: [{ type: String }],
        safetyEmergencyPlan: [{ type: String }],
        riverRaftingPermit: [{ type: String }],
        technicalSafetyCertificate: [{ type: String }],
        insuranceCoverageDocument: [{ type: String }],
        homestayRegistrationCertificate: [{ type: String }],
        gstCertificate: [{ type: String, required: true }],
        hotelLicense: [{ type: String }],
        fssaiLicense: [{ type: String }],
        safetyAuditReport: [{ type: String }],
        structuralFitnessCertificate: [{ type: String }],
        rtoPermit: [{ type: String }],
        insuranceTaxReceipt: [{ type: String }]
    },
    createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Vendor) {
    delete mongoose.models.Vendor;
}
module.exports = mongoose.model('Vendor', VendorSchema);
