import { APP_DETAILS, APP_SECRETS, APP_CONSTANTS, PAGINATION, HTTP_STATUS, FILE_UPLOAD, UPLOAD_PATHS, SEED_ACCOUNTS, THIRD_PARTY_APIS, SYSTEM_ENV } from './base.js';
export { APP_DETAILS, APP_SECRETS, APP_CONSTANTS, PAGINATION, HTTP_STATUS, FILE_UPLOAD, UPLOAD_PATHS, SEED_ACCOUNTS, THIRD_PARTY_APIS, SYSTEM_ENV };
import { PACKAGE as BASE_PACKAGE } from './Package/package.js';
import { ACCOMMODATION } from './Package/accommodation.js';
import { ACTIVITY } from './Package/activity.js';
import { TRANSPORT } from './Package/transport.js';
import { RESPONSE_MESSAGES, NOTIFICATION_MESSAGES } from './messages.js';

export { RESPONSE_MESSAGES, NOTIFICATION_MESSAGES };

// ============================================
// BASIC TYPES & DEFAULTS
// ============================================

export const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    DEVELOPER: 'developer',
    VENDOR: 'vendor',
    TRAVELLER: 'traveller'
};

export const STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    REJECT: 'reject',
    BLOCKED: 'blocked',
    SUSPENDED: 'suspended',
    DELETED: 'deleted'
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

export const VERIFICATION_STATUS = {
    PENDING: 'pending',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
};

export const DEFAULTS = {

    USER_ROLE: USER_ROLES.TRAVELLER,
    STATUS: STATUS.PENDING,
    AUTH_PROVIDER: AUTH_PROVIDERS.PHONE,
    GENDER: GENDER.OTHER,
    CURRENCY: 'INR',
    COUNTRY: 'India',
    LANGUAGE: 'en',

    NOTIFICATIONS: {
        EMAIL: true,
        SMS: true,
        PUSH: true,
        WHATSAPP: true
    },

    VENDOR_VERIFICATION_STATUS: VERIFICATION_STATUS.PENDING,
    VENDOR_IS_APPROVED: false,

    NULL: null,
    ARRAY: [],
    STRING: '',
    TRUE: true,
    FALSE: false,
    UNDEFINED: undefined,
    BLOOD_GROUP: null,
    MEDICAL_CONDITIONS: [],

    COUNTS: {
        ZERO: 0,
        ONE: 1,
        TWO: 2,
        THREE: 3,
        FOUR: 4,
        FIVE: 5,
        SIX: 6,
        SEVEN: 7,
        EIGHT: 8,
        NINE: 9
    }
};

// ============================================
export const VENDOR_PROFILE_TYPES = {
    BUSINESS: 'business',
    INDIVIDUAL: 'individual'
};

export const VENDOR_STATUS = {
    SET_PROFILE: 'setBusinessProfile',
    UPLOAD_DOCUMENTS: 'uploadDocuments',
    COMPLETED: 'profileCompleted'
};

// ============================================
// BOOKING & PAYMENTS
// ============================================

export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ONGOING: 'ongoing',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    EXPIRED: 'expired'
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    PARTIALLY_PAID: 'partially_paid',
    REFUNDED: 'refunded',
    REFUND_PENDING: 'refund_pending',
    UNPAID: 'unpaid',
    PARTIALLY_REFUNDED: 'partially_refunded'
};

export const PAYOUT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid'
};

export const REFUND_STATUS = {
    NONE: 'none',
    REFUNDED: 'refunded'
};

export const PAYMENT_METHODS = {
    UPI: 'upi',
    CARD: 'card',
    NET_BANKING: 'net_banking',
    WALLET: 'wallet',
    CASH: 'cash'
};

export const PAYMENT_GATEWAYS = {
    RAZORPAY: 'razorpay',
    STRIPE: 'stripe',
    PAYPAL: 'paypal'
};

export const BOOKING_SOURCE = {
    WEB: 'web',
    ANDROID: 'android',
    IOS: 'ios',
    ADMIN: 'admin'
};

export const DISCOUNT_TYPES = {
    PERCENTAGE: 'percentage',
    FLAT: 'flat'
};

export const CURRENCIES = {
    EUR: 'EUR',
    GBP: 'GBP',
    INR: 'INR',
    USD: 'USD'
};

// ============================================
// NOTIFICATIONS
// ============================================

export const NOTIFICATION_TYPES = {
    BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',
    BOOKING_CANCELLED: 'BOOKING_CANCELLED',
    NEW_BOOKING: 'NEW_BOOKING',
    PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
    VENDOR_VERIFIED: 'VENDOR_VERIFIED',
    VENDOR_REJECTED: 'VENDOR_REJECTED',
    PACKAGE_APPROVED: 'PACKAGE_APPROVED',
    PACKAGE_REJECTED: 'PACKAGE_REJECTED',
    MESSAGE_RECEIVED: 'MESSAGE_RECEIVED'
};



// ============================================
// GENERAL ATTRIBUTES
// ============================================

export const LANGUAGES = {
    BENGALI: 'bn',
    ENGLISH: 'en',
    GUJARATI: 'gu',
    HINDI: 'hi',
    KANNADA: 'kn',
    MALAYALAM: 'ml',
    MARATHI: 'mr',
    PUNJABI: 'pa',
    TAMIL: 'ta',
    TELUGU: 'te'
};

// ============================================
// PACKAGE CONFIGURATION
// ============================================

export const PACKAGE = {
    ...BASE_PACKAGE,
    ACCOMMODATION,
    ACTIVITY,
    TRANSPORT,
    CHARDHAM_TOUR: TRANSPORT.CHARDHAM_TOUR
};

const CONSTANTS = {
    USER_ROLES,
    STATUS,
    AUTH_PROVIDERS,
    GENDER,
    VERIFICATION_STATUS,
    DEFAULTS,
    APP_DETAILS,
    APP_SECRETS,
    THIRD_PARTY_APIS,
    SYSTEM_ENV,
    APP_CONSTANTS,
    VENDOR_PROFILE_TYPES,
    VENDOR_STATUS,
    PAGINATION,
    HTTP_STATUS,
    FILE_UPLOAD,
    UPLOAD_PATHS,
    SEED_ACCOUNTS,
    RESPONSE_MESSAGES,
    BOOKING_STATUS,
    PAYMENT_STATUS,
    PAYOUT_STATUS,
    REFUND_STATUS,
    PAYMENT_METHODS,
    PAYMENT_GATEWAYS,
    BOOKING_SOURCE,
    DISCOUNT_TYPES,
    CURRENCIES,
    NOTIFICATION_TYPES,
    NOTIFICATION_MESSAGES,
    LANGUAGES,
    PACKAGE
};

export default CONSTANTS;
