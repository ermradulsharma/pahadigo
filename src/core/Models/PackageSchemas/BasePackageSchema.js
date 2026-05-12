import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

export const optionalPriceDecimal = { type: Number, default: DEFAULTS.COUNTS.ZERO, min: DEFAULTS.COUNTS.ZERO, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };
export const priceDecimalRequired = { type: Number, required: DEFAULTS.TRUE, default: DEFAULTS.COUNTS.ZERO, min: DEFAULTS.COUNTS.ZERO, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

export const PointLocation = {
  name: { type: String, default: DEFAULTS.NULL },
  latitude: { type: String, default: DEFAULTS.NULL },
  longitude: { type: String, default: DEFAULTS.NULL },
  coordinates: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  }
};

// Policy:
export const CommonPolicies = {
  cancellationPolicy: { type: String, default: DEFAULTS.NULL },
  instructions: { type: String, default: DEFAULTS.NULL }
};

export const AccommodationPolicies = {
  ...CommonPolicies,
  isCouplesFriendly: { type: Boolean, default: DEFAULTS.FALSE },
  isPetFriendly: { type: Boolean, default: DEFAULTS.FALSE },
  isSmokingAllowed: { type: Boolean, default: DEFAULTS.FALSE },
  isMusicAllowed: { type: Boolean, default: DEFAULTS.FALSE }
};

export const ActivityPolicies = {
  ...CommonPolicies,
  medicalCertificate: { type: Boolean, default: DEFAULTS.FALSE }
};

export const TransportPolicy = {
  ...CommonPolicies
};

// Itinerary:
export const CommonItinerary = [{
  day: { type: String, default: DEFAULTS.NULL },
  title: { type: String, default: DEFAULTS.NULL },
  description: { type: String, default: DEFAULTS.NULL }
}];

export const MealsAndAmenities = {
  amenities: { type: String, default: DEFAULTS.NULL },
  mealsIncluded: { type: Boolean, default: DEFAULTS.TRUE },
  mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS }
};

export const BasePackageFields = {
  title: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL, required: DEFAULTS.TRUE },
  slug: { type: String, trim: DEFAULTS.TRUE, default: DEFAULTS.NULL, required: DEFAULTS.TRUE },
  description: { type: String, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE },

  availability: {
    total: { type: Number, default: DEFAULTS.COUNTS.ZERO },
    available: { type: Number, default: DEFAULTS.COUNTS.ZERO },
    occupied: { type: Number, default: DEFAULTS.COUNTS.ZERO },
    reserved: { type: Number, default: DEFAULTS.COUNTS.ZERO }
  },

  pricing: {
    basePrice: priceDecimalRequired,
  },

  location: {
    address: { type: String, default: DEFAULTS.NULL },
    latitude: { type: String, default: DEFAULTS.NULL },
    longitude: { type: String, default: DEFAULTS.NULL },
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },

  photos: [{
    url: { type: String, default: DEFAULTS.NULL },
    type: { type: String, default: DEFAULTS.NULL }
  }],
};

export const AccommodationPricing = {
  ...BasePackageFields.pricing,
  maxGuests: { type: Number, default: DEFAULTS.COUNTS.ZERO },
  maxAdults: { type: Number, default: DEFAULTS.COUNTS.ZERO },
  maxChildren: { type: Number, default: DEFAULTS.COUNTS.ZERO },
  childPrice: optionalPriceDecimal,
  extraBedAvailable: { type: Boolean, default: DEFAULTS.FALSE },
  extraBedPrice: optionalPriceDecimal
};

export const AccommodationRoomDetails = {
  roomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.ROOM_TYPES), default: PACKAGE.ACCOMMODATION.ROOM_TYPES.STANDARD },
  bedType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BED_TYPES), default: PACKAGE.ACCOMMODATION.BED_TYPES.DOUBLE },
  bathroomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BATHROOM_TYPES), default: PACKAGE.ACCOMMODATION.BATHROOM_TYPES.PRIVATE },
  checkInTime: { type: String, default: DEFAULTS.NULL },
  checkOutTime: { type: String, default: DEFAULTS.NULL },
};

export const BasePackageOptions = {
  timestamps: DEFAULTS.TRUE,
  toJSON: { getters: DEFAULTS.TRUE, virtuals: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { getters: DEFAULTS.TRUE, virtuals: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
};
