import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const ChardhamTourSchema = new mongoose.Schema({

  title: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  description: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE },

  availability: {
    totalSeats: { type: Number, default: 0 },
    availableSeats: { type: Number, default: 0 },
    bookedSeats: { type: Number, default: 0 },
    reservedSeats: { type: Number, default: 0 },
    cancelledSeats: { type: Number, default: 0 }
  },

  pricing: {
    pricePerPerson: optionalPriceWithDecimal,
    infantPrice: optionalPriceWithDecimal,
  },

  tourDetails: {
    tourName: { type: String, default: DEFAULTS.NULL },
    duration: { type: String, default: DEFAULTS.NULL },
    placesCovered: { type: String, default: DEFAULTS.NULL },
    bestSeason: { type: String, enum: Object.values(PACKAGE.SEASONS), default: PACKAGE.SEASONS.ALL_YEAR },
    transportType: { type: String, enum: [...Object.values(PACKAGE.TRANSPORT.TOUR_MODE), ...Object.values(PACKAGE.TRANSPORT.CHARDHAM_VEHICLE_CATEGORIES)] },
    hotelType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOTEL_TYPES), default: PACKAGE.ACCOMMODATION.HOTEL_TYPES.BUDGET },
    nightStayLocations: { type: String, default: DEFAULTS.NULL },
    inclusions: { type: String, default: DEFAULTS.NULL },
    exclusions: { type: String, default: DEFAULTS.NULL },
    helicopterIncluded: { type: Boolean, default: DEFAULTS.FALSE },
    yatraStartsFrom: { type: String, default: 'Haridwar' },
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
    medicalCertificateRequired: { type: Boolean, default: DEFAULTS.TRUE },
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
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default ChardhamTourSchema;
