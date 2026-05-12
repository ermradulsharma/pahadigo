import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, CommonPolicies, MealsAndAmenities, optionalPriceDecimal, AccommodationPolicies, AccommodationPricing, AccommodationRoomDetails } from './BasePackageSchema.js';

const HotelSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  type: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOTEL_TYPES), default: PACKAGE.ACCOMMODATION.HOTEL_TYPES.BUDGET },
  details: AccommodationRoomDetails,
  pricing: AccommodationPricing,
  policies: AccommodationPolicies
}, BasePackageOptions);

export default HotelSchema;
