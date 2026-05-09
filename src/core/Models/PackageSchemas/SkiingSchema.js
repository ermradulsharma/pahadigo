import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, ActivityPolicies, MealsAndAmenities } from './BasePackageSchema.js';

const SkiingSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  details: {
    slopeName: { type: String, default: DEFAULTS.NULL },
    difficultyLevel: { type: String, enum: Object.values(PACKAGE.ACTIVITY.SKI_DIFFICULTY), default: PACKAGE.ACTIVITY.SKI_DIFFICULTY.BEGINNER },
    duration: { type: String, default: DEFAULTS.NULL },
    instructorIncluded: { type: Boolean, default: DEFAULTS.TRUE },
    equipmentIncluded: { type: Boolean, default: DEFAULTS.TRUE },
    videoIncluded: { type: Boolean, default: DEFAULTS.FALSE },
    skiLiftPassIncluded: { type: Boolean, default: DEFAULTS.FALSE }
  },
  policies: ActivityPolicies
}, BasePackageOptions);

export default SkiingSchema;
