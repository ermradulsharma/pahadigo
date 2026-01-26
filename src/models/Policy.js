import mongoose from 'mongoose';

const PolicySchema = new mongoose.Schema({
    target: {
        type: String,
        enum: ['vendor', 'traveller'],
        required: true
    },
    type: {
        type: String,
        enum: ['privacy_policy', 'terms_conditions', 'refund_policy', 'cancellation_policy'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Ensure unique combination of target and type
PolicySchema.index({ target: 1, type: 1 }, { unique: true });

export default mongoose.models.Policy || mongoose.model('Policy', PolicySchema);
