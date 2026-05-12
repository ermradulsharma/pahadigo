import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, CommonPolicies, MealsAndAmenities, optionalPriceDecimal, AccommodationPolicies, AccommodationPricing, AccommodationRoomDetails } from './BasePackageSchema.js';

const HomestaySchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  type: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOMESTAY_TYPES), default: PACKAGE.ACCOMMODATION.HOMESTAY_TYPES.COTTAGE },
  details: {
    ...AccommodationRoomDetails,
    rentalType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.RENTAL_TYPES), default: PACKAGE.ACCOMMODATION.RENTAL_TYPES.PRIVATE_ROOM },
  },
  pricing: AccommodationPricing,
  policies: AccommodationPolicies
}, BasePackageOptions);

export default HomestaySchema;
