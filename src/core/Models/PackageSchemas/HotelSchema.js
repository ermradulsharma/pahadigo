import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

const priceWithDecimal = { type: Number, required: true, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };
const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const HotelSchema = new mongoose.Schema({
  // --- Basic Info ---
  title: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  description: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE },

  // --- Type & Classification ---
  hotelType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOTEL_TYPES), default: PACKAGE.ACCOMMODATION.HOTEL_TYPES.BUDGET, required: DEFAULTS.TRUE },
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
    roomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.ROOM_TYPES), default: PACKAGE.ACCOMMODATION.ROOM_TYPES.STANDARD, required: DEFAULTS.TRUE },
    roomSizeSqFt: { type: Number, default: 0 },
    bedType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BED_TYPES), default: PACKAGE.ACCOMMODATION.BED_TYPES.DOUBLE },
    view: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.VIEW_TYPES), default: PACKAGE.ACCOMMODATION.VIEW_TYPES.CITY },
    isAC: { type: Boolean, default: DEFAULTS.TRUE },
    hasBalcony: { type: Boolean, default: DEFAULTS.FALSE }
  },

  // --- Pricing & Capacity ---
  pricing: {
    pricePerNight: priceWithDecimal,
    maxGuestPerRoom: { type: Number, default: 2 },
    maxAdults: { type: Number, default: 2 },
    maxChildren: { type: Number, default: 1 },
    childPrice: optionalPriceWithDecimal,
    extraBedAvailable: { type: Boolean, default: DEFAULTS.FALSE },
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
    isCouplesFriendly: { type: Boolean, default: DEFAULTS.TRUE },
    isPetFriendly: { type: Boolean, default: DEFAULTS.FALSE },
    isSmokingAllowed: { type: Boolean, default: DEFAULTS.FALSE },
    requiresLocalID: { type: Boolean, default: DEFAULTS.FALSE }
  },

  amenities: { type: String, default: DEFAULTS.NULL },
  mealsIncluded: { type: Boolean, default: DEFAULTS.FALSE },
  mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

  // --- Location Details ---
  location: {
    address: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
    latitude: { type: String, default: DEFAULTS.NULL },
    longitude: { type: String, default: DEFAULTS.NULL },
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },

  // --- Media ---
  photos: [{
    url: { type: String, default: DEFAULTS.NULL },
    type: { type: String, default: DEFAULTS.NULL }
  }],

  seoMetadata: {
    metaTitle: { type: String, default: DEFAULTS.NULL },
    metaDescription: { type: String, default: DEFAULTS.NULL },
    keywords: { type: String, default: DEFAULTS.NULL }
  }

}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { getters: DEFAULTS.TRUE, virtuals: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { getters: DEFAULTS.TRUE, virtuals: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default HotelSchema;
