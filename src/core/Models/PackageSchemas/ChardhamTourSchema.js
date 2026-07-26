import mongoose from 'mongoose';
import { BasePackageFields, TransportPricing, BasePackageOptions, ActivityPolicies, CommonItinerary, MealsAndAmenities } from './BasePackageSchema.js';
import { ChardhamDetails } from './Package/Transport.js';

const ChardhamTourSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  pricing: TransportPricing,
  details: ChardhamDetails,
  itinerary: CommonItinerary,
  policies: ActivityPolicies
}, BasePackageOptions);

export default ChardhamTourSchema;
