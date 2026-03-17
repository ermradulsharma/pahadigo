import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const ChardhamTourSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    availability: {
        totalSeats: { type: Number, default: 0 },
        availableSeats: { type: Number, default: 0 },
        bookedSeats: { type: Number, default: 0 },
        reservedSeats: { type: Number, default: 0 },
        cancelledSeats: { type: Number, default: 0 }
    },

    pricing: {
        pricePerPerson: optionalPriceWithDecimal,
        childPrice: optionalPriceWithDecimal,
        infantPrice: optionalPriceWithDecimal,
    },

    tourDetails: {
        tourName: { type: String, default: '' },
        duration: { type: String, default: '' },
        placesCovered: { type: String, default: '' },
        bestSeason: { type: String, enum: Object.values(PACKAGE.SEASONS), default: PACKAGE.SEASONS.ALL_YEAR },
        transportType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.CHARDHAM_VEHICLE_CATEGORIES) },
        hotelType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOTEL_TYPES), default: PACKAGE.ACCOMMODATION.HOTEL_TYPES.BUDGET },
        nightStayLocations: { type: String, default: '' },
        inclusions: { type: String, default: '' },
        exclusions: { type: String, default: '' },
        helicopterIncluded: { type: Boolean, default: false },
        yatraStartsFrom: { type: String, default: 'Haridwar' },
        startPoint: {
            name: { type: String, default: '' },
            latitude: { type: String, default: null },
            longitude: { type: String, default: null },
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] }
            }
        },
        endPoint: {
            name: { type: String, default: '' },
            latitude: { type: String, default: null },
            longitude: { type: String, default: null },
            coordinates: {
                type: { type: String, default: 'Point' },
                coordinates: { type: [Number], default: [0, 0] }
            }
        },
    },

    timings: {
        departureTime: { type: String, default: '06:00 AM' },
        reportingTime: { type: String, default: '05:30 AM' },
    },

    itinerary: [{
        day: { type: Number, default: 1 },
        title: { type: String, default: '' },
        description: { type: String, default: '' }
    }],

    policies: {
        thingsToCarry: { type: String, default: '' },
        healthAdvisory: { type: String, default: '' },
        medicalCertificateRequired: { type: Boolean, default: true },
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

export default ChardhamTourSchema;
