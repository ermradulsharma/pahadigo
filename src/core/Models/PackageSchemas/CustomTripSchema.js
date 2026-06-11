import mongoose from 'mongoose';
import { BasePackageFields, BasePackageOptions, TransportPolicy } from './BasePackageSchema.js';
import { CustomTripDetails } from './Package/Transport.js';

const CustomTripSchema = new mongoose.Schema({
  ...BasePackageFields,
  pricing: BasePackageFields.pricing,
  details: CustomTripDetails,
  policies: TransportPolicy
}, BasePackageOptions);

export default CustomTripSchema;
