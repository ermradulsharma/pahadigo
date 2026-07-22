import Setting from '../../Models/Setting.js';
import { getAppConfig } from '../../Lib/appConfig.js';
import { DEFAULTS } from '../../Constants/index.js';

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

            // Firebase Configuration
            firebase_project_id: config.firebase.project_id,
            firebase_client_email: config.firebase.client_email,
            firebase_private_key: config.firebase.private_key,

            // Razorpay Configuration
            razorpay_key_id: config.razorpay.key_id,
            razorpay_key_secret: config.razorpay.key_secret,
            razorpay_webhook_secret: config.razorpay.webhook_secret,

            // Notifications
            push_notification_server_key: config.push_notification.server_key,

            // Database & API
            mongodb_uri: config.mongodb_uri,
            api_url: config.api_url,

            // Redis Configuration
            upstash_redis_rest_url: config.redis.upstash_url,
            upstash_redis_rest_token: config.redis.upstash_token,
            upstash_redis_url: config.redis.upstash_tcp_url,
            pahadigo_redis_url: config.redis.standard_url,

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

            // Pricing Configuration
            gst: config.tax.gst,
            service_tax: config.tax.service_tax,
            tax_homestay: config.tax.homestay,
            tax_hotel: config.tax.hotel,
            tax_camping: config.tax.camping,
            tax_trekking: config.tax.trekking,
            tax_rafting: config.tax.rafting,
            tax_bungee_jumping: config.tax.bungee_jumping,
            tax_bike_scooter_rental: config.tax.bike_scooter_rental,
            tax_chardham_tour: config.tax.chardham_tour,
            tax_custom_trip: config.tax.custom_trip,

            // Cloudinary
            cloudinary_url: config.cloudinary.url,

            // App Secrets
            social_pass: config.secrets.social_pass,
            other_account_pass: config.secrets.other_account_pass,
            master_otp: config.secrets.master_otp,
            cron_secret: config.secrets.cron_secret,

            // App Details
            app_name: config.app.name,
            terms_conditions: config.app.terms_conditions,
            privacy_policy: config.app.privacy_policy,
            rate_on_apple_store: config.app.rate_on_apple_store,
            rate_on_google_store: config.app.rate_on_google_store,

            // Debug
            debug_mode: config.debug_mode
        };

        const createdSetting = await Setting.create(settings);
        return createdSetting;
    } catch (error) {
        throw error;
    }
};

export default seedSettings;
