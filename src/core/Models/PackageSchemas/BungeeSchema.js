import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, ActivityPolicies, MealsAndAmenities, age } from './BasePackageSchema.js';

const BungeeSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,

  details: {
    type: { type: String, enum: Object.values(PACKAGE.ACTIVITY.JUMP_TYPES), default: PACKAGE.ACTIVITY.JUMP_TYPES.FORWARD },
    height: {
      min: { type: Number, default: DEFAULTS.NULL },
      max: { type: Number, default: DEFAULTS.NULL },
    },
    weight: {
      min: { type: Number, default: DEFAULTS.NULL },
      max: { type: Number, default: DEFAULTS.NULL },
    },
    age: age,
    departureTime: { type: String, default: DEFAULTS.NULL },
    reportingTime: { type: String, default: DEFAULTS.NULL },
    duration: { type: String, default: DEFAULTS.NULL },
    inclusions: { type: String, default: DEFAULTS.NULL },
    exclusions: { type: String, default: DEFAULTS.NULL },
  },
  policies: ActivityPolicies
}, BasePackageOptions);

export default BungeeSchema;
