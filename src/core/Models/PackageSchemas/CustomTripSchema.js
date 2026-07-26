import mongoose from 'mongoose';
import { BasePackageFields, TransportPricing, BasePackageOptions, TransportPolicy } from './BasePackageSchema.js';
import { CustomTripDetails } from './Package/Transport.js';

const CustomTripSchema = new mongoose.Schema({
  ...BasePackageFields,
  pricing: TransportPricing,
  details: CustomTripDetails,
  policies: TransportPolicy
}, BasePackageOptions);

export default CustomTripSchema;
