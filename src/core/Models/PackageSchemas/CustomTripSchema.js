import { calculateAvailability } from '../../Helpers/availability.js';
import { mapToGeoJSON } from '../../Helpers/geoUtils.js';
import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const CustomTripSchema = new mongoose.Schema({

  title: { type: String, required: true, default: '' },
  description: { type: String, required: true, default: '' },
  isActive: { type: Boolean, default: true },



  pricing: {
    baseFare: optionalPriceWithDecimal,
    pricePerKm: optionalPriceWithDecimal,
    pricePerDay: optionalPriceWithDecimal,
  },

  details: {
    serviceType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.CUSTOM_TRIP_SERVICE_TYPES), default: PACKAGE.TRANSPORT.CUSTOM_TRIP_SERVICE_TYPES.POINT_TO_POINT },
    vehicleType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.VEHICLE_TYPES), default: PACKAGE.TRANSPORT.VEHICLE_TYPES.BIKE },
    vehicleModel: { type: String, default: '' },
    isACAvailable: { type: Boolean, default: false },
    maxLuggageCapacity: { type: Number, default: 0 },
    operatingRadiusKm: { type: Number, default: 0 }
  },

  timings: {
    availableFrom: { type: String, default: '06:00 AM' },
    availableTo: { type: String, default: '10:00 PM' }
  },

  policies: {
    nightChargeApplicable: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
    petFriendly: { type: Boolean, default: false },
    cancellationPolicy: { type: String, default: '24 hours cancellation policy' }
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

  photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
  seoMetadata: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    keywords: { type: String, default: '' }
  }
}, { toJSON: { getters: true }, toObject: { getters: true } });











// --- Dynamic Schema Sync Hooks ---
CustomTripSchema.pre('save', function () {
  if (this.availability) calculateAvailability(this.availability);
  if (this.fleetAvailability) calculateAvailability(this.fleetAvailability);
  if (this.location) {
    mapToGeoJSON(this.location);
    if (typeof this.markModified === 'function') this.markModified('location');
  }
});

export default CustomTripSchema;
