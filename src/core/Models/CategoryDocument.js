import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const CategoryDocumentSchema = new mongoose.Schema({
  name: { type: String, required: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
  slug: { type: String, lowercase: DEFAULTS.TRUE, trim: DEFAULTS.TRUE },
  category_slug: { type: String, required: DEFAULTS.TRUE, ref: 'Category' },
  isMandatory: { type: Boolean, default: DEFAULTS.FALSE },
  isActive: { type: Boolean, default: DEFAULTS.TRUE }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

CategoryDocumentSchema.index({ category_slug: 1, slug: 1 }, { unique: DEFAULTS.TRUE });

const CategoryDocument = mongoose.models.CategoryDocument || mongoose.model('CategoryDocument', CategoryDocumentSchema);
export default CategoryDocument;
