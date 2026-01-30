import mongoose from 'mongoose';

const searchLogSchema = new mongoose.Schema({
    query: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    count: {
        type: Number,
        default: 1
    },
    lastSearched: {
        type: Date,
        default: Date.now
    },
    resultsCount: {
        type: Number,
        default: 0
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { timestamps: true });

// Index for efficient querying of popular searches
searchLogSchema.index({ count: -1 });
searchLogSchema.index({ lastSearched: -1 });

export default mongoose.models.SearchLog || mongoose.model('SearchLog', searchLogSchema);
