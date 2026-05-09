import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, optionalPriceDecimal, TransportPolicy } from './BasePackageSchema.js';

const CustomTripSchema = new mongoose.Schema({
  ...BasePackageFields,

  pricing: {
    ...BasePackageFields.pricing,
    pricePerKm: optionalPriceDecimal,
    pricePerDay: optionalPriceDecimal,
  },

  details: {
    serviceType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.CUSTOM_TRIP_SERVICE_TYPES), default: PACKAGE.TRANSPORT.CUSTOM_TRIP_SERVICE_TYPES.POINT_TO_POINT },
    vehicleName: { type: String, default: DEFAULTS.NULL },
    vehicleType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.VEHICLE_TYPES), default: PACKAGE.TRANSPORT.VEHICLE_TYPES.BIKE },
  },
  policies: TransportPolicy
}, BasePackageOptions);

export default CustomTripSchema;
