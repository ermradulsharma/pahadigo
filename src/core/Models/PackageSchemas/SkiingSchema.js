import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const SkiingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    availability: {
        totalPasses: { type: Number, default: 0 },
        availablePasses: { type: Number, default: 0 },
        bookedPasses: { type: Number, default: 0 }
    },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
    },

    details: {
        slopeName: { type: String, default: '' },
        difficultyLevel: { type: String, enum: Object.values(PACKAGE.ACTIVITY.SKI_DIFFICULTY), default: PACKAGE.ACTIVITY.SKI_DIFFICULTY.BEGINNER },
        duration: { type: String, default: '' },
        instructorIncluded: { type: Boolean, default: true },
        equipmentIncluded: { type: Boolean, default: true },
        videoIncluded: { type: Boolean, default: false },
        skiLiftPassIncluded: { type: Boolean, default: false }
    },

    timings: {
        reportingTime: { type: String, default: '09:00 AM' },
    },

    policies: {
        minAge: { type: Number, default: 0 },
        healthAdvisory: { type: String, default: '' },
        thingsToCarry: { type: String, default: '' },
        cancellationPolicy: { type: String, default: '' },
    },

    location: {
        address: { type: String, default: null },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },

    amenities: { type: String, default: '' },
    mealsIncluded: { type: Boolean, default: true },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

export default SkiingSchema;
