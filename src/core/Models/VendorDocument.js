import mongoose from "mongoose";
import { DEFAULTS, VERIFICATION_STATUS } from '../Constants/index.js';


const VendorDocumentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  category_slug: { type: String, required: DEFAULTS.TRUE },
  document_slug: { type: String, required: DEFAULTS.TRUE },
  url: { type: String, required: DEFAULTS.TRUE },
  status: { type: String, enum: Object.values(VERIFICATION_STATUS), default: VERIFICATION_STATUS.PENDING },
  rejection_reason: { type: String, default: DEFAULTS.NULL },
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

// Ensure unique document per vendor + category + doc_type
VendorDocumentSchema.index({ vendor: 1, category_slug: 1, document_slug: 1 }, { unique: DEFAULTS.TRUE });

const VendorDocument = mongoose.models.VendorDocument || mongoose.model("VendorDocument", VendorDocumentSchema);
export default VendorDocument;
