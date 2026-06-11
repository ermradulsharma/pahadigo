import mongoose from 'mongoose';
import { BasePackageFields, BasePackageOptions, ActivityPolicies, CommonItinerary, MealsAndAmenities } from './BasePackageSchema.js';
import { ChardhamDetails } from './Package/Transport.js';

const ChardhamTourSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  pricing: BasePackageFields.pricing,
  details: ChardhamDetails,
  itinerary: CommonItinerary,
  policies: ActivityPolicies
}, BasePackageOptions);

export default ChardhamTourSchema;
