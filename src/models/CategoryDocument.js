import mongoose from 'mongoose';

const CategoryDocumentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
    },
    category_slug: {
        type: String,
        required: true,
        ref: 'Category'
    },
    isMandatory: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const CategoryDocument = mongoose.models.CategoryDocument || mongoose.model('CategoryDocument', CategoryDocumentSchema);
export default CategoryDocument;
