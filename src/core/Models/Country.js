import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const CountrySchema = new mongoose.Schema({
  name: { type: String, required: DEFAULTS.TRUE, unique: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
  isoCode: { type: String, required: DEFAULTS.TRUE, unique: DEFAULTS.TRUE, uppercase: DEFAULTS.TRUE, trim: DEFAULTS.TRUE }, // e.g., IN, US
  phoneCode: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE }, // e.g., +91
  currency: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE }, // e.g., INR
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default mongoose.models.Country || mongoose.model('Country', CountrySchema);
