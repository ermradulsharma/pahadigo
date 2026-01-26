import Setting from '@/models/Setting';
import { APP_DETAILS, APP_SECRETS } from '@/constants';
import connectDB from '@/config/db';

let cachedSettings = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

export const getAppConfig = async () => {
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
            },
            jwt_secret: dbSettings.jwt_secret || process.env.JWT_SECRET || 'CHANGE_THIS_SECRET',
            mongodb_uri: dbSettings.mongodb_uri || process.env.MONGODB_URI,
            api_url: dbSettings.api_url || process.env.NEXT_PUBLIC_API_URL || APP_DETAILS.APP_URL,
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
                terms_conditions: dbSettings.terms_conditions || '',
                privacy_policy: dbSettings.privacy_policy || '',
                rate_on_apple_store: dbSettings.rate_on_apple_store || '',
                rate_on_google_store: dbSettings.rate_on_google_store || '',
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
            jwt_secret: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET',
            mongodb_uri: process.env.MONGODB_URI,
            api_url: process.env.NEXT_PUBLIC_API_URL || APP_DETAILS.APP_URL,
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
            }
        };
    }
};
