import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, ActivityPolicies, MealsAndAmenities, optionalPriceDecimal, age } from './BasePackageSchema.js';

const ParaglidingSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  details: {
    siteName: { type: String, default: DEFAULTS.NULL },
    flyType: { type: String, enum: Object.values(PACKAGE.ACTIVITY.PARAGLIDING_TYPES), default: PACKAGE.ACTIVITY.PARAGLIDING_TYPES.SHORT_FLY },
    duration: { type: String, default: DEFAULTS.NULL },
    heightFeet: { type: String, default: DEFAULTS.NULL },
    videoIncluded: { type: Boolean, default: DEFAULTS.FALSE },
    transferIncluded: { type: Boolean, default: DEFAULTS.FALSE },
    pilotExperience: { type: String, default: DEFAULTS.NULL },
    goproExcludedPrice: optionalPriceDecimal,
    age: age,
  },
  policies: ActivityPolicies
}, BasePackageOptions);

export default ParaglidingSchema;
