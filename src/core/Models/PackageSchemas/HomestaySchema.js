import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const optionalPriceWithDecimal = { 
    type: Number, 
    default: 0, 
    min: 0, 
    get: (v) => (Math.round(v * 100) / 100).toFixed(2), 
    set: (v) => Math.round(v * 100) / 100 
};

const HomestaySchema = new mongoose.Schema({
    // --- Basic Info ---
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },

    // --- Type & Classification ---
    homestayType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOMESTAY_TYPES), default: PACKAGE.ACCOMMODATION.HOMESTAY_TYPES.COTTAGE, required: true },

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
        rentalType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.RENTAL_TYPES), default: PACKAGE.ACCOMMODATION.RENTAL_TYPES.PRIVATE_ROOM },
        roomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.ROOM_TYPES), default: PACKAGE.ACCOMMODATION.ROOM_TYPES.STANDARD, required: true },
        roomSize: { type: Number },
        bedType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BED_TYPES), default: PACKAGE.ACCOMMODATION.BED_TYPES.DOUBLE },
        bathroomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BATHROOM_TYPES), default: PACKAGE.ACCOMMODATION.BATHROOM_TYPES.PRIVATE },
        baths: { type: Number, default: 1 },
        balcony: { type: Boolean, default: false },
        view: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.VIEW_TYPES), default: PACKAGE.ACCOMMODATION.VIEW_TYPES.MOUNTAIN }
    },

    // --- Pricing & Capacity ---
    pricing: {
        pricePerNight: optionalPriceWithDecimal,
        maxGuestPerRoom: { type: Number, default: 2 },
        maxAdults: { type: Number, default: 2 },
        maxChildren: { type: Number, default: 1 },
        childPrice: optionalPriceWithDecimal,
        extraBedAvailable: { type: Boolean, default: false },
        extraBedPrice: optionalPriceWithDecimal
    },

    // --- Timings ---
    timings: {
        checkIn: { type: String, default: '12:00 PM' },
        checkOut: { type: String, default: '11:00 AM' },
    },

    // --- Policies ---
    policies: {
        houseRules: { type: String, default: '' },
        cancellationPolicy: { type: String, default: '' },
        isCouplesFriendly: { type: Boolean, default: false },
        isPetFriendly: { type: Boolean, default: false },
        isSmokingAllowed: { type: Boolean, default: false },
    },

    amenities: { type: String, default: '' },
    mealsIncluded: { type: Boolean, default: true },
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

export default HomestaySchema;
