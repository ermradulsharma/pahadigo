import { calculateAvailability } from '../../Helpers/availability.js';
import { mapToGeoJSON } from '../../Helpers/geoUtils.js';
import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const BungeeSchema = new mongoose.Schema({

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
  },

  details: {
    jumpName: { type: String, default: '' },
    jumpType: { type: String, default: 'Forward' },
    heightMeters: { type: Number, default: 0 },
    safetyStandards: { type: String, default: '' },
    videoIncluded: { type: Boolean, default: false },
    transferIncluded: { type: Boolean, default: false },
  },

  timings: {
    departureTime: { type: String, default: '06:00 AM' },
    reportingTime: { type: String, default: '05:30 AM' },
  },

  policies: {
    minAge: { type: Number, default: 0 },
    weightLimitKg: { type: Number, default: 0 },
    thingsToCarry: { type: String, default: '' },
    healthAdvisory: { type: String, default: '' },
    cancellationPolicy: { type: String, default: '' },
  },

  location: {
    address: { type: String, default: null },
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
BungeeSchema.pre('save', function () {
  if (this.availability) calculateAvailability(this.availability);
  if (this.fleetAvailability) calculateAvailability(this.fleetAvailability);
  if (this.location) {
    mapToGeoJSON(this.location);
    if (typeof this.markModified === 'function') this.markModified('location');
  }
});

export default BungeeSchema;
