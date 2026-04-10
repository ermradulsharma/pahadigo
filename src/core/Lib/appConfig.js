import Setting from '@/models/Setting.js';
import { APP_DETAILS, APP_SECRETS } from '@/constants/index.js';
import connectDB from '@/config/db';

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export const getAppConfig = async (forceReal = false) => {
    // Immediate return for tests to avoid DB overhead/deadlocks
    if (process.env.NODE_ENV === 'test' && !forceReal) {
        return {
            smtp: {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT) || 587,
                user: process.env.SMTP_EMAIL || '',
                pass: process.env.SMTP_PASSWORD || '',
                from_address: process.env.SMTP_FROM_ADDRESS || '',
                from_name: process.env.SMTP_FROM_NAME || 'PahadiGo'
            },
            msg91: {
                auth_key: process.env.MSG91_AUTH_KEY || '',
                template_id: process.env.MSG91_TEMPLATE_ID || ''
            },
            push_notification: {
                server_key: process.env.PUSH_NOTIFICATION_SERVER_KEY || ''
            },
            razorpay: {
                key_id: process.env.RAZORPAY_KEY_ID || '',
                key_secret: process.env.RAZORPAY_KEY_SECRET || ''
            },
            jwt_secret: process.env.JWT_SECRET || 'test_secret',
            mongodb_uri: process.env.MONGODB_URI,
            api_url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
            debug_mode: process.env.DEBUG === 'true',
            google: { 
                client_id: process.env.GOOGLE_CLIENT_ID, 
                client_secret: process.env.GOOGLE_CLIENT_SECRET 
            },
            facebook: { 
                app_id: process.env.FACEBOOK_APP_ID, 
                app_secret: process.env.FACEBOOK_APP_SECRET 
            },
            apple: { 
                client_id: process.env.APPLE_CLIENT_ID, 
                team_id: process.env.APPLE_TEAM_ID, 
                key_id: process.env.APPLE_KEY_ID, 
                private_key: process.env.APPLE_PRIVATE_KEY 
            },
            app: { 
                name: process.env.APP_NAME || 'PahadiGo', 
                terms_conditions: process.env.TERMS_CONDITIONS || '', 
                privacy_policy: process.env.PRIVACY_POLICY || '' 
            },
            cloudinary: { url: process.env.CLOUDINARY_URL || '' },
            secrets: {
                social_pass: process.env.SOCIAL_PASS || '',
                other_account_pass: process.env.OTHER_ACCOUNT_PASS || '',
                master_otp: process.env.MASTER_OTP || '888888'
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
                host: dbSettings.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com',
                port: dbSettings.smtp_port || process.env.SMTP_PORT || 587,
                user: dbSettings.smtp_email || process.env.SMTP_EMAIL || APP_DETAILS.MAIL_FROM_EMAIL,
                pass: dbSettings.smtp_password || process.env.SMTP_PASSWORD || APP_SECRETS.SMTP_ACCOUNT_PASS,
                from_address: dbSettings.smtp_from_address || process.env.SMTP_FROM_ADDRESS || APP_DETAILS.MAIL_FROM_EMAIL,
                from_name: dbSettings.smtp_from_name || process.env.SMTP_FROM_NAME || APP_DETAILS.APP_NAME,
            },
            msg91: {
                auth_key: dbSettings.msg91_auth_key || process.env.MSG91_AUTH_KEY || '',
                template_id: dbSettings.msg91_template_id || process.env.MSG91_TEMPLATE_ID || '',
            },
            push_notification: {
                server_key: dbSettings.push_notification_server_key || process.env.PUSH_NOTIFICATION_SERVER_KEY || APP_DETAILS.PUSH_NOTIFICATION_SERVER_KEY,
            },
            razorpay: {
                key_id: dbSettings.razorpay_key_id || process.env.RAZORPAY_KEY_ID || '',
                key_secret: dbSettings.razorpay_key_secret || process.env.RAZORPAY_KEY_SECRET || '',
                webhook_secret: dbSettings.razorpay_webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET || '',
            },
            jwt_secret: dbSettings.jwt_secret || process.env.JWT_SECRET,
            mongodb_uri: dbSettings.mongodb_uri || process.env.MONGODB_URI,
            api_url: dbSettings.api_url || process.env.NEXT_PUBLIC_API_URL || APP_DETAILS.APP_URL,
            debug_mode: dbSettings.debug_mode ?? (process.env.DEBUG === "true"),
            google: {
                client_id: dbSettings.google_client_id || process.env.GOOGLE_CLIENT_ID || '',
                client_secret: dbSettings.google_client_secret || process.env.GOOGLE_CLIENT_SECRET || APP_SECRETS.SOCIAL_PASS,
            },
            facebook: {
                app_id: dbSettings.facebook_app_id || process.env.FACEBOOK_APP_ID || '',
                app_secret: dbSettings.facebook_app_secret || process.env.FACEBOOK_APP_SECRET || APP_SECRETS.SOCIAL_PASS,
            },
            apple: {
                client_id: dbSettings.apple_client_id || process.env.APPLE_CLIENT_ID || '',
                team_id: dbSettings.apple_team_id || process.env.APPLE_TEAM_ID || '',
                key_id: dbSettings.apple_key_id || process.env.APPLE_KEY_ID || '',
                private_key: dbSettings.apple_private_key || process.env.APPLE_PRIVATE_KEY || '',
            },
            app: {
                name: dbSettings.app_name || process.env.APP_NAME || APP_DETAILS.APP_NAME,
                terms_conditions: dbSettings.terms_conditions || process.env.TERMS_CONDITIONS || '',
                privacy_policy: dbSettings.privacy_policy || process.env.PRIVACY_POLICY || '',
                rate_on_apple_store: dbSettings.rate_on_apple_store || process.env.RATE_ON_APPLE_STORE || '',
                rate_on_google_store: dbSettings.rate_on_google_store || process.env.RATE_ON_GOOGLE_STORE || '',
            },
            cloudinary: {
                url: dbSettings.cloudinary_url || process.env.CLOUDINARY_URL || '',
            },
            secrets: {
                social_pass: dbSettings.social_pass || process.env.SOCIAL_PASS || '',
                other_account_pass: dbSettings.other_account_pass || process.env.OTHER_ACCOUNT_PASS || '',
                master_otp: dbSettings.master_otp || process.env.MASTER_OTP || '',
            }
        };

        cachedSettings = config;
        lastFetchTime = now;
        return config;

    } catch (error) {
        return {
            smtp: {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                user: process.env.SMTP_EMAIL || '',
                pass: process.env.SMTP_PASSWORD || '',
                from_address: process.env.SMTP_FROM_ADDRESS || '',
                from_name: process.env.SMTP_FROM_NAME || '',
            },
            msg91: {
                auth_key: process.env.MSG91_AUTH_KEY || '',
                template_id: process.env.MSG91_TEMPLATE_ID || '',
            },
            push_notification: {
                server_key: process.env.PUSH_NOTIFICATION_SERVER_KEY || APP_DETAILS.PUSH_NOTIFICATION_SERVER_KEY,
            },
            razorpay: {
                key_id: process.env.RAZORPAY_KEY_ID || '',
                key_secret: process.env.RAZORPAY_KEY_SECRET || '',
            },
            jwt_secret: process.env.JWT_SECRET,
            mongodb_uri: process.env.MONGODB_URI,
            api_url: process.env.NEXT_PUBLIC_API_URL || APP_DETAILS.APP_URL,
            debug_mode: process.env.DEBUG === "true",
            google: {
                client_id: process.env.GOOGLE_CLIENT_ID || '',
                client_secret: process.env.GOOGLE_CLIENT_SECRET || APP_SECRETS.SOCIAL_PASS,
            },
            facebook: {
                app_id: process.env.FACEBOOK_APP_ID || '',
                app_secret: process.env.FACEBOOK_APP_SECRET || APP_SECRETS.SOCIAL_PASS,
            },
            apple: {
                client_id: process.env.APPLE_CLIENT_ID || '',
                team_id: process.env.APPLE_TEAM_ID || '',
                key_id: process.env.APPLE_KEY_ID || '',
                private_key: process.env.APPLE_PRIVATE_KEY || '',
            },
            app: {
                name: process.env.APP_NAME || APP_DETAILS.APP_NAME,
                terms_conditions: '',
                privacy_policy: '',
                rate_on_apple_store: '',
                rate_on_google_store: '',
            },
            cloudinary: {
                url: process.env.CLOUDINARY_URL || '',
            },
            secrets: {
                social_pass: process.env.SOCIAL_PASS || '',
                other_account_pass: process.env.OTHER_ACCOUNT_PASS || '',
                master_otp: process.env.MASTER_OTP || '',
            }
        };
    }
};

export const clearAppConfigCache = () => {
    cachedSettings = null;
    lastFetchTime = 0;
};

export default {
    getAppConfig,
    clearAppConfigCache
};
