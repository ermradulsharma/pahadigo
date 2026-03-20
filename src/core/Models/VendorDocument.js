import mongoose from "mongoose";

const VendorDocumentSchema = new mongoose.Schema({
    vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        required: true,
        index: true
    },
    category_slug: {
        type: String,
        required: true
    },
    document_slug: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    rejection_reason: String
}, { timestamps: true });

VendorDocumentSchema.index(
    { vendor_id: 1, document_slug: 1 },
    { unique: true }
);

const VendorDocument = mongoose.models.VendorDocument || mongoose.model("VendorDocument", VendorDocumentSchema);
export default VendorDocument;
