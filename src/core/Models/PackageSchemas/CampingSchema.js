import mongoose from 'mongoose';
import { DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, MealsAndAmenities, AccommodationPolicies, AccommodationPricing } from './BasePackageSchema.js';
import { CampingDetails } from './Package/Accommodation.js';

const CampingSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  details: CampingDetails,
  pricing: AccommodationPricing,
  policies: {
    ...AccommodationPolicies,
    isBonfireAllowed: { type: Boolean, default: DEFAULTS.FALSE }
  }
}, BasePackageOptions);

export default CampingSchema;
