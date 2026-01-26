
import Setting from '../models/Setting.js';
import { APP_DETAILS, APP_SECRETS } from '../constants/index.js';

export const seedSettings = async () => {
    try {
        const count = await Setting.countDocuments();
        if (count > 0) {
            return { message: 'Settings already exist' };
        }

        const settings = {
            // SMTP
            smtp_email: process.env.SMTP_EMAIL || APP_DETAILS.MAIL_FROM_EMAIL,
            smtp_password: process.env.SMTP_PASSWORD || APP_SECRETS.SMTP_ACCOUNT_PASS,
            smtp_host: process.env.SMTP_HOST || 'smtp.gmail.com',
            smtp_port: process.env.SMTP_PORT || '587',
            smtp_from_address: process.env.SMTP_FROM_ADDRESS || APP_DETAILS.MAIL_FROM_EMAIL,
            smtp_from_name: process.env.SMTP_FROM_NAME || APP_DETAILS.APP_NAME,

            // SMS (MSG91)
            msg91_auth_key: process.env.MSG91_AUTH_KEY || '',
            msg91_template_id: process.env.MSG91_TEMPLATE_ID || '',

            // Notifications
            push_notification_server_key: process.env.PUSH_NOTIFICATION_SERVER_KEY || APP_DETAILS.PUSH_NOTIFICATION_SERVER_KEY,

            // Razorpay
            razorpay_key_id: process.env.RAZORPAY_KEY_ID || '',
            razorpay_key_secret: process.env.RAZORPAY_KEY_SECRET || '',

            // Database
            mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/travels_db',
            api_url: process.env.NEXT_PUBLIC_API_URL || APP_DETAILS.APP_URL,

            // JWT
            jwt_secret: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET',

            // Social Auth
            google_client_id: process.env.GOOGLE_CLIENT_ID || '',
            google_client_secret: process.env.GOOGLE_CLIENT_SECRET || APP_SECRETS.SOCIAL_PASS,
            facebook_app_id: process.env.FACEBOOK_APP_ID || '',
            facebook_app_secret: process.env.FACEBOOK_APP_SECRET || APP_SECRETS.SOCIAL_PASS,
            apple_client_id: process.env.APPLE_CLIENT_ID || '',
            apple_team_id: process.env.APPLE_TEAM_ID || '',
            apple_key_id: process.env.APPLE_KEY_ID || '',
            apple_private_key: process.env.APPLE_PRIVATE_KEY || '',

            // App Details
            app_name: process.env.APP_NAME || APP_DETAILS.APP_NAME,
            terms_conditions: '',
            privacy_policy: '',
            rate_on_apple_store: '',
            rate_on_google_store: ''
        };

        const createdSetting = await Setting.create(settings);
        return createdSetting;
    } catch (error) {
        throw error;
    }
};
