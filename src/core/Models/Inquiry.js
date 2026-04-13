import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const InquirySchema = new mongoose.Schema({
  name: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  email: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE, lowercase: DEFAULTS.TRUE, default: DEFAULTS.NULL }, // Simple email field, no validation lib
  phone: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  subject: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  message: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  adminNotes: { type: String, default: DEFAULTS.NULL }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

InquirySchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.Inquiry || mongoose.model('Inquiry', InquirySchema);
