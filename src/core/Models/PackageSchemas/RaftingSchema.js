import mongoose from 'mongoose';
import { BasePackageFields, BasePackageOptions, ActivityPolicies, MealsAndAmenities } from './BasePackageSchema.js';
import { RaftingDetails } from './Package/Activity.js';

const RaftingSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  details: RaftingDetails,
  policies: ActivityPolicies
}, BasePackageOptions);

export default RaftingSchema;
