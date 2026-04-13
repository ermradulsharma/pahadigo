import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const BungeeSchema = new mongoose.Schema({

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
  },

  details: {
    jumpName: { type: String, default: DEFAULTS.NULL },
    jumpType: { type: String, default: 'Forward' },
    heightMeters: { type: Number, default: 0 },
    safetyStandards: { type: String, default: DEFAULTS.NULL },
    videoIncluded: { type: Boolean, default: DEFAULTS.FALSE },
    transferIncluded: { type: Boolean, default: DEFAULTS.FALSE },
  },

  timings: {
    departureTime: { type: String, default: '06:00 AM' },
    reportingTime: { type: String, default: '05:30 AM' },
  },

  policies: {
    minAge: { type: Number, default: 0 },
    weightLimitKg: { type: Number, default: 0 },
    thingsToCarry: { type: String, default: DEFAULTS.NULL },
    healthAdvisory: { type: String, default: DEFAULTS.NULL },
    cancellationPolicy: { type: String, default: DEFAULTS.NULL },
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
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});
export default BungeeSchema;
