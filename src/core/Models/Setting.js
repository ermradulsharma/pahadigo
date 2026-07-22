import mongoose from 'mongoose';
import { DEFAULTS } from '../Constants/index.js';

const SettingSchema = new mongoose.Schema({
    smtp_email: { type: String, default: DEFAULTS.NULL },
    smtp_password: { type: String, default: DEFAULTS.NULL },
    smtp_host: { type: String, default: DEFAULTS.NULL },
    smtp_port: { type: String, default: DEFAULTS.NULL },
    smtp_from_address: { type: String, default: DEFAULTS.NULL },
    smtp_from_name: { type: String, default: DEFAULTS.NULL },

    msg91_auth_key: { type: String, default: DEFAULTS.NULL },
    msg91_template_id: { type: String, default: DEFAULTS.NULL },

    firebase_project_id: { type: String, default: DEFAULTS.NULL },
    firebase_client_email: { type: String, default: DEFAULTS.NULL },
    firebase_private_key: { type: String, default: DEFAULTS.NULL },

    razorpay_key_id: { type: String, default: DEFAULTS.NULL },
    razorpay_key_secret: { type: String, default: DEFAULTS.NULL },
    razorpay_webhook_secret: { type: String, default: DEFAULTS.NULL },

    push_notification_server_key: { type: String, default: DEFAULTS.NULL },

    mongodb_uri: { type: String, select: false, default: DEFAULTS.NULL },

    api_url: { type: String, default: DEFAULTS.NULL },

    upstash_redis_rest_url: { type: String, default: DEFAULTS.NULL },
    upstash_redis_rest_token: { type: String, default: DEFAULTS.NULL },
    upstash_redis_url: { type: String, default: DEFAULTS.NULL },
    pahadigo_redis_url: { type: String, default: DEFAULTS.NULL },

    jwt_secret: { type: String, default: DEFAULTS.NULL },

    google_client_id: { type: String, default: DEFAULTS.NULL },
    google_client_secret: { type: String, default: DEFAULTS.NULL },

    facebook_app_id: { type: String, default: DEFAULTS.NULL },
    facebook_app_secret: { type: String, default: DEFAULTS.NULL },

    apple_client_id: { type: String, default: DEFAULTS.NULL },
    apple_team_id: { type: String, default: DEFAULTS.NULL },
    apple_key_id: { type: String, default: DEFAULTS.NULL },
    apple_private_key: { type: String, default: DEFAULTS.NULL },

    app_name: { type: String, default: DEFAULTS.NULL },
    terms_conditions: { type: String, default: DEFAULTS.NULL },
    privacy_policy: { type: String, default: DEFAULTS.NULL },
    rate_on_apple_store: { type: String, default: DEFAULTS.NULL },
    rate_on_google_store: { type: String, default: DEFAULTS.NULL },

    gst: { type: Number, default: 0 },
    service_tax: { type: Number, default: 0 },
    tax_homestay: { type: Number, default: 0 },
    tax_hotel: { type: Number, default: 0 },
    tax_camping: { type: Number, default: 0 },
    tax_trekking: { type: Number, default: 0 },
    tax_rafting: { type: Number, default: 0 },
    tax_bungee_jumping: { type: Number, default: 0 },
    tax_bike_scooter_rental: { type: Number, default: 0 },
    tax_chardham_tour: { type: Number, default: 0 },
    tax_custom_trip: { type: Number, default: 0 },

    cloudinary_url: { type: String, default: DEFAULTS.NULL },

    social_pass: { type: String, default: DEFAULTS.NULL },

    other_account_pass: { type: String, default: DEFAULTS.NULL },

    master_otp: { type: String, default: DEFAULTS.NULL },

    cron_secret: { type: String, default: DEFAULTS.NULL },

    debug_mode: { type: Boolean, default: DEFAULTS.FALSE },

}, {
    timestamps: DEFAULTS.TRUE,
    toJSON: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE },
    toObject: { virtuals: DEFAULTS.TRUE, getters: DEFAULTS.TRUE, minimize: DEFAULTS.FALSE }
});

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
