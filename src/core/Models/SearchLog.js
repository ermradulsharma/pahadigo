import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const searchLogSchema = new mongoose.Schema({
  query: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE, lowercase: DEFAULTS.TRUE },
  count: { type: Number, default: 1 },
  lastSearched: { type: Date, default: Date.now },
  resultsCount: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: DEFAULTS.NULL }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

searchLogSchema.index({ count: -1 });
searchLogSchema.index({ lastSearched: -1 });

export default mongoose.models.SearchLog || mongoose.model('SearchLog', searchLogSchema);
