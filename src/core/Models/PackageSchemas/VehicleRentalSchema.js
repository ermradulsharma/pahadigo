import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const VehicleRentalSchema = new mongoose.Schema({
  title: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  description: { type: String, required: DEFAULTS.TRUE, default: DEFAULTS.NULL },
  isActive: { type: Boolean, default: DEFAULTS.TRUE },

  fleetAvailability: {
    totalVehicles: { type: Number, default: 0 },
    availableVehicles: { type: Number, default: 0 },
    rentedVehicles: { type: Number, default: 0 },
    maintenanceVehicles: { type: Number, default: 0 }
  },

  pricing: {
    pricePerDay: optionalPriceWithDecimal,
    pricePerHour: optionalPriceWithDecimal,
    depositAmount: optionalPriceWithDecimal,
    driverBatthaPerDay: optionalPriceWithDecimal,
  },

  vehicleDetails: {
    vehicleType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.VEHICLE_TYPES), default: PACKAGE.TRANSPORT.VEHICLE_TYPES.BIKE },
    model: { type: String, default: DEFAULTS.NULL },
    brand: { type: String, default: DEFAULTS.NULL },
    year: { type: Number, default: new Date().getFullYear() },
    transmission: { type: String, enum: Object.values(PACKAGE.TRANSPORT.TRANSMISSION_TYPES), default: PACKAGE.TRANSPORT.TRANSMISSION_TYPES.MANUAL },
    seats: { type: Number, default: 2 },
    fuelPolicy: { type: String, enum: Object.values(PACKAGE.TRANSPORT.FUEL_POLICIES), default: PACKAGE.TRANSPORT.FUEL_POLICIES.FULL_TO_FULL },
    acAvailable: { type: Boolean, default: DEFAULTS.TRUE },
    luggageCapacity: { type: Number, default: 0 },
    isDriverIncluded: { type: Boolean, default: DEFAULTS.FALSE }
  },

  policies: {
    minAge: { type: Number, default: 18 },
    drivingLicenseRequired: { type: Boolean, default: DEFAULTS.TRUE },
    securityDeposit: { type: String, default: DEFAULTS.NULL },
    lateReturnFee: { type: String, default: DEFAULTS.NULL },
    cancellationPolicy: { type: String, default: DEFAULTS.NULL },
    pickupRequirements: { type: String, default: DEFAULTS.NULL },
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

  features: { type: String, default: DEFAULTS.NULL },

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

export default VehicleRentalSchema;
