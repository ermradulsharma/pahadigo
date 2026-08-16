import Setting from '../Models/Setting.js';
import { APP_DETAILS, APP_SECRETS, DEFAULTS, THIRD_PARTY_APIS, SYSTEM_ENV } from '../Constants/index.js';
import connectDB from '../Config/db.js';

let cachedSettings = DEFAULTS.NULL;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export const getAppConfig = async (forceReal = DEFAULTS.FALSE) => {
    const isDebugString = process.env.DEBUG === 'true';

    // Immediate return for tests to avoid DB overhead/deadlocks
    if (process.env.NODE_ENV === 'test' && !forceReal) {
        return {
            smtp: {
                host: APP_DETAILS.SMTP_HOST,
                port: APP_DETAILS.SMTP_PORT,
                user: APP_DETAILS.SMTP_USER,
                pass: APP_SECRETS.SMTP_ACCOUNT_PASS,
                from_address: APP_DETAILS.MAIL_FROM_EMAIL,
                from_name: APP_DETAILS.APP_NAME
            },
            msg91: {
                auth_key: THIRD_PARTY_APIS.MSG91_AUTH_KEY || DEFAULTS.NULL,
                template_id: THIRD_PARTY_APIS.MSG91_TEMPLATE_ID || DEFAULTS.NULL
            },
            firebase: {
                project_id: THIRD_PARTY_APIS.FIREBASE_PROJECT_ID || DEFAULTS.NULL,
                client_email: THIRD_PARTY_APIS.FIREBASE_CLIENT_EMAIL || DEFAULTS.NULL,
                private_key: THIRD_PARTY_APIS.FIREBASE_PRIVATE_KEY || DEFAULTS.NULL
            },
            razorpay: {
                key_id: THIRD_PARTY_APIS.RAZORPAY_KEY_ID || DEFAULTS.NULL,
                key_secret: THIRD_PARTY_APIS.RAZORPAY_KEY_SECRET || DEFAULTS.NULL
            },
            push_notification: {
                server_key: APP_DETAILS.PUSH_NOTIFICATION_SERVER_KEY || DEFAULTS.NULL,
            },
            jwt_secret: APP_SECRETS.JWT_SECRET,
            mongodb_uri: SYSTEM_ENV.MONGODB_URI,
            redis: {
                upstash_url: SYSTEM_ENV.UPSTASH_REDIS_REST_URL || DEFAULTS.NULL,
                upstash_token: SYSTEM_ENV.UPSTASH_REDIS_REST_TOKEN || DEFAULTS.NULL,
                standard_url: SYSTEM_ENV.PAHADIGO_REDIS_URL || DEFAULTS.NULL,
            },
            api_url: APP_DETAILS.API_URL,
            debug_mode: isDebugString,
            google: {
                client_id: THIRD_PARTY_APIS.GOOGLE_CLIENT_ID || DEFAULTS.NULL,
                client_secret: THIRD_PARTY_APIS.GOOGLE_CLIENT_SECRET || DEFAULTS.NULL
            },
            facebook: {
                app_id: THIRD_PARTY_APIS.FACEBOOK_APP_ID || DEFAULTS.NULL,
                app_secret: THIRD_PARTY_APIS.FACEBOOK_APP_SECRET || DEFAULTS.NULL
            },
            apple: {
                client_id: THIRD_PARTY_APIS.APPLE_CLIENT_ID || DEFAULTS.NULL,
                team_id: THIRD_PARTY_APIS.APPLE_TEAM_ID || DEFAULTS.NULL,
                key_id: THIRD_PARTY_APIS.APPLE_KEY_ID || DEFAULTS.NULL,
                private_key: THIRD_PARTY_APIS.APPLE_PRIVATE_KEY || DEFAULTS.NULL
            },
            app: {
                name: APP_DETAILS.APP_NAME,
                terms_conditions: SYSTEM_ENV.TERMS_CONDITIONS || DEFAULTS.NULL,
                privacy_policy: SYSTEM_ENV.PRIVACY_POLICY || DEFAULTS.NULL
            },
            tax: {
                gst: parseFloat(SYSTEM_ENV.GST) || 0,
                service_tax: parseFloat(SYSTEM_ENV.SERVICE_TAX) || 0,
                tax_homestay: parseFloat(SYSTEM_ENV.TAX_HOMESTAY) || 0,
                tax_hotel: parseFloat(SYSTEM_ENV.TAX_HOTEL) || 0,
                tax_camping: parseFloat(SYSTEM_ENV.TAX_CAMPING) || 0,
                tax_trekking: parseFloat(SYSTEM_ENV.TAX_TREKKING) || 0,
                tax_rafting: parseFloat(SYSTEM_ENV.TAX_RAFTING) || 0,
                tax_bungee_jumping: parseFloat(SYSTEM_ENV.TAX_BUNGEE_JUMPING) || 0,
                tax_bike_scooter_rental: parseFloat(SYSTEM_ENV.TAX_BIKE_SCOOTER_RENTAL) || 0,
                tax_chardham_tour: parseFloat(SYSTEM_ENV.TAX_CHARDHAM_TOUR) || 0,
                tax_custom_trip: parseFloat(SYSTEM_ENV.TAX_CUSTOM_TRIP) || 0
            },
            cloudinary: { url: THIRD_PARTY_APIS.CLOUDINARY_URL || DEFAULTS.NULL },
            secrets: {
                social_pass: APP_SECRETS.SOCIAL_PASS,
                other_account_pass: APP_SECRETS.OTHER_ACCOUNT_PASS,
                master_otp: APP_SECRETS.MASTER_OTP || '888888',
                cron_secret: process.env.CRON_SECRET || DEFAULTS.NULL
            }
        };
    }

    const now = Date.now();
    if (cachedSettings && (now - lastFetchTime < CACHE_TTL_MS)) {
        return cachedSettings;
    }

    try {
        await connectDB();
        let settingDoc = await Setting.findOne();
        const dbSettings = settingDoc ? settingDoc.toObject() : {};
        const config = {
            smtp: {
                host: dbSettings.smtp_host || APP_DETAILS.SMTP_HOST,
                port: parseInt(dbSettings.smtp_port) || APP_DETAILS.SMTP_PORT,
                user: dbSettings.smtp_email || APP_DETAILS.SMTP_USER,
                pass: dbSettings.smtp_password || APP_SECRETS.SMTP_ACCOUNT_PASS,
                from_address: dbSettings.smtp_from_address || process.env.SMTP_FROM_ADDRESS || APP_DETAILS.MAIL_FROM_EMAIL,
                from_name: dbSettings.smtp_from_name || APP_DETAILS.APP_NAME,
            },
            msg91: {
                auth_key: dbSettings.msg91_auth_key || THIRD_PARTY_APIS.MSG91_AUTH_KEY || DEFAULTS.NULL,
                template_id: dbSettings.msg91_template_id || THIRD_PARTY_APIS.MSG91_TEMPLATE_ID || DEFAULTS.NULL,
            },
            firebase: {
                project_id: dbSettings.firebase_project_id || THIRD_PARTY_APIS.FIREBASE_PROJECT_ID || DEFAULTS.NULL,
                client_email: dbSettings.firebase_client_email || THIRD_PARTY_APIS.FIREBASE_CLIENT_EMAIL || DEFAULTS.NULL,
                private_key: dbSettings.firebase_private_key || THIRD_PARTY_APIS.FIREBASE_PRIVATE_KEY || DEFAULTS.NULL,
            },
            razorpay: {
                key_id: dbSettings.razorpay_key_id || THIRD_PARTY_APIS.RAZORPAY_KEY_ID || DEFAULTS.NULL,
                key_secret: dbSettings.razorpay_key_secret || THIRD_PARTY_APIS.RAZORPAY_KEY_SECRET || DEFAULTS.NULL,
                webhook_secret: dbSettings.razorpay_webhook_secret || THIRD_PARTY_APIS.RAZORPAY_WEBHOOK_SECRET || DEFAULTS.NULL,
            },
            push_notification: {
                server_key: dbSettings.push_notification_server_key || APP_DETAILS.PUSH_NOTIFICATION_SERVER_KEY || DEFAULTS.NULL,
            },
            jwt_secret: dbSettings.jwt_secret || APP_SECRETS.JWT_SECRET || process.env.JWT_SECRET || null,
            mongodb_uri: dbSettings.mongodb_uri || SYSTEM_ENV.MONGODB_URI || DEFAULTS.NULL,
            redis: {
                upstash_url: dbSettings.upstash_redis_rest_url || SYSTEM_ENV.UPSTASH_REDIS_REST_URL || DEFAULTS.NULL,
                upstash_token: dbSettings.upstash_redis_rest_token || SYSTEM_ENV.UPSTASH_REDIS_REST_TOKEN || DEFAULTS.NULL,
                upstash_tcp_url: dbSettings.upstash_redis_url || SYSTEM_ENV.REDIS_URL || DEFAULTS.NULL,
                standard_url: dbSettings.pahadigo_redis_url || SYSTEM_ENV.PAHADIGO_REDIS_URL || SYSTEM_ENV.REDIS_URL || DEFAULTS.NULL,
            },
            api_url: dbSettings.api_url || APP_DETAILS.API_URL,
            debug_mode: dbSettings.debug_mode ?? isDebugString,
            google: {
                client_id: dbSettings.google_client_id || THIRD_PARTY_APIS.GOOGLE_CLIENT_ID || DEFAULTS.NULL,
                client_secret: dbSettings.google_client_secret || THIRD_PARTY_APIS.GOOGLE_CLIENT_SECRET || APP_SECRETS.SOCIAL_PASS,
            },
            facebook: {
                app_id: dbSettings.facebook_app_id || THIRD_PARTY_APIS.FACEBOOK_APP_ID || DEFAULTS.NULL,
                app_secret: dbSettings.facebook_app_secret || THIRD_PARTY_APIS.FACEBOOK_APP_SECRET || APP_SECRETS.SOCIAL_PASS,
            },
            apple: {
                client_id: dbSettings.apple_client_id || THIRD_PARTY_APIS.APPLE_CLIENT_ID || DEFAULTS.NULL,
                team_id: dbSettings.apple_team_id || THIRD_PARTY_APIS.APPLE_TEAM_ID || DEFAULTS.NULL,
                key_id: dbSettings.apple_key_id || THIRD_PARTY_APIS.APPLE_KEY_ID || DEFAULTS.NULL,
                private_key: dbSettings.apple_private_key || THIRD_PARTY_APIS.APPLE_PRIVATE_KEY || DEFAULTS.NULL,
            },
            app: {
                name: dbSettings.app_name || APP_DETAILS.APP_NAME,
                terms_conditions: dbSettings.terms_conditions || SYSTEM_ENV.TERMS_CONDITIONS || DEFAULTS.NULL,
                privacy_policy: dbSettings.privacy_policy || SYSTEM_ENV.PRIVACY_POLICY || DEFAULTS.NULL,
                rate_on_apple_store: dbSettings.rate_on_apple_store || SYSTEM_ENV.RATE_ON_APPLE_STORE || DEFAULTS.NULL,
                rate_on_google_store: dbSettings.rate_on_google_store || SYSTEM_ENV.RATE_ON_GOOGLE_STORE || DEFAULTS.NULL,
            },
            tax: {
                gst: dbSettings.gst || parseFloat(SYSTEM_ENV.GST) || 0,
                service_tax: dbSettings.service_tax || parseFloat(SYSTEM_ENV.SERVICE_TAX) || 0,
                tax_homestay: dbSettings.tax_homestay ?? (parseFloat(SYSTEM_ENV.TAX_HOMESTAY) || 0),
                tax_hotel: dbSettings.tax_hotel ?? (parseFloat(SYSTEM_ENV.TAX_HOTEL) || 0),
                tax_camping: dbSettings.tax_camping ?? (parseFloat(SYSTEM_ENV.TAX_CAMPING) || 0),
                tax_trekking: dbSettings.tax_trekking ?? (parseFloat(SYSTEM_ENV.TAX_TREKKING) || 0),
                tax_rafting: dbSettings.tax_rafting ?? (parseFloat(SYSTEM_ENV.TAX_RAFTING) || 0),
                tax_bungee_jumping: dbSettings.tax_bungee_jumping ?? (parseFloat(SYSTEM_ENV.TAX_BUNGEE_JUMPING) || 0),
                tax_bike_scooter_rental: dbSettings.tax_bike_scooter_rental ?? (parseFloat(SYSTEM_ENV.TAX_BIKE_SCOOTER_RENTAL) || 0),
                tax_chardham_tour: dbSettings.tax_chardham_tour ?? (parseFloat(SYSTEM_ENV.TAX_CHARDHAM_TOUR) || 0),
                tax_custom_trip: dbSettings.tax_custom_trip ?? (parseFloat(SYSTEM_ENV.TAX_CUSTOM_TRIP) || 0)
            },
            cloudinary: {
                url: dbSettings.cloudinary_url || THIRD_PARTY_APIS.CLOUDINARY_URL || DEFAULTS.NULL,
            },
            secrets: {
                social_pass: dbSettings.social_pass || APP_SECRETS.SOCIAL_PASS || DEFAULTS.NULL,
                other_account_pass: dbSettings.other_account_pass || APP_SECRETS.OTHER_ACCOUNT_PASS || DEFAULTS.NULL,
                master_otp: dbSettings.master_otp || APP_SECRETS.MASTER_OTP || null,
                cron_secret: dbSettings.cron_secret || process.env.CRON_SECRET || DEFAULTS.NULL
            }
        };

        cachedSettings = config;
        lastFetchTime = now;
        return config;

    } catch (error) {
        return {
            smtp: {
                host: APP_DETAILS.SMTP_HOST,
                port: APP_DETAILS.SMTP_PORT,
                user: APP_DETAILS.MAIL_FROM_EMAIL,
                pass: APP_SECRETS.SMTP_ACCOUNT_PASS,
                from_address: APP_DETAILS.MAIL_FROM_EMAIL,
                from_name: APP_DETAILS.APP_NAME,
            },
            msg91: {
                auth_key: THIRD_PARTY_APIS.MSG91_AUTH_KEY || DEFAULTS.NULL,
                template_id: THIRD_PARTY_APIS.MSG91_TEMPLATE_ID || DEFAULTS.NULL,
            },
            firebase: {
                project_id: THIRD_PARTY_APIS.FIREBASE_PROJECT_ID || DEFAULTS.NULL,
                client_email: THIRD_PARTY_APIS.FIREBASE_CLIENT_EMAIL || DEFAULTS.NULL,
                private_key: THIRD_PARTY_APIS.FIREBASE_PRIVATE_KEY || DEFAULTS.NULL,
            },
            razorpay: {
                key_id: THIRD_PARTY_APIS.RAZORPAY_KEY_ID || DEFAULTS.NULL,
                key_secret: THIRD_PARTY_APIS.RAZORPAY_KEY_SECRET || DEFAULTS.NULL,
            },
            jwt_secret: APP_SECRETS.JWT_SECRET || null,
            mongodb_uri: SYSTEM_ENV.MONGODB_URI || DEFAULTS.NULL,
            redis: {
                upstash_url: SYSTEM_ENV.UPSTASH_REDIS_REST_URL || DEFAULTS.NULL,
                upstash_token: SYSTEM_ENV.UPSTASH_REDIS_REST_TOKEN || DEFAULTS.NULL,
                standard_url: SYSTEM_ENV.PAHADIGO_REDIS_URL || DEFAULTS.NULL,
            },
            api_url: APP_DETAILS.API_URL,
            debug_mode: isDebugString,
            google: {
                client_id: THIRD_PARTY_APIS.GOOGLE_CLIENT_ID || DEFAULTS.NULL,
                client_secret: THIRD_PARTY_APIS.GOOGLE_CLIENT_SECRET || APP_SECRETS.SOCIAL_PASS,
            },
            facebook: {
                app_id: THIRD_PARTY_APIS.FACEBOOK_APP_ID || DEFAULTS.NULL,
                app_secret: THIRD_PARTY_APIS.FACEBOOK_APP_SECRET || APP_SECRETS.SOCIAL_PASS,
            },
            apple: {
                client_id: THIRD_PARTY_APIS.APPLE_CLIENT_ID || DEFAULTS.NULL,
                team_id: THIRD_PARTY_APIS.APPLE_TEAM_ID || DEFAULTS.NULL,
                key_id: THIRD_PARTY_APIS.APPLE_KEY_ID || DEFAULTS.NULL,
                private_key: THIRD_PARTY_APIS.APPLE_PRIVATE_KEY || DEFAULTS.NULL,
            },
            app: {
                name: APP_DETAILS.APP_NAME,
                terms_conditions: SYSTEM_ENV.TERMS_CONDITIONS || DEFAULTS.NULL,
                privacy_policy: SYSTEM_ENV.PRIVACY_POLICY || DEFAULTS.NULL,
                rate_on_apple_store: DEFAULTS.NULL,
                rate_on_google_store: DEFAULTS.NULL,
            },
            tax: {
                gst: parseFloat(SYSTEM_ENV.GST) || 0,
                service_tax: parseFloat(SYSTEM_ENV.SERVICE_TAX) || 0,
                tax_homestay: parseFloat(SYSTEM_ENV.TAX_HOMESTAY) || 0,
                tax_hotel: parseFloat(SYSTEM_ENV.TAX_HOTEL) || 0,
                tax_camping: parseFloat(SYSTEM_ENV.TAX_CAMPING) || 0,
                tax_trekking: parseFloat(SYSTEM_ENV.TAX_TREKKING) || 0,
                tax_rafting: parseFloat(SYSTEM_ENV.TAX_RAFTING) || 0,
                tax_bungee_jumping: parseFloat(SYSTEM_ENV.TAX_BUNGEE_JUMPING) || 0,
                tax_bike_scooter_rental: parseFloat(SYSTEM_ENV.TAX_BIKE_SCOOTER_RENTAL) || 0,
                tax_chardham_tour: parseFloat(SYSTEM_ENV.TAX_CHARDHAM_TOUR) || 0,
                tax_custom_trip: parseFloat(SYSTEM_ENV.TAX_CUSTOM_TRIP) || 0
            },
            cloudinary: {
                url: THIRD_PARTY_APIS.CLOUDINARY_URL || DEFAULTS.NULL,
            },
            secrets: {
                social_pass: APP_SECRETS.SOCIAL_PASS,
                other_account_pass: APP_SECRETS.OTHER_ACCOUNT_PASS,
                master_otp: APP_SECRETS.MASTER_OTP || null,
                cron_secret: process.env.CRON_SECRET || DEFAULTS.NULL
            }
        };
    }
};

export const clearAppConfigCache = () => {
    cachedSettings = DEFAULTS.NULL;
    lastFetchTime = 0;
};

export default {
    getAppConfig,
    clearAppConfigCache
};
