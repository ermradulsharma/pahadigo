import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, ActivityPolicies, PointLocation, CommonItinerary, MealsAndAmenities, optionalPriceDecimal } from './BasePackageSchema.js';

const ChardhamTourSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,

  pricing: BasePackageFields.pricing,

  details: {
    bestSeason: { type: String, enum: Object.values(PACKAGE.SEASONS), default: PACKAGE.SEASONS.ALL_YEAR },
    transportType: { type: String, enum: Object.values(PACKAGE.TRANSPORT.CHARDHAM_VEHICLE_CATEGORIES), default: PACKAGE.TRANSPORT.CHARDHAM_VEHICLE_CATEGORIES.REGULAR },
    hotelType: { type: String, enum: Object.values(PACKAGE.ACCOMMODATION.HOTEL_TYPES), default: PACKAGE.ACCOMMODATION.HOTEL_TYPES.BUDGET },
    duration: { type: String, default: DEFAULTS.NULL },
    inclusions: { type: String, default: DEFAULTS.NULL },
    exclusions: { type: String, default: DEFAULTS.NULL },
    startPoint: PointLocation,
    endPoint: PointLocation,
  },

  itinerary: CommonItinerary,
  policies: ActivityPolicies
}, BasePackageOptions);

export default ChardhamTourSchema;
