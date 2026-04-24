import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: DEFAULTS.TRUE, unique: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
  slug: { type: String, unique: DEFAULTS.TRUE, lowercase: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
  description: { type: String, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

CategorySchema.pre('save', async function () {
  if (!this.isModified('name') && !this.isNew) return;

  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
});

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
