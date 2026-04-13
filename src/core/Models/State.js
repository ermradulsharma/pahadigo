import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const StateSchema = new mongoose.Schema({
  name: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
  code: { type: String, required: DEFAULTS.TRUE, uppercase: DEFAULTS.TRUE, trim: DEFAULTS.TRUE }, // e.g., WB, MH
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: DEFAULTS.TRUE },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

// Compound index to ensure state codes are unique per country
StateSchema.index({ country: 1, code: 1 }, { unique: DEFAULTS.TRUE });
StateSchema.index({ country: 1, name: 1 }, { unique: DEFAULTS.TRUE });

export default mongoose.models.State || mongoose.model('State', StateSchema);
