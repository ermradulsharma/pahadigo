import mongoose from "mongoose";
import { VERIFICATION_STATUS } from "@/constants/index.js";

const VendorDocumentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
  category_slug: { type: String, required: true },
  document_slug: { type: String, required: true },
  url: { type: String, required: true },
  status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: VERIFICATION_STATUS.PENDING },
  rejection_reason: { type: String, default: null },
}, { timestamps: true });

// Ensure unique document per vendor + category + doc_type
VendorDocumentSchema.index({ vendor_id: 1, category_slug: 1, document_slug: 1 }, { unique: true });

const VendorDocument = mongoose.models.VendorDocument || mongoose.model("VendorDocument", VendorDocumentSchema);
export default VendorDocument;
