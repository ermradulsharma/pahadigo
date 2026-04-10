import { calculateAvailability } from '../../Helpers/availability.js';
import { mapToGeoJSON } from '../../Helpers/geoUtils.js';
import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const CampingSchema = new mongoose.Schema({

  title: { type: String, required: true, default: '' },
  description: { type: String, required: true, default: '' },
  isActive: { type: Boolean, default: true },

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
    extraBedAvailable: { type: Boolean, default: false },
    extraBedPrice: optionalPriceWithDecimal,
  },

  details: {
    campingType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.CAMPING_TYPES), default: PACKAGE.ACTIVITY.CAMPING_TYPES.RIVERSIDE },
    bathroomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BATHROOM_TYPES), default: PACKAGE.ACCOMMODATION.BATHROOM_TYPES.SHARED },
    electricityAvailable: { type: Boolean, default: false },
    activitiesIncluded: { type: String, default: '' },
  },

  timings: {
    checkIn: { type: String, default: '12:00 PM' },
    checkOut: { type: String, default: '11:00 AM' },
  },

  policies: {
    campingRules: { type: String, default: '' },
    campingSafetyRules: { type: String, default: '' },
    cancellationPolicy: { type: String, default: '' },
    isCouplesFriendly: { type: Boolean, default: false },
    isPetFriendly: { type: Boolean, default: false },
    isSmokingAllowed: { type: Boolean, default: false },
    isCampfireAllowed: { type: Boolean, default: false },
    isMusicAllowed: { type: Boolean, default: false }
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
CampingSchema.pre('save', function () {
  if (this.availability) calculateAvailability(this.availability);
  if (this.fleetAvailability) calculateAvailability(this.fleetAvailability);
  if (this.location) {
    mapToGeoJSON(this.location);
    if (typeof this.markModified === 'function') this.markModified('location');
  }
});

export default CampingSchema;
