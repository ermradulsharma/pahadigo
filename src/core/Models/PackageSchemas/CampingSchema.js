import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, CommonPolicies, MealsAndAmenities, optionalPriceDecimal, AccommodationTimings, AccommodationPolicies, AccommodationPricing } from './BasePackageSchema.js';

const CampingSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  details: {
    campingType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.CAMPING_TYPES), default: PACKAGE.ACTIVITY.CAMPING_TYPES.RIVERSIDE },
    bathroomType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.BATHROOM_TYPES), default: PACKAGE.ACCOMMODATION.BATHROOM_TYPES.SHARED },
  },
  pricing: AccommodationPricing,
  policies: {
    ...AccommodationPolicies,
    isBonfireAllowed: { type: Boolean, default: DEFAULTS.FALSE }
  }
}, BasePackageOptions);

export default CampingSchema;
