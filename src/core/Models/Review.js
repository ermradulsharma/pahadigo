import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    package: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Package'
    },
    serviceId: {
        type: String // To link to specific item in vendor packages (e.g. room _id)
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    isVisible: {
        type: Boolean,
        default: true
    },
    reply: {
        comment: String,
        repliedAt: Date
    }
}, { timestamps: true });

// Optimize lookups
ReviewSchema.index({ vendor: 1, createdAt: -1 });
ReviewSchema.index({ user: 1 });

export default mongoose.models.Review || mongoose.model('Review', ReviewSchema);
