import mongoose from 'mongoose';
import { BasePackageFields, BasePackageOptions, ActivityPolicies, MealsAndAmenities } from './BasePackageSchema.js';
import { BungeeJumpingDetails } from './Package/Activity.js';

const BungeeSchema = new mongoose.Schema({
  ...BasePackageFields,
  ...MealsAndAmenities,
  details: BungeeJumpingDetails,
  policies: ActivityPolicies
}, BasePackageOptions);

export default BungeeSchema;
