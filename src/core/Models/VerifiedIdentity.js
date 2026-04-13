import mongoose from 'mongoose';
import { DEFAULTS, VERIFICATION_STATUS } from '../Constants/index.js';

const VerifiedIdentitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  docType: {
    type: String,
    enum: ['Aadhar', 'PAN'],
    required: DEFAULTS.TRUE
  },
  idNumber: {
    type: String,
    required: DEFAULTS.TRUE
  },
  name: {
    type: String,
    default: DEFAULTS.NULL
  },
  dateOfBirth: {
    type: String,
    default: DEFAULTS.NULL
  },
  rawOcrText: {
    type: String,
    default: DEFAULTS.NULL
  }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

// Avoid duplicate verification records for the same document type for a vendor
VerifiedIdentitySchema.index({ user: 1, vendor: 1, docType: 1 }, { unique: DEFAULTS.TRUE });

const VerifiedIdentity = mongoose.models.VerifiedIdentity || mongoose.model('VerifiedIdentity', VerifiedIdentitySchema);
export default VerifiedIdentity;
