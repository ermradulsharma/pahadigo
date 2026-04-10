import { calculateAvailability } from '../../Helpers/availability.js';
import { mapToGeoJSON } from '../../Helpers/geoUtils.js';
import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const TrekkingSchema = new mongoose.Schema({
  title: { type: String, required: true, default: '' },
  description: { type: String, required: true, default: '' },
  isActive: { type: Boolean, default: true },

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
    duration: { type: String, default: '' },
    maxAltitude: { type: String, default: '' },
    trekDistance: { type: String, default: '' },
    guideAvailable: { type: Boolean, default: true },
    porterAvailable: { type: Boolean, default: false },
    muleAvailable: { type: Boolean, default: false },
    minAge: { type: Number, default: 12 },
    fitnessLevelRequired: { type: String, default: '' },
    startPoint: {
      name: { type: String, default: '' },
      latitude: { type: String, default: null },
      longitude: { type: String, default: null },
      coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
      }
    },
    endPoint: {
      name: { type: String, default: '' },
      latitude: { type: String, default: null },
      longitude: { type: String, default: null },
      coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
      }
    },
    baseCamp: { type: String, default: '' },
    pickupPoint: { type: String, default: '' },
    dropPoint: { type: String, default: '' },
    inclusions: { type: String, default: '' },
    exclusions: { type: String, default: '' },
  },

  timings: {
    departureTime: { type: String, default: '06:00 AM' },
    reportingTime: { type: String, default: '05:30 AM' },
  },

  itinerary: [{
    day: { type: Number, default: 1 },
    title: { type: String, default: '' },
    description: { type: String, default: '' }
  }],

  policies: {
    thingsToCarry: { type: String, default: '' },
    healthAdvisory: { type: String, default: '' },
    cancellationPolicy: { type: String, default: '' },
  },

  location: {
    address: { type: String, required: true, default: '' },
    latitude: { type: String, default: null },
    longitude: { type: String, default: null },
    coordinates: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    }
  },

  amenities: { type: String, default: '' },
  mealsIncluded: { type: Boolean, default: true },
  mealType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.MEAL_TYPES), default: PACKAGE.ACCOMMODATION.MEAL_TYPES.NO_MEALS },

  photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],

  seoMetadata: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    keywords: { type: String, default: '' }
  }
}, { toJSON: { getters: true }, toObject: { getters: true } });











// --- Dynamic Schema Sync Hooks ---
TrekkingSchema.pre('save', function () {
  if (this.availability) calculateAvailability(this.availability);
  if (this.fleetAvailability) calculateAvailability(this.fleetAvailability);
  if (this.location) {
    mapToGeoJSON(this.location);
    if (typeof this.markModified === 'function') this.markModified('location');
  }
});

export default TrekkingSchema;
