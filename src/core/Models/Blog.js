import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    content: { type: String, required: true },
    excerpt: { type: String, trim: true, default: '' },
    coverImage: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date }
}, {
    timestamps: true
});

// Indexes for performance
blogSchema.index({ status: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ title: 'text', content: 'text' });

export default mongoose.models.Blog || mongoose.model('Blog', blogSchema);
