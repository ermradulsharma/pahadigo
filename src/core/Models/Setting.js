
import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
    // SMTP Configuration
    smtp_email: { type: String, default: '' },
    smtp_password: { type: String, default: '' },
    smtp_host: { type: String, default: '' },
    smtp_port: { type: String, default: '' },
    smtp_from_address: { type: String, default: '' },
    smtp_from_name: { type: String, default: '' },

    // SMS Configuration
    msg91_auth_key: { type: String, default: '' },
    msg91_template_id: { type: String, default: '' },

    // Notification
    push_notification_server_key: { type: String, default: '' },

    // Razorpay Configuration
    razorpay_key_id: { type: String, default: '' },
    razorpay_key_secret: { type: String, default: '' },

    // Database Configuration
    mongodb_uri: { type: String, default: '' },
    api_url: { type: String, default: '' },

    // JWT Configuration
    jwt_secret: { type: String, default: '' },

    // Google Authentication
    google_client_id: { type: String, default: '' },
    google_client_secret: { type: String, default: '' },

    // Facebook Authentication
    facebook_app_id: { type: String, default: '' },
    facebook_app_secret: { type: String, default: '' },

    // Apple Authentication
    apple_client_id: { type: String, default: '' },
    apple_team_id: { type: String, default: '' },
    apple_key_id: { type: String, default: '' },
    apple_private_key: { type: String, default: '' },

    // Application Details
    app_name: { type: String, default: '' },
    terms_conditions: { type: String, default: '' },
    privacy_policy: { type: String, default: '' },
    rate_on_apple_store: { type: String, default: '' },
    rate_on_google_store: { type: String, default: '' },

}, { timestamps: true });

export default mongoose.models.Setting || mongoose.model('Setting', SettingSchema);
