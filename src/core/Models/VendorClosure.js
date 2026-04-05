import mongoose from 'mongoose';

const VendorClosureSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
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
