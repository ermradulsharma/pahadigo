import mongoose from "mongoose";
import { BasePackageFields, BasePackageOptions, ActivityPolicies, CommonItinerary, MealsAndAmenities } from './BasePackageSchema.js';
import { TrekkingDetails } from "./Package/Activity.js";

const TrekkingSchema = new mongoose.Schema({
    ...BasePackageFields,
    ...MealsAndAmenities,
    pricing: BasePackageFields.pricing,
    details: TrekkingDetails,
    itinerary: CommonItinerary,
    policies: ActivityPolicies
}, BasePackageOptions);

export default TrekkingSchema;
