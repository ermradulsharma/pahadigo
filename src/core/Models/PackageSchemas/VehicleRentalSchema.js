import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, TransportPolicy, optionalPriceDecimal } from './BasePackageSchema.js';

const VehicleRentalSchema = new mongoose.Schema({
  ...BasePackageFields,
  isDriverIncluded: { type: Boolean, default: DEFAULTS.FALSE },
  pricing: {
    ...BasePackageFields.pricing,
    depositAmount: optionalPriceDecimal
  },
  details: {
    vehicleType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.VEHICLE_TYPES), default: PACKAGE.TRANSPORT.VEHICLE_TYPES.BIKE },
    vehicleName: { type: String, default: DEFAULTS.NULL },
  },
  policies: {
    ...TransportPolicy,
    minAge: { type: Number, default: 18 },
    drivingLicense: { type: Boolean, default: DEFAULTS.FALSE }
  }
}, BasePackageOptions);

export default VehicleRentalSchema;
