import mongoose from 'mongoose';

const StateSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true }, // e.g., WB, MH
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true, minimize: false },
    toObject: { virtuals: true, getters: true, minimize: false }
});

// Compound index to ensure state codes are unique per country
StateSchema.index({ country: 1, code: 1 }, { unique: true });
StateSchema.index({ country: 1, name: 1 }, { unique: true });

export default mongoose.models.State || mongoose.model('State', StateSchema);
