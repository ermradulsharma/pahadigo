import mongoose from 'mongoose';
import { BasePackageFields, BasePackageOptions, MealsAndAmenities, AccommodationPolicies, AccommodationPricing } from './BasePackageSchema.js';
import { HomestayDetails } from './Package/Accommodation.js';

const HomestaySchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  details: HomestayDetails,
  pricing: AccommodationPricing,
  policies: AccommodationPolicies
}, BasePackageOptions);

export default HomestaySchema;
