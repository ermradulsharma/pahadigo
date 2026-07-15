export const APP_DETAILS = {
    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    API_URL: process.env.NEXT_PUBLIC_API_URL,
    MAIL_FROM_EMAIL: process.env.NEXT_PUBLIC_MAIL_FROM_EMAIL,
    CONTACT_MAIL_FROM_EMAIL: process.env.NEXT_PUBLIC_CONTACT_MAIL_FROM_EMAIL,
    PUSH_NOTIFICATION_SERVER_KEY: process.env.FCM_SERVER_KEY,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER
};

export const APP_SECRETS = {
    SOCIAL_PASS: process.env.SOCIAL_PASS,
    OTHER_ACCOUNT_PASS: process.env.OTHER_ACCOUNT_PASS,
    SMTP_ACCOUNT_PASS: process.env.SMTP_PASS,
    JWT_SECRET: process.env.JWT_SECRET,
    MASTER_OTP: process.env.MASTER_OTP
};

export const APP_CONSTANTS = {
    DEFAULT_ERROR_MESSAGE: "Oops! some error occurred, please try again",
    USER_TYPES: ["admin", "vendor", "traveller"],
    APP_TIMEZONE: 'Asia/Kolkata',
    WEEKEND_DAYS: {
        '0': 'Sunday',
        '1': 'Monday',
        '2': 'Tuesday',
        '3': 'Wednesday',
        '4': 'Thursday',
        '5': 'Friday',
        '6': 'Saturday'
    },
    MONTH_ARR: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    MONTH_ARR_NUMBER: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
};

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
};

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    ALREADY_EXIST: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501
};

export const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
};

export const UPLOAD_PATHS = {
    IMAGE_UPLOAD_PATH_ALL: '/uploads/images/',
    IMAGE_UPLOAD_PATH: '/uploads/profile/',
    PROVIEWS_MEDIA_UPLOAD_PATH: '/uploads/videos/',
    THUMBNAIL_UPLOAD_PATH: '/uploads/thumbnail/',
    CATEGORY_IMAGE_PATH: '/uploads/category/',
    SUB_CATEGORY_IMAGE_PATH: '/uploads/sub_category/'
};

export const SEED_ACCOUNTS = {
    SUPER_ADMIN: {
        EMAIL: 'superadmin@pahadigo.co.in',
        USERNAME: 'superadmin',
        FIRST_NAME: 'Super',
        LAST_NAME: 'Admin'
    },
    ADMIN: {
        EMAIL: 'admin@pahadigo.co.in',
        USERNAME: 'admin',
        FIRST_NAME: 'Admin',
        LAST_NAME: 'Account'
    },
    DEVELOPER: {
        EMAIL: 'developers@pahadigo.co.in',
        USERNAME: 'developers',
        FIRST_NAME: 'Developer',
        LAST_NAME: 'Account'
    }
};

export const THIRD_PARTY_APIS = {
    MSG91_AUTH_KEY: process.env.MSG91_AUTH_KEY,
    MSG91_TEMPLATE_ID: process.env.MSG91_TEMPLATE_ID,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
    APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
    APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
    APPLE_KEY_ID: process.env.APPLE_KEY_ID,
    APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY,
    CLOUDINARY_URL: process.env.CLOUDINARY_URL
};

export const SYSTEM_ENV = {
    MONGODB_URI: process.env.MONGODB_URI,
    TERMS_CONDITIONS: process.env.TERMS_CONDITIONS,
    PRIVACY_POLICY: process.env.PRIVACY_POLICY,
    RATE_ON_APPLE_STORE: process.env.RATE_ON_APPLE_STORE,
    RATE_ON_GOOGLE_STORE: process.env.RATE_ON_GOOGLE_STORE,
    GST: process.env.GST,
    SERVICE_TAX: process.env.SERVICE_TAX,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    PAHADIGO_REDIS_URL: process.env.PAHADIGO_REDIS_URL
};
