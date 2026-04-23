
import Setting from '@/core/Models/Setting.js';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { DEFAULTS } from '@/core/Constants/index.js';

export const seedSettings = async () => {
    try {
        const count = await Setting.countDocuments();
        if (count > 0) {
            return { message: 'Settings already exist' };
        }

        // Fetch values from Env/Constants via our standardized helper
        const config = await getAppConfig();

        const settings = {
            // SMTP
            smtp_email: config.smtp.user,
            smtp_password: config.smtp.pass,
            smtp_host: config.smtp.host,
            smtp_port: config.smtp.port,
            smtp_from_address: config.smtp.from_address,
            smtp_from_name: config.smtp.from_name,

            // SMS (MSG91)
            msg91_auth_key: config.msg91.auth_key,
            msg91_template_id: config.msg91.template_id,

            // Notifications
            push_notification_server_key: config.push_notification.server_key,

            // Razorpay
            razorpay_key_id: config.razorpay.key_id,
            razorpay_key_secret: config.razorpay.key_secret,

            // Database & API
            mongodb_uri: config.mongodb_uri,
            api_url: config.api_url,

            // JWT
            jwt_secret: config.jwt_secret,

            // Social Auth
            google_client_id: config.google.client_id,
            google_client_secret: config.google.client_secret,
            facebook_app_id: config.facebook.app_id,
            facebook_app_secret: config.facebook.app_secret,
            apple_client_id: config.apple.client_id,
            apple_team_id: config.apple.team_id,
            apple_key_id: config.apple.key_id,
            apple_private_key: config.apple.private_key,

            // App Details
            app_name: config.app.name,
            terms_conditions: config.app.terms_conditions,
            privacy_policy: config.app.privacy_policy,
            rate_on_apple_store: DEFAULTS.STRING,
            rate_on_google_store: DEFAULTS.STRING
        };

        const createdSetting = await Setting.create(settings);
        return createdSetting;
    } catch (error) {
        throw error;
    }
};

export default seedSettings;
