import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const CampingSchema = new mongoose.Schema({

  title: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  description: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE },

  availability: {
    totalTents: { type: Number, default: 0 },
    availableTents: { type: Number, default: 0 },
    occupiedTents: { type: Number, default: 0 },
    reservedTents: { type: Number, default: 0 },
    cancelledTents: { type: Number, default: 0 }
  },

  pricing: {
    pricePerPerson: optionalPriceWithDecimal,
    maxGuests: { type: Number, default: 2 },
    maxAdults: { type: Number, default: 2 },
    maxChildren: { type: Number, default: 1 },
    childPrice: optionalPriceWithDecimal,
    extraBedAvailable: { type: Boolean, default: DEFAULTS.FALSE },
    extraBedPrice: optionalPriceWithDecimal,
  },

  details: {
    campingType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.CAMPING_TYPES), default: PACKAGE.ACTIVITY.CAMPING_TYPES.RIVERSIDE },
    bathroomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BATHROOM_TYPES), default: PACKAGE.ACCOMMODATION.BATHROOM_TYPES.SHARED },
    electricityAvailable: { type: Boolean, default: DEFAULTS.FALSE },
    activitiesIncluded: { type: String, default: DEFAULTS.NULL },
  },

  timings: {
    checkIn: { type: String, default: '12:00 PM' },
    checkOut: { type: String, default: '11:00 AM' },
  },

  policies: {
    campingRules: { type: String, default: DEFAULTS.NULL },
    campingSafetyRules: { type: String, default: DEFAULTS.NULL },
    cancellationPolicy: { type: String, default: DEFAULTS.NULL },
    isCouplesFriendly: { type: Boolean, default: DEFAULTS.FALSE },
    isPetFriendly: { type: Boolean, default: DEFAULTS.FALSE },
    isSmokingAllowed: { type: Boolean, default: DEFAULTS.FALSE },
    isCampfireAllowed: { type: Boolean, default: DEFAULTS.FALSE },
    isMusicAllowed: { type: Boolean, default: DEFAULTS.FALSE }
  },

  location: {
    address: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
    latitude: { type: String, default: DEFAULTS.NULL },
    longitude: { type: String, default: DEFAULTS.NULL },
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },

  amenities: { type: String, default: DEFAULTS.NULL },
  mealsIncluded: { type: Boolean, default: DEFAULTS.TRUE },
  mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

  photos: [{ url: { type: String, default: DEFAULTS.NULL }, type: { type: String, default: DEFAULTS.NULL } }],
  seoMetadata: {
    metaTitle: { type: String, default: DEFAULTS.NULL },
    metaDescription: { type: String, default: DEFAULTS.NULL },
    keywords: { type: String, default: DEFAULTS.NULL }
  }
}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { getters: DEFAULTS.TRUE, virtuals: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default CampingSchema;
