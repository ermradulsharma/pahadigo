import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const ParaglidingSchema = new mongoose.Schema({

  title: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  description: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE },

  availability: {
    totalFlights: { type: Number, default: 0 },
    availableFlights: { type: Number, default: 0 },
    bookedFlights: { type: Number, default: 0 },
    cancelledFlights: { type: Number, default: 0 }
  },

  pricing: {
    pricePerPerson: optionalPriceWithDecimal,
  },

  details: {
    siteName: { type: String, default: DEFAULTS.NULL },
    flyType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.PARAGLIDING_TYPES), default: PACKAGE.ACTIVITY.PARAGLIDING_TYPES.SHORT_FLY },
    duration: { type: String, default: DEFAULTS.NULL },
    heightFeet: { type: Number, default: 0 },
    videoIncluded: { type: Boolean, default: DEFAULTS.FALSE },
    transferIncluded: { type: Boolean, default: DEFAULTS.FALSE },
    pilotExperience: { type: String, default: DEFAULTS.NULL },
    goproExcludedPrice: { type: Number, default: 0 }
  },

  timings: {
    departureTime: { type: String, default: '06:00 AM' },
    reportingTime: { type: String, default: '05:30 AM' },
  },

  policies: {
    minAge: { type: Number, default: 0 },
    maxWeightKg: { type: Number, default: 0 },
    healthAdvisory: { type: String, default: DEFAULTS.NULL },
    cancellationPolicy: { type: String, default: DEFAULTS.NULL },
  },

  location: {
    address: { type: String, default: DEFAULTS.NULL },
    latitude: { type: String, default: null },
    longitude: { type: String, default: null },
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

export default ParaglidingSchema;
