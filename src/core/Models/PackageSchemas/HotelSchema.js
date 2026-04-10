import { calculateAvailability } from '../../Helpers/availability.js';
import { mapToGeoJSON } from '../../Helpers/geoUtils.js';
import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const priceWithDecimal = { type: Number, required: true, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };
const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const HotelSchema = new mongoose.Schema({
    // --- Basic Info ---
    title: { type: String, required: true, default: '' },
    description: { type: String, required: true, default: '' },
    isActive: { type: Boolean, default: true },

    // --- Type & Classification ---
    hotelType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOTEL_TYPES), default: PACKAGE.ACCOMMODATION.HOTEL_TYPES.BUDGET, required: true },
    starRating: { type: Number, min: 1, max: 5, default: 3 },

    // --- Availability ---
    availability: {
        totalRooms: { type: Number, default: 0 },
        availableRooms: { type: Number, default: 0 },
        occupiedRooms: { type: Number, default: 0 },
        reservedRooms: { type: Number, default: 0 },
        cancelledRooms: { type: Number, default: 0 }
    },

    // --- Room Details ---
    roomDetails: {
        roomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.ROOM_TYPES), default: PACKAGE.ACCOMMODATION.ROOM_TYPES.STANDARD, required: true },
        roomSizeSqFt: { type: Number, default: 0 },
        bedType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BED_TYPES), default: PACKAGE.ACCOMMODATION.BED_TYPES.DOUBLE },
        view: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.VIEW_TYPES), default: PACKAGE.ACCOMMODATION.VIEW_TYPES.CITY },
        isAC: { type: Boolean, default: true },
        hasBalcony: { type: Boolean, default: false }
    },

    // --- Pricing & Capacity ---
    pricing: {
        pricePerNight: priceWithDecimal,
        maxGuestPerRoom: { type: Number, default: 2 },
        maxAdults: { type: Number, default: 2 },
        maxChildren: { type: Number, default: 1 },
        childPrice: optionalPriceWithDecimal,
        extraBedAvailable: { type: Boolean, default: false },
        extraBedPrice: optionalPriceWithDecimal
    },

    // --- Timings ---
    timings: {
        checkIn: { type: String, default: '02:00 PM' },
        checkOut: { type: String, default: '11:00 AM' },
    },

    // --- Policies ---
    policies: {
        cancellationPolicy: { type: String, default: 'Free cancellation up to 24 hours before check-in.' },
        isCouplesFriendly: { type: Boolean, default: true },
        isPetFriendly: { type: Boolean, default: false },
        isSmokingAllowed: { type: Boolean, default: false },
        requiresLocalID: { type: Boolean, default: false }
    },

    amenities: { type: String, default: 'WiFi, TV, AC, Geyser' }, 
    mealsIncluded: { type: Boolean, default: false },
    mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

    // --- Location Details ---
    location: {
        address: { type: String, required: true, default: '' },
        latitude: { type: String, default: null },
        longitude: { type: String, default: null },
        coordinates: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        }
    },

    // --- Media ---
    photos: [{
        url: { type: String, default: '' },
        type: { type: String, default: '' }
    }],

    seoMetadata: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: { type: String, default: '' }
    }

}, { toJSON: { getters: true }, toObject: { getters: true } });











// --- Dynamic Schema Sync Hooks ---
HotelSchema.pre('save', function() {
    if (this.availability) {
        calculateAvailability(this.availability);
    }
    if (this.fleetAvailability) {
        calculateAvailability(this.fleetAvailability);
    }
    
    // Explicit Location Sync for Mongoose Persistence
    if (this.location && (this.location.latitude || this.location.longitude)) {
        const lat = parseFloat(this.location.latitude);
        const lng = parseFloat(this.location.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
            this.set('location.coordinates', {
                type: 'Point',
                coordinates: [lng, lat]
            });
        }
    }
});

export default HotelSchema;
