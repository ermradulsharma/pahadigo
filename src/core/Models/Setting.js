import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const SettingSchema = new mongoose.Schema({
  // SMTP Configuration
  smtp_email: { type: String, default: DEFAULTS.NULL },
  smtp_password: { type: String, default: DEFAULTS.NULL },
  smtp_host: { type: String, default: DEFAULTS.NULL },
  smtp_port: { type: String, default: DEFAULTS.NULL },
  smtp_from_address: { type: String, default: DEFAULTS.NULL },
  smtp_from_name: { type: String, default: DEFAULTS.NULL },

  // SMS Configuration
  msg91_auth_key: { type: String, default: DEFAULTS.NULL },
  msg91_template_id: { type: String, default: DEFAULTS.NULL },

  // Firebase Configuration (Admin SDK)
  firebase_project_id: { type: String, default: DEFAULTS.NULL },
  firebase_client_email: { type: String, default: DEFAULTS.NULL },
  firebase_private_key: { type: String, default: DEFAULTS.NULL },

  // Razorpay Configuration
  razorpay_key_id: { type: String, default: DEFAULTS.NULL },
  razorpay_key_secret: { type: String, default: DEFAULTS.NULL },

  // Database Configuration
  mongodb_uri: { type: String, default: DEFAULTS.NULL },
  api_url: { type: String, default: DEFAULTS.NULL },

  // JWT Configuration
  jwt_secret: { type: String, default: DEFAULTS.NULL },

  // Google Authentication
  google_client_id: { type: String, default: DEFAULTS.NULL },
  google_client_secret: { type: String, default: DEFAULTS.NULL },

  // Facebook Authentication
  facebook_app_id: { type: String, default: DEFAULTS.NULL },
  facebook_app_secret: { type: String, default: DEFAULTS.NULL },

  // Apple Authentication
  apple_client_id: { type: String, default: DEFAULTS.NULL },
  apple_team_id: { type: String, default: DEFAULTS.NULL },
  apple_key_id: { type: String, default: DEFAULTS.NULL },
  apple_private_key: { type: String, default: DEFAULTS.NULL },

  // Application Details
  app_name: { type: String, default: DEFAULTS.NULL },
  terms_conditions: { type: String, default: DEFAULTS.NULL },
  privacy_policy: { type: String, default: DEFAULTS.NULL },
  rate_on_apple_store: { type: String, default: DEFAULTS.NULL },
  rate_on_google_store: { type: String, default: DEFAULTS.NULL },

  // Pricing Configuration
  gst: { type: Number, default: 0 },
  service_tax: { type: Number, default: 0 },

  // Cloudinary Configuration
  cloudinary_url: { type: String, default: DEFAULTS.NULL },

  // App Secrets
  social_pass: { type: String, default: DEFAULTS.NULL },
  other_account_pass: { type: String, default: DEFAULTS.NULL },
  master_otp: { type: String, default: DEFAULTS.NULL },

  // Developer Diagnostics
  debug_mode: { type: Boolean, default: DEFAULTS.FALSE },

}, {
  timestamps: DEFAULTS.TRUE,
  toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
  toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
