import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // The ID of the specific package item (e.g. from homestay, hotel etc arrays)
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    // Optional category to help in display or identification
    category: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Prevent duplicate entries for the same user and item
wishlistSchema.index({ user: 1, itemId: 1 }, { unique: true });

export default mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
