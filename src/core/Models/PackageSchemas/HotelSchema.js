import mongoose from 'mongoose';
import { BasePackageFields, BasePackageOptions, MealsAndAmenities, AccommodationPolicies, AccommodationPricing } from './BasePackageSchema.js';
import { HotelDetails } from './Package/Accommodation.js';

const HotelSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  details: HotelDetails,
  pricing: AccommodationPricing,
  policies: AccommodationPolicies
}, BasePackageOptions);

export default HotelSchema;
