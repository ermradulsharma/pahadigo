import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const CustomTripSchema = new mongoose.Schema({

  title: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  description: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE },
  pricing: {
    baseFare: optionalPriceWithDecimal,
    pricePerKm: optionalPriceWithDecimal,
    pricePerDay: optionalPriceWithDecimal,
  },

  details: {
    serviceType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.CUSTOM_TRIP_SERVICE_TYPES), default: PACKAGE.TRANSPORT.CUSTOM_TRIP_SERVICE_TYPES.POINT_TO_POINT },
    vehicleType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.VEHICLE_TYPES), default: PACKAGE.TRANSPORT.VEHICLE_TYPES.BIKE },
    vehicleModel: { type: String, default: DEFAULTS.NULL },
    isACAvailable: { type: Boolean, default: DEFAULTS.FALSE },
    maxLuggageCapacity: { type: Number, default: 0 },
    operatingRadiusKm: { type: Number, default: 0 }
  },

  timings: {
    availableFrom: { type: String, default: '06:00 AM' },
    availableTo: { type: String, default: '10:00 PM' }
  },

  policies: {
    nightChargeApplicable: { type: Boolean, default: DEFAULTS.FALSE },
    smokingAllowed: { type: Boolean, default: DEFAULTS.FALSE },
    petFriendly: { type: Boolean, default: DEFAULTS.FALSE },
    cancellationPolicy: { type: String, default: '24 hours cancellation policy' }
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

export default CustomTripSchema;
