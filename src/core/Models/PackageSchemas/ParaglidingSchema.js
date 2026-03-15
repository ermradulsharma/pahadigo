import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const ParaglidingSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    availability: {
        totalFlights: { type: Number, default: 0 },
        availableFlights: { type: Number, default: 0 },
        bookedFlights: { type: Number, default: 0 },
        cancelledFlights: { type: Number, default: 0 }
    },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
    },

    details: {
        siteName: { type: String, default: '' },
        flyType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.PARAGLIDING_TYPES), default: PACKAGE.ACTIVITY.PARAGLIDING_TYPES.SHORT_FLY },
        duration: { type: String, default: '' },
        heightFeet: { type: Number, default: 0 },
        videoIncluded: { type: Boolean, default: false },
        transferIncluded: { type: Boolean, default: false },
        pilotExperience: { type: String, default: '' },
        goproExcludedPrice: { type: Number, default: 0 }
    },

    timings: {
        departureTime: { type: String, default: '06:00 AM' },
        reportingTime: { type: String, default: '05:30 AM' },
    },

    policies: {
        minAge: { type: Number, default: 0 },
        maxWeightKg: { type: Number, default: 0 },
        healthAdvisory: { type: String, default: '' },
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

export default ParaglidingSchema;
