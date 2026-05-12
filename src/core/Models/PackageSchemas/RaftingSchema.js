import mongoose from 'mongoose';
import { PACKAGE, DEFAULTS } from '../../Constants/index.js';
import { BasePackageFields, BasePackageOptions, ActivityPolicies, PointLocation, MealsAndAmenities } from './BasePackageSchema.js';

const RaftingSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  details: {
    type: { type: String, enum: Object.values(PACKAGE.ACTIVITY.RAFTING_TYPES), default: PACKAGE.ACTIVITY.RAFTING_TYPES.RIVERSIDE },
    difficulty: { type: String, enum: Object.values(PACKAGE.DIFFICULTY), default: PACKAGE.DIFFICULTY.EASY },
    grade: { type: String, enum: Object.values(PACKAGE.ACTIVITY.RAPID_GRADES), default: PACKAGE.ACTIVITY.RAPID_GRADES.I },
    distance: { type: String, default: DEFAULTS.NULL },
    duration: { type: String, default: DEFAULTS.NULL },
    size: { type: Number, default: DEFAULTS.COUNTS.ZERO },
    inclusions: { type: String, default: DEFAULTS.NULL },
    exclusions: { type: String, default: DEFAULTS.NULL },
    departureTime: { type: String, default: DEFAULTS.NULL },
    reportingTime: { type: String, default: DEFAULTS.NULL },
    age: {
      min: { type: Number, default: DEFAULTS.COUNTS.ZERO },
      max: { type: Number, default: DEFAULTS.COUNTS.ZERO },
    },
    startPoint: PointLocation,
    endPoint: PointLocation,
  },
  policies: ActivityPolicies
}, BasePackageOptions);

export default RaftingSchema;
