
export const USER_ROLES = {
    ADMIN: 'admin',
    VENDOR: 'vendor',
    TRAVELLER: 'traveller'
};

export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BLOCKED: 'blocked',
    PENDING: 'pending'
};

export const AUTH_PROVIDERS = {
    LOCAL: 'local',
    GOOGLE: 'google',
    FACEBOOK: 'facebook',
    APPLE: 'apple',
    PHONE: 'phone'
};

export const GENDER = {
    MALE: 'male',
    FEMALE: 'female',
    OTHER: 'other'
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
    INTERNAL_SERVER_ERROR: 500
};

export const FILE_UPLOAD = {
    MAX_SIZE: 5 * 1024 * 1024,
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
};

export const VERIFICATION_STATUS = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
};

export const DEFAULTS = {
    USER_ROLE: USER_ROLES.TRAVELLER,
    USER_STATUS: USER_STATUS.PENDING,
    AUTH_PROVIDER: AUTH_PROVIDERS.PHONE,
    GENDER: GENDER.OTHER,
    CURRENCY: 'INR',
    COUNTRY: 'India',
    LANGUAGE: 'en',

    NOTIFICATIONS: {
        EMAIL: true,
        SMS: true,
        PUSH: true
    },

    VENDOR_VERIFICATION_STATUS: VERIFICATION_STATUS.PENDING,
    VENDOR_IS_APPROVED: false
};

export const SEED_ACCOUNTS = {
    SUPER_ADMIN: {
        EMAIL: 'superadmin@pahadigo.com',
        USERNAME: 'superadmin',
        FIRST_NAME: 'Super',
        LAST_NAME: 'Admin'
    },
    ADMIN: {
        EMAIL: 'admin@pahadigo.com',
        USERNAME: 'admin',
        FIRST_NAME: 'Admin',
        LAST_NAME: 'Account'
    },
    DEVELOPER: {
        EMAIL: 'developers@pahadigo.com',
        USERNAME: 'developers',
        FIRST_NAME: 'Developer',
        LAST_NAME: 'Account'
    }
};

export const APP_DETAILS = {
    APP_NAME: 'PahadiGo',
    APP_URL: 'http://www.pahadigo.com',
    MAIL_FROM_EMAIL: 'no-reply@pahadigo.com',
    CONTACT_MAIL_FROM_EMAIL: 'contact@pahadigo.com',
    PUSH_NOTIFICATION_SERVER_KEY: 'AAAAOrJ9guI:APA91bHNWHnrMohXSiyw0BV0zknsKaixfKiprwSlsqg0uanBqpiM49sTLJ3wJNp2s0-D1m0QS0RJgssnID3v31kyjmABTJX4jPyMIfRgSLIw39A6JSX3FBAcysO5kwB7aeKo87CiBoBs'
};

export const APP_SECRETS = {
    SOCIAL_PASS: 'y5sUdwLH7*STamnnjRu21!11I269Uw8Ijk%^xlLRN',
    OTHER_ACCOUNT_PASS: 'y5sUdwLH7*STamn1I269Uw8Ijk%^xlLRN',
    SMTP_ACCOUNT_PASS: 'hmnnjrhhnzklcyae'
};

export const UPLOAD_PATHS = {
    IMAGE_UPLOAD_PATH_ALL: '/uploads/images/',
    IMAGE_UPLOAD_PATH: '/uploads/profile/',
    PROVIEWS_MEDIA_UPLOAD_PATH: '/uploads/videos/',
    THUMBNAIL_UPLOAD_PATH: '/uploads/thumbnail/',
    CATEGORY_IMAGE_PATH: '/uploads/category/',
    SUB_CATEGORY_IMAGE_PATH: '/uploads/sub_category/'
};

export const NOTIFICATION_TYPES = {
    POST_LIKE: 'POST_LIKE',
    POST_COMMENT: 'POST_COMMENT',
    MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
    FOLLOW_REQUEST: 'FOLLOW_REQUEST',
    JOIN_REQUEST: 'JOIN_REQUEST',
    GROUP_INVITE: 'GROUP_INVITE',
    ACCEPT_JOIN_REQUEST: 'ACCEPT_JOIN_REQUEST'
};

export const NOTIFICATION_MESSAGES = {
    ACCEPTED: "Your offer has been accepted",
    REJECTED: "Your offer has been rejected",
    ON_THE_WAY: "on the way to start ",
    WORKING_ON: "started working on ",
    COMPLETED: "Your job has been completed"
};

export const APP_CONSTANTS = {
    DEFAULT_ERROR_MESSAGE: "Oops! some error occured, please try again",
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
