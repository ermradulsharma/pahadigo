import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const VendorClosureSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  startDate: { type: Date, required: DEFAULTS.TRUE },
  endDate: { type: Date, required: DEFAULTS.TRUE },
  reason: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});
VendorClosureSchema.index({ startDate: 1, endDate: 1 });
VendorClosureSchema.index({ vendor: 1, startDate: 1, endDate: 1 });
VendorClosureSchema.pre('save', async function () {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (this.startDate) {
    let sd = String(this.startDate).replace(/["']/g, '').trim();
    this.startDate = new Date(sd);
    this.startDate.setHours(0, 0, 0, 0);
  }
  if (this.endDate) {
    let ed = String(this.endDate).replace(/["']/g, '').trim();
    this.endDate = new Date(ed);
    this.endDate.setHours(23, 59, 59, 999);
  }
  if (this.startDate < now) {
    throw new Error('Start date cannot be in the past');
  }

  if (this.endDate < this.startDate) {
    throw new Error('End date must be after start date');
  }
});

const VendorClosure = mongoose.models.VendorClosure || mongoose.model('VendorClosure', VendorClosureSchema);
export default VendorClosure;
