import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

const optionalPriceWithDecimal = {
  type: Number,
  default: 0,
  min: 0,
  get: (v) => (Math.round(v * 100) / 100).toFixed(2),
  set: (v) => Math.round(v * 100) / 100
};

const HomestaySchema = new mongoose.Schema({
  // --- Basic Info ---
  title: { type: String, default: DEFAULTS.NULL },
  description: { type: String, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE },

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
    roomSize: { type: Number, default: 0 },
    bedType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BED_TYPES), default: PACKAGE.ACCOMMODATION.BED_TYPES.DOUBLE },
    bathroomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BATHROOM_TYPES), default: PACKAGE.ACCOMMODATION.BATHROOM_TYPES.PRIVATE },
    baths: { type: Number, default: 1 },
    balcony: { type: Boolean, default: DEFAULTS.FALSE },
    view: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.VIEW_TYPES), default: PACKAGE.ACCOMMODATION.VIEW_TYPES.MOUNTAIN }
  },

  // --- Pricing & Capacity ---
  pricing: {
    pricePerNight: optionalPriceWithDecimal,
    maxGuestPerRoom: { type: Number, default: 2 },
    maxAdults: { type: Number, default: 2 },
    maxChildren: { type: Number, default: 1 },
    childPrice: optionalPriceWithDecimal,
    extraBedAvailable: { type: Boolean, default: DEFAULTS.FALSE },
    extraBedPrice: optionalPriceWithDecimal
  },

  // --- Timings ---
  timings: {
    checkIn: { type: String, default: '12:00 PM' },
    checkOut: { type: String, default: '11:00 AM' },
  },

  // --- Policies ---
  policies: {
    houseRules: { type: String, default: DEFAULTS.NULL },
    cancellationPolicy: { type: String, default: DEFAULTS.NULL },
    isCouplesFriendly: { type: Boolean, default: DEFAULTS.FALSE },
    isPetFriendly: { type: Boolean, default: DEFAULTS.FALSE },
    isSmokingAllowed: { type: Boolean, default: DEFAULTS.FALSE },
  },

  amenities: { type: String, default: DEFAULTS.NULL },
  mealsIncluded: { type: Boolean, default: DEFAULTS.TRUE },
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
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default HomestaySchema;
