import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const CustomTripSchema = new mongoose.Schema({
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    availability: {
        totalSeats: { type: Number, default: 0 },
        availableSeats: { type: Number, default: 0 },
        bookedSeats: { type: Number, default: 0 }
    },

    pricing: {
        baseFare: optionalPriceWithDecimal,
        pricePerKm: optionalPriceWithDecimal,
        pricePerDay: optionalPriceWithDecimal,
        waitingChargePerHour: optionalPriceWithDecimal,
    },

    details: {
        serviceType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.CUSTOM_TRIP_SERVICE_TYPES), default: PACKAGE.TRANSPORT.CUSTOM_TRIP_SERVICE_TYPES.POINT_TO_POINT },
        vehicleType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.VEHICLE_TYPES), default: PACKAGE.TRANSPORT.VEHICLE_TYPES.BIKE },
        vehicleModel: { type: String, default: '' },
        isACAvailable: { type: Boolean, default: false },
        maxLuggageCapacity: { type: Number, default: 0 },
        operatingRadiusKm: { type: Number, default: 0 }
    },

    timings: {
        availableFrom: { type: String, default: '06:00 AM' },
        availableTo: { type: String, default: '10:00 PM' }
    },

    policies: {
        nightChargeApplicable: { type: Boolean, default: false },
        smokingAllowed: { type: Boolean, default: false },
        petFriendly: { type: Boolean, default: false },
        cancellationPolicy: { type: String, default: '' }
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

    photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }
}, { toJSON: { getters: true }, toObject: { getters: true } });

export default CustomTripSchema;
