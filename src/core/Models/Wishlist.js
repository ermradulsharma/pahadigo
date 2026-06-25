import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: DEFAULTS.TRUE, index: DEFAULTS.TRUE },
  category: { type: String, default: DEFAULTS.NULL }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

wishlistSchema.index({ user: 1, itemId: 1 }, { unique: DEFAULTS.TRUE });

export default mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
