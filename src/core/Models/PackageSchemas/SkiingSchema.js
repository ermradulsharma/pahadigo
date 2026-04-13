import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const SkiingSchema = new mongoose.Schema({
  title: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  description: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE },

  availability: {
    totalPasses: { type: Number, default: 0 },
    availablePasses: { type: Number, default: 0 },
    bookedPasses: { type: Number, default: 0 }
  },

  pricing: {
    pricePerPerson: optionalPriceWithDecimal,
  },

  details: {
    slopeName: { type: String, default: DEFAULTS.NULL },
    difficultyLevel: { type: String, enum: Object.values(PACKAGE.ACTIVITY.SKI_DIFFICULTY), default: PACKAGE.ACTIVITY.SKI_DIFFICULTY.BEGINNER },
    duration: { type: String, default: DEFAULTS.NULL },
    instructorIncluded: { type: Boolean, default: DEFAULTS.TRUE },
    equipmentIncluded: { type: Boolean, default: DEFAULTS.TRUE },
    videoIncluded: { type: Boolean, default: DEFAULTS.FALSE },
    skiLiftPassIncluded: { type: Boolean, default: DEFAULTS.FALSE }
  },

  timings: {
    reportingTime: { type: String, default: '09:00 AM' },
  },

  policies: {
    minAge: { type: Number, default: 0 },
    healthAdvisory: { type: String, default: DEFAULTS.NULL },
    thingsToCarry: { type: String, default: DEFAULTS.NULL },
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
  toJSON: { getters: DEFAULTS.TRUE, virtuals: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { getters: DEFAULTS.TRUE, virtuals: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default SkiingSchema;
