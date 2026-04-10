import { calculateAvailability } from '../../Helpers/availability.js';
import { mapToGeoJSON } from '../../Helpers/geoUtils.js';
import mongoose from 'mongoose';
import { PACKAGE } from '@/constants/index.js';

const optionalPriceWithDecimal = { type: Number, default: 0, min: 0, get: (v) => (Math.round(v * 100) / 100).toFixed(2), set: (v) => Math.round(v * 100) / 100 };

const VehicleRentalSchema = new mongoose.Schema({
  title: { type: String, required: true, default: '' },
  description: { type: String, required: true, default: '' },
  isActive: { type: Boolean, default: true },

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
    model: { type: String, default: '' },
    brand: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    transmission: { type: String, enum: Object.values(PACKAGE.TRANSPORT.TRANSMISSION_TYPES), default: PACKAGE.TRANSPORT.TRANSMISSION_TYPES.MANUAL },
    seats: { type: Number, default: 2 },
    fuelPolicy: { type: String, enum: Object.values(PACKAGE.TRANSPORT.FUEL_POLICIES), default: PACKAGE.TRANSPORT.FUEL_POLICIES.FULL_TO_FULL },
    acAvailable: { type: Boolean, default: true },
    luggageCapacity: { type: Number, default: 0 },
    isDriverIncluded: { type: Boolean, default: false }
  },

  policies: {
    minAge: { type: Number, default: 18 },
    drivingLicenseRequired: { type: Boolean, default: true },
    securityDeposit: { type: String, default: '' },
    lateReturnFee: { type: String, default: '' },
    cancellationPolicy: { type: String, default: '' },
    pickupRequirements: { type: String, default: '' },
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

  features: { type: String, default: '' },

  photos: [{ url: { type: String, default: '' }, type: { type: String, default: '' } }],
  seoMetadata: {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    keywords: { type: String, default: '' }
  }
}, { toJSON: { getters: true }, toObject: { getters: true } });











// --- Dynamic Schema Sync Hooks ---
VehicleRentalSchema.pre('save', function () {
  if (this.availability) calculateAvailability(this.availability);
  if (this.fleetAvailability) calculateAvailability(this.fleetAvailability);
  if (this.location) {
    mapToGeoJSON(this.location);
    if (typeof this.markModified === 'function') this.markModified('location');
  }
});

export default VehicleRentalSchema;
