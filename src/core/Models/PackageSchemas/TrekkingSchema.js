import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const TrekkingSchema = new mongoose.Schema({
  title: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  description: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE },

  availability: {
    totalSlots: { type: Number, default: 0 },
    availableSlots: { type: Number, default: 0 },
    bookedSlots: { type: Number, default: 0 },
    cancelledSlots: { type: Number, default: 0 }
  },

  pricing: {
    pricePerPerson: optionalPriceWithDecimal,
    porterPricePerDay: optionalPriceWithDecimal,
  },

  details: {
    trekType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.TREK_TYPES), default: PACKAGE.ACTIVITY.TREK_TYPES.DAY_TREK },
    difficultyLevel: { type: String, enum: Object.values(PACKAGE.DIFFICULTY), default: PACKAGE.DIFFICULTY.EASY },
    bestSeason: { type: String, enum: Object.values(PACKAGE.SEASONS), default: PACKAGE.SEASONS.ALL_YEAR },
    duration: { type: String, default: DEFAULTS.NULL },
    maxAltitude: { type: String, default: DEFAULTS.NULL },
    trekDistance: { type: String, default: DEFAULTS.NULL },
    guideAvailable: { type: Boolean, default: DEFAULTS.TRUE },
    porterAvailable: { type: Boolean, default: DEFAULTS.FALSE },
    muleAvailable: { type: Boolean, default: DEFAULTS.FALSE },
    minAge: { type: Number, default: 12 },
    fitnessLevelRequired: { type: String, default: DEFAULTS.NULL },
    startPoint: {
      name: { type: String, default: DEFAULTS.NULL },
      latitude: { type: String, default: DEFAULTS.NULL },
      longitude: { type: String, default: DEFAULTS.NULL },
      coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
      }
    },
    endPoint: {
      name: { type: String, default: DEFAULTS.NULL },
      latitude: { type: String, default: DEFAULTS.NULL },
      longitude: { type: String, default: DEFAULTS.NULL },
      coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
      }
    },
    baseCamp: { type: String, default: DEFAULTS.NULL },
    pickupPoint: { type: String, default: DEFAULTS.NULL },
    dropPoint: { type: String, default: DEFAULTS.NULL },
    inclusions: { type: String, default: DEFAULTS.NULL },
    exclusions: { type: String, default: DEFAULTS.NULL },
  },

  timings: {
    departureTime: { type: String, default: '06:00 AM' },
    reportingTime: { type: String, default: '05:30 AM' },
  },

  itinerary: [{
    day: { type: Number, default: 1 },
    title: { type: String, default: DEFAULTS.NULL },
    description: { type: String, default: DEFAULTS.NULL }
  }],

  policies: {
    thingsToCarry: { type: String, default: DEFAULTS.NULL },
    healthAdvisory: { type: String, default: DEFAULTS.NULL },
    cancellationPolicy: { type: String, default: DEFAULTS.NULL },
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
  toObject: { getters: DEFAULTS.TRUE, virtuals: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default TrekkingSchema;
