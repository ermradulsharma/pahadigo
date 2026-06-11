import mongoose from 'mongoose';
import { DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, TransportPolicy, optionalPriceDecimal } from './BasePackageSchema.js';
import { BikeScooterRentalDetails } from './Package/Transport.js';

const VehicleRentalSchema = new mongoose.Schema({
  ...BasePackageFields,
  isDriverIncluded: { type: Boolean, default: DEFAULTS.FALSE },
  pricing: {
    ...BasePackageFields.pricing,
    depositAmount: optionalPriceDecimal
  },
  details: BikeScooterRentalDetails,
  policies: {
    ...TransportPolicy,
    minAge: { type: Number, default: 18 },
    drivingLicense: { type: Boolean, default: DEFAULTS.FALSE }
  }
}, BasePackageOptions);

export default VehicleRentalSchema;
