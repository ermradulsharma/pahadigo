import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
    title: { type: String, trim: true },
    imageUrl: { type: String, required: true },
    link: { type: String }, // Optional deep link or external URL
    position: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure banners render in correct order
BannerSchema.index({ position: 1 });

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
