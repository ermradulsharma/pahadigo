import mongoose from "mongoose";
import { PACKAGE, DEFAULTS } from "../../Constants/index.js";
import { BasePackageFields, BasePackageOptions, ActivityPolicies, PointLocation, CommonItinerary, MealsAndAmenities, optionalPriceDecimal, age } from './BasePackageSchema.js';

const TrekkingSchema = new mongoose.Schema({
    ...BasePackageFields,
    ...MealsAndAmenities,
    pricing: BasePackageFields.pricing,
    details: {
        type: { type: String, enum: Object.values(PACKAGE.ACTIVITY.TREK_TYPES), default: PACKAGE.ACTIVITY.TREK_TYPES.DAY_TREK },
        difficulty: { type: String, enum: Object.values(PACKAGE.DIFFICULTY), default: PACKAGE.DIFFICULTY.EASY },
        fitness: { type: String, enum: Object.values(PACKAGE.FITNESS_LEVELS), default: PACKAGE.FITNESS_LEVELS.BASIC },
        season: { type: String, enum: Object.values(PACKAGE.SEASONS), default: PACKAGE.SEASONS.ALL_YEAR },
        maxAltitude: { type: String, default: DEFAULTS.NULL },
        distance: { type: String, default: DEFAULTS.NULL },
        duration: { type: String, default: DEFAULTS.NULL },
        inclusions: { type: String, default: DEFAULTS.NULL },
        exclusions: { type: String, default: DEFAULTS.NULL },
        departureTime: { type: String, default: DEFAULTS.NULL },
        reportingTime: { type: String, default: DEFAULTS.NULL },
        startPoint: PointLocation,
        endPoint: PointLocation,
        age: age,
    },
    itinerary: CommonItinerary,
    policies: ActivityPolicies
}, BasePackageOptions);

export default TrekkingSchema;
