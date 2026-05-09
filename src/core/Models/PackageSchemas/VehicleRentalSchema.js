import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, TransportPolicy, optionalPriceDecimal } from './BasePackageSchema.js';

const VehicleRentalSchema = new mongoose.Schema({
  ...BasePackageFields,
  isDriverIncluded: { type: Boolean, default: DEFAULTS.FALSE },
  pricing: {
    ...BasePackageFields.pricing,
    pricePerHour: optionalPriceDecimal,
    depositAmount: optionalPriceDecimal,
    driverAllowancePerDay: optionalPriceDecimal
  },
  details: {
    vehicleType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.VEHICLE_TYPES), default: PACKAGE.TRANSPORT.VEHICLE_TYPES.BIKE },
    transmission: { type: String, enum: Object.values(PACKAGE.TRANSPORT.TRANSMISSION_TYPES), default: PACKAGE.TRANSPORT.TRANSMISSION_TYPES.MANUAL },
    fuelPolicy: { type: String, enum: Object.values(PACKAGE.TRANSPORT.FUEL_POLICIES), default: PACKAGE.TRANSPORT.FUEL_POLICIES.FULL_TO_FULL },
    vehicleName: { type: String, default: DEFAULTS.NULL },
    seats: { type: String, default: DEFAULTS.NULL },
  },
  policies: {
    ...TransportPolicy,
    minAge: { type: Number, default: 18 },
    drivingLicense: { type: Boolean, default: DEFAULTS.FALSE }
  }
}, BasePackageOptions);

export default VehicleRentalSchema;
