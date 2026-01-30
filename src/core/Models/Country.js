import mongoose from 'mongoose';

const CountrySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    isoCode: { type: String, required: true, unique: true, uppercase: true, trim: true }, // e.g., IN, US
    phoneCode: { type: String, required: true, trim: true }, // e.g., +91
    currency: { type: String, required: true, trim: true }, // e.g., INR
    status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true, minimize: false },
    toObject: { virtuals: true, getters: true, minimize: false }
});

export default mongoose.models.Country || mongoose.model('Country', CountrySchema);
