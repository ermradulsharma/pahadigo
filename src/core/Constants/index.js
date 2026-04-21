// ============================================
// AUTH & USER CONSTANTS
// ============================================

export const USER_ROLES = {
    ADMIN: 'admin',
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
// SYSTEM & APP CONFIGURATION
// ============================================

export const APP_DETAILS = {
    APP_NAME: 'PahadiGo',
    APP_URL: 'http://www.pahadigo.com',
    MAIL_FROM_EMAIL: 'no-reply@pahadigo.com',
    CONTACT_MAIL_FROM_EMAIL: 'contact@pahadigo.com',
    PUSH_NOTIFICATION_SERVER_KEY: process.env.FCM_SERVER_KEY
};

export const APP_SECRETS = {
    SOCIAL_PASS: process.env.SOCIAL_PASS,
    OTHER_ACCOUNT_PASS: process.env.OTHER_ACCOUNT_PASS,
    SMTP_ACCOUNT_PASS: process.env.SMTP_PASS
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

    BLOOD_GROUP: null,
    MEDICAL_CONDITIONS: []
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

export const RESPONSE_MESSAGES = {
    SUCCESS: {
        GENERIC: 'Action completed successfully',
        CREATED: 'Created successfully',
        UPDATED: 'Updated successfully',
        DELETED: 'Deleted successfully',
        FETCHED: 'Retrieved successfully',
        // Aliases for backward compatibility
        CREATE: 'Created successfully',
        UPDATE: 'Updated successfully',
        DELETE: 'Deleted successfully',
        FETCH: 'Retrieved successfully',

        LOGGED_IN: 'Login successful',
        LOGGED_OUT: 'Logged out successfully',
        SEED: 'Database seeded successfully',
        PROFILE_UPDATED: 'Profile updated successfully',
        AVATAR_UPDATED: 'Avatar updated successfully',
        ACCOUNT_ACTIVATED: 'Account activated successfully',
        ACCOUNT_DEACTIVATED: 'Account deactivated successfully',
        ADDED_TO_WISHLIST: 'Added to wishlist',
        REMOVED_FROM_WISHLIST: 'Removed from wishlist',
        HISTORY_CLEARED: 'Search history cleared',
    },
    USER: {
        FETCHED: 'User profile retrieved successfully',
        UPDATED: 'User profile updated successfully',
        DELETED: 'User deleted successfully',
        NOT_FOUND: 'User not found',
    },
    TRAVELLER: {
        UPDATED: 'Traveller updated successfully',
        DELETED: 'Traveller deleted successfully',
        NOT_FOUND: 'Traveller not found',
    },
    ADMIN: {
        OCR_SUCCESS: 'OCR verification successful',
        STATS_FETCHED: 'Dashboard stats retrieved successfully',
        PAYMENT_HISTORY_FETCHED: 'Payment history retrieved successfully',
        BANNERS_FETCHED: 'Banners retrieved successfully',
        COUPONS_FETCHED: 'Coupons retrieved successfully',
        INQUIRIES_FETCHED: 'Inquiries retrieved successfully',
        AUDIT_LOGS_FETCHED: 'Audit logs retrieved successfully',
    },
    AUTH: {
        OTP_SENT: 'OTP sent successfully',
        OTP_FAILED: 'Failed to send OTP',
        INVALID_OTP: 'Invalid or expired OTP',
        INVALID_CREDENTIALS: 'Invalid credentials',
        ACCOUNT_LOCKED: 'Account is locked',
        ACCOUNT_SUSPENDED: 'Your account is suspended. Please contact support.',
        ACCOUNT_BLOCKED: 'Your account is blocked. Please contact support.',
        ACCOUNT_INACTIVE: 'Your account is inactive. Please contact support.',
        ACCOUNT_DELETED: 'Your account is deleted. Please contact support.',
        PASSWORD_RESET_LINK_SENT: 'Password reset link sent',
        PASSWORD_RESET_SUCCESS: 'Password reset successfully',
        TOKEN_EXPIRED: 'Token has expired',
        TOKEN_INVALID: 'Invalid token',
        TOKEN_REQUIRED: 'Authentication token is required',
        NO_TOKEN: 'No token provided',
        CONFIG_MISSING: 'Authentication service is not configured',
        AUTH_SERVICE_ERROR: 'Authentication Service Error',
        DIFFERENT_METHOD: 'Account uses a different login method',
        UNAUTHORIZED: 'Unauthorized access',
        VENDORS_ONLY: 'This action is restricted to vendors only',
        ADMIN_ONLY: 'This action is restricted to administrators only',
        ADMIN_CANNOT_SWITCH: 'Admins cannot switch roles.',
        ALREADY_VENDOR: 'Access denied: You are already a vendor.',
        ALREADY_TRAVELLER: 'Access denied: You are already a traveller.',
        ROLE_SWITCHED: 'Role switched successfully',
        UPGRADED: 'Account upgraded to vendor successfully',
        DOWNGRADED: 'Account downgraded to traveller successfully',
        ROLE_MISMATCH: 'Email registered with different role.',
        ACTIVATED: 'Account activated successfully',
        DEACTIVATED: 'Account deactivated successfully',
        LOGIN_SUCCESS: 'Login successful',
        LOGOUT_SUCCESS: 'Logged out successfully',
        TOKEN_REFRESHED: 'Token refreshed successfully',
        TOKEN_VALID: 'Token is valid',
        USER_NOT_FOUND: 'User not found',
    },
    LOCATION: {
        COUNTRY_CREATED: 'Country created successfully',
        STATE_CREATED: 'State created successfully',
        CITY_CREATED: 'City created successfully',
        FETCHED: 'Location data retrieved successfully',
        SEED_INFO: 'Use CLI seeder for locations',
    },
    POLICY: {
        CREATED: 'Policy created successfully',
        UPDATED: 'Policy updated successfully',
        DELETED: 'Policy deleted successfully',
        FETCHED: 'Policies retrieved successfully',
        NOT_FOUND: 'Policy not found',
    },
    VALIDATION: {
        REQUIRED_FIELDS: 'All required fields must be provided',
        EMAIL_REQUIRED: 'Email address is required',
        PHONE_REQUIRED: 'Phone number is required',
        EMAIL_OR_PHONE_REQUIRED: 'Either email or phone number is required',
        INVALID_EMAIL: 'Invalid email format',
        INVALID_ROLE: 'Invalid user role',
        INVALID_DATA: 'Invalid data provided',
        INVALID_DATE: 'Invalid date format',
        INVALID_PHONE: 'Invalid phone number format',
        PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters',
        OTP_MIN_LENGTH: 'OTP must be at least 4 digits',
        NAME_MIN_LENGTH: 'Name must be at least 2 characters',
        NAME_REQUIRED: 'Name is required',
        EITHER_IDENTIFIER_REQUIRED: 'Either identifier, email, or phone is required',
        CATALOG_ID_REQUIRED: 'Catalog ID is required',
        CATEGORY_REQUIRED: 'Category is required',
        ITEM_ID_REQUIRED: 'Item ID is required',
        TERMS_REQUIRED: 'Terms and Conditions must be accepted',
        ID_REQUIRED: 'ID is required',
    },
    ERROR: {
        GENERIC: 'Something went wrong',
        SERVER_ERROR: 'Internal Server Error',
        NOT_IMPLEMENTED: 'Not Implemented',
        NOT_FOUND: 'Resource not found',
        ROUTE_NOT_FOUND: 'Route not found',
        BAD_REQUEST: 'Invalid request',
        INVALID_REQUEST: 'Invalid request data',
        FORBIDDEN: 'Forbidden access',
        VALIDATION: 'Validation failed',
        ALREADY_EXISTS: 'Resource already exists',
        INDEX_REQUIRED: 'Index is required for array fields',
        INVALID_FILE_TYPE: 'Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.',
        FILE_TOO_LARGE: 'File size exceeds the allowed limit.',
    },
    PACKAGE: {
        CREATED: 'Package created successfully',
        UPDATED: 'Package updated successfully',
        DELETED: 'Package deleted successfully',
        NOT_FOUND: 'Package not found',
        NOT_FOUND_OR_UNAUTHORIZED: 'Package not found or unauthorized',
        APPROVED: 'Package approved successfully',
        REJECTED: 'Package rejected',
        FETCHED: 'Packages retrieved successfully',
        STATUS_UPDATED: 'Package status updated',
        NEARBY_FETCHED: 'Nearby packages retrieved',
        CATEGORY_STATUS_UPDATED: 'Category status updated',
        CATALOG_NOT_FOUND: 'Package catalog not found',
        CATALOG_UNAUTHORIZED: 'Unauthorized access to this package catalog',
    },
    ITEM: {
        ADDED: 'Item added',
        UPDATED: 'Item updated successfully',
        DELETED: 'Item deleted successfully',
        NOT_FOUND: 'Item not found',
        NOT_FOUND_IN_CATEGORY: 'Item not found in any category',
        STATUS_UPDATED: 'Item status updated successfully',
        FETCHED: 'Items retrieved successfully',
        BASELINE_UPDATED: 'Item baseline updated successfully',
    },
    CATEGORY: {
        CREATED: 'Category created successfully',
        UPDATED: 'Category updated successfully',
        DELETED: 'Category deleted successfully',
        FETCHED: 'Categories retrieved successfully',
        NOT_FOUND: 'Category not found',
        INVALID: 'Invalid category provided',
        ALREADY_ASSIGNED: 'This category is already assigned to your business profile',
        ADDED: 'Category added successfully',
        REMOVED: 'Category removed successfully',
        STATUS_UPDATED: 'Category status updated',
        NOT_ASSIGNED: 'This category is not yet part of your business profile. Please add it first.',
        DOC_MISMATCH: 'Mismatch between document identifiers and files provided.',
        MISSING_SERVICE_TYPE: 'Service category (serviceType) is missing or could not be identified',
    },
    VENDOR: {
        PROFILE_CREATED: 'Vendor profile created successfully',
        PROFILE_ALREADY_EXISTS: 'A business profile already exists for this vendor. Please use the update endpoint.',
        PROFILE_UPDATED: 'Vendor profile updated successfully',
        PROFILE_INITIATED: 'Business profile initiated successfully',
        PROFILE_DELETED: 'Business profile deleted successfully',
        UPDATED: 'Vendor profile updated successfully',
        OPERATING_STATUS_UPDATED: 'Business operational status updated',
        OPERATING_STATUS_REQUIRED: 'isOperating field is required',
        PERSONAL_UPDATED: 'Personal profile updated successfully',
        PERSONAL_AVATAR_UPDATED: 'Personal avatar updated successfully',
        ACCOUNT_RESTRICTED: 'This account is restricted by administration.',
        DOCUMENTS_FETCHED: 'Documents fetched',
        DOCUMENTS_UPLOADED: 'Documents uploaded successfully',
        DOCUMENT_UPDATED: 'Document updated',
        DOCUMENT_DELETED: 'Document deleted',
        BANK_FETCHED: 'Bank details fetched',
        BANK_CREATED: 'Bank details created',
        BANK_UPDATED: 'Bank details updated',
        BANK_DELETED: 'Bank details deleted successfully',
        BANK_DETAILS_UPDATED: 'Bank details updated successfully',
        FETCHED: 'Vendor profile retrieved successfully',
        ALREADY_EXISTS: 'Vendor profile already exists.',
        CATEGORIES_FETCHED: 'Vendor categories fetched',
        ELIGIBLE_CATEGORIES_FETCHED: 'Eligible categories fetched',
        CATEGORY_DOCS_FETCHED: 'Category document requirements fetched',
        CATEGORY_DOCS_LIST_FETCHED: 'Category document list fetched',
        CATEGORY_DOCS_UPLOADED: 'Category documents uploaded successfully',
        CATEGORY_DOCS_ALL_FETCHED: 'Vendor\'s profile-wide uploaded documents fetched',
        NOT_FOUND: 'Vendor profile not found',
        INCOMPLETE: 'Vendor profile not completed',
        STATUS_UPDATED: 'Vendor status updated successfully',
        DOCUMENT_STATUS_UPDATED: 'Document status updated successfully',
        DOCUMENT_NOT_FOUND: 'Vendor document not found',
        INVALID_IMAGE: 'Fetched image is too small or invalid',
        INVENTORY_FETCHED: 'Packages retrieved successfully',
        INVENTORY_ITEM_FETCHED: 'Inventory fetched successfully',
        INVENTORY_UPDATED: 'Inventory updated successfully',
    },
    CLOSURE: {
        FETCHED: 'Closure periods fetched',
        CREATED: 'Closure added',
        UPDATED: 'Closure updated',
        DELETED: 'Closure deleted',
        NOT_FOUND: 'Closure period not found',
    },
    BOOKING: {
        CREATED: 'Booking created successfully',
        UPDATED: 'Booking updated successfully',
        CANCELLED: 'Booking cancelled successfully',
        FETCHED: 'Bookings retrieved successfully',
        FETCHED_DETAIL: 'Booking details retrieved',
        FETCHED_HISTORICAL: 'Historical bookings retrieved',
        NOT_FOUND: 'Booking not found',
        NOT_FOUND_OR_UNAUTHORIZED: 'Booking not found or unauthorized',
        ALREADY_CANCELLED: 'Booking is already cancelled',
        TIMELINE_ADDED: 'Timeline event added',
        REFUND_INITIATED: 'Refund initiated successfully',
        REFUNDED: 'Booking refunded successfully',
        DISPUTE_RAISED: 'Dispute raised successfully',
    },
    PAYMENT: {
        INITIATED: 'Payment initiated successfully',
        COMPLETED: 'Payment completed successfully',
        FAILED: 'Payment failed',
        VERIFIED: 'Payment verified successfully',
        PAYOUT_MARKED: 'Payout marked successfully',
    },
    REVIEW: {
        SUBMITTED: 'Review submitted successfully',
        FETCHED: 'Historical reviews retrieved',
        UPDATED: 'Review updated successfully',
        DELETED: 'Review deleted successfully',
        RETRACTED: 'Review retracted successfully',
        NOT_FOUND: 'Review not found',
        NOT_FOUND_OR_UNAUTHORIZED: 'Review not found or unauthorized',
        ALREADY_SUBMITTED: 'Feedback already provided for this service',
    },
    WISHLIST: {
        FETCHED: 'Wishlist retrieved',
        EMPTY: 'Wishlist is empty',
        ADDED: 'Added to wishlist',
        REMOVED: 'Removed from wishlist',
        ITEM_NOT_FOUND: 'Package item not found',
    },
    SEARCH: {
        FETCHED: 'Recent searches retrieved',
        CLEARED: 'Search history cleared',
    },
    DISPUTE: {
        RAISED: 'Dispute raised successfully',
        RESOLVED: 'Dispute resolved',
        FETCHED: 'Customer disputes retrieved',
    },
    SOS: {
        CONTACTS_UPDATED: 'Emergency contacts updated successfully.',
        ALERT_TRIGGERED: 'SOS Alert Triggered. Help is being contacted.',
        LIMIT_EXCEEDED: 'Must be an array of max 5 contacts',
    },
    INQUIRY: {
        SUBMITTED: 'Inquiry submitted successfully',
        RESOLVED: 'Inquiry marked as resolved',
        DELETED: 'Inquiry deleted successfully',
        NOT_FOUND: 'Inquiry not found',
    },
};

// ============================================
// BOOKING & PAYMENTS
// ============================================

export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed'
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed'
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

export const NOTIFICATION_MESSAGES = {
    BOOKING_CONFIRMED: "Your booking has been confirmed successfully!",
    BOOKING_CANCELLED: "Your booking has been cancelled.",
    NEW_BOOKING: "You have a new booking request.",
    PAYMENT_SUCCESS: "Payment received successfully for your booking.",
    VENDOR_VERIFIED: "Congratulations! Your vendor profile has been verified.",
    VENDOR_REJECTED: "Your vendor profile verification was unsuccessful.",
    PACKAGE_APPROVED: "Your travel package has been approved and is now live.",
    PACKAGE_REJECTED: "Your travel package requires changes before approval.",
    MESSAGE_RECEIVED: "You have received a new message."
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
    THEMES: {
        ADVENTURE: 'adventure',
        FAMILY: 'family',
        HONEYMOON: 'honeymoon',
        NATURE: 'nature',
        PILGRIMAGE: 'pilgrimage',
        RELIGIOUS: 'religious',
        SOLO: 'solo',
        SPORTS: 'sports',
        STAYCATION: 'staycation',
        WEEKEND_GETAWAY: 'weekend_getaway',
        WILDLIFE: 'wildlife',
        WORKATION: 'workation',
        YOGA_WELLNESS: 'yoga_wellness'
    },

    TYPES: {
        BUNGEE_JUMPING: 'bungee-jumping',
        CAMPING: 'camping',
        CHARDHAM_TOUR: 'chardham-tour',
        CUSTOM_TRIP: 'custom-trip',
        HOMESTAY: 'homestay',
        HOTEL: 'hotel',
        PARAGLIDING: 'paragliding',
        RAFTING: 'rafting',
        SKIING: 'skiing',
        TREKKING: 'trekking',
        VEHICLE_RENTAL: 'vehicle-rental'
    },

    DIFFICULTY: {
        EASY: 'Easy',
        MODERATE: 'Moderate',
        HARD: 'Hard'
    },

    FITNESS_LEVELS: {
        BASIC: 'Basic',
        GOOD: 'Good',
        EXCELLENT: 'Excellent'
    },

    SEASONS: {
        ALL_YEAR: 'All Year',
        AUTUMN: 'Autumn',
        MONSOON: 'Monsoon',
        SPRING: 'Spring',
        SUMMER: 'Summer',
        WINTER: 'Winter'
    },

    ACCOMMODATION: {
        HOTEL_TYPES: {
            ASHRAM: 'Ashram',
            BOUTIQUE: 'Boutique',
            BUDGET: 'Budget',
            DELUXE: 'Deluxe',
            DHARAMSHALA: 'Dharamshala',
            GUEST_HOUSE: 'Guest House',
            HAVELI: 'Haveli',
            HERITAGE: 'Heritage',
            HOSTEL: 'Hostel',
            LODGE: 'Lodge',
            LUXURY: 'Luxury',
            MOTEL: 'Motel',
            RESORT: 'Resort',
            SERVICE_APARTMENT: 'Service Apartment'
        },

        HOMESTAY_TYPES: {
            BUNGALOW: 'Bungalow',
            COTTAGE: 'Cottage',
            FARMSTAY: 'Farmstay',
            HERITAGE: 'Heritage',
            KATH_KUNI: 'Kath Kuni',
            MUDHOUSE: 'Mudhouse',
            STONE_HOUSE: 'Stone House',
            TREEHOUSE: 'Treehouse',
            VILLA: 'Villa',
            WOODEN_CHALET: 'Wooden Chalet',
            ALPINE: 'Alpine',
            APPLE_ORCHARD_STAY: 'Apple Orchard Stay',
            DESERT: 'Desert',
            JUNGLE: 'Jungle',
            LUXURY: 'Luxury',
            OFFBEAT: 'Offbeat',
            ORCHARD: 'Orchard',
            RIVERSIDE: 'Riverside',
            VILLAGE_STAY: 'Village Stay'
        },

        ROOM_TYPES: {
            ATTIC: 'Attic',
            COTTAGE: 'Cottage',
            DELUXE: 'Deluxe',
            DORMITORY: 'Dormitory',
            DUPLEX: 'Duplex',
            FAMILY_ROOM: 'Family Room',
            GLASS_HOUSE: 'Glass House',
            MUD_ROOM: 'Mud Room',
            PAHADI_HOUSE: 'Pahadi House',
            PENTHOUSE: 'Penthouse',
            STANDARD: 'Standard',
            STUDIO: 'Studio Apartment',
            SUITE: 'Suite',
            TENT: 'Tent',
            TREEHOUSE: 'Treehouse',
            WOODEN_ATTIC: 'Wooden Attic'
        },

        BED_TYPES: {
            BUNK: 'Bunk',
            DOUBLE: 'Double',
            KING: 'King',
            QUEEN: 'Queen',
            SINGLE: 'Single'
        },

        BATHROOM_TYPES: {
            PRIVATE: 'Private',
            SHARED: 'Shared',
            COMMON: 'Common'
        },

        RENTAL_TYPES: {
            ENTIRE_PLACE: 'Entire Place',
            PRIVATE_ROOM: 'Private Room',
            SHARED_ROOM: 'Shared Room'
        },

        FOOD_POLICIES: {
            ALL: 'All',
            VEG_ONLY: 'Veg Only',
            EGGETARIAN: 'Eggetarian',
            JAIN: 'Jain'
        },

        KITCHEN_ACCESS_TYPES: {
            NONE: 'None',
            PRIVATE: 'Private',
            SHARED: 'Shared',
            KITCHENETTE: 'Kitchenette'
        },

        PARKING_TYPES: {
            PRIVATE: 'Private',
            STREET: 'Street',
            PAID: 'Paid Parking',
            FREE: 'Free Parking'
        },

        HEATING_TYPES: {
            ELECTRIC: 'Electric Heater',
            FIREPLACE: 'Fireplace',
            BUKHARI: 'Bukhari',
            CENTRAL: 'Central Heating',
            BLOWER: 'Blower'
        },

        MEAL_TYPES: {
            NO_MEALS: 'No Meals Included',
            BREAKFAST_ONLY: 'Breakfast Only',
            BREAKFAST_DINNER: 'Breakfast & Dinner',
            ALL_MEALS: 'All Meals',
            VEG_ONLY: 'Vegetarian Only',
            TRADITIONAL_PAHADI: 'Traditional Pahadi Meals',
            BUFFET: 'Buffet',
            A_LA_CARTE: 'A La Carte (As per menu)',
            SELF_COOKING: 'Self Cooking Kitchen Available',
            TEA_SNACKS: 'Tea & Snacks Only'
        },

        VIEW_TYPES: {
            APPLE_ORCHARD: 'Apple Orchard',
            CITY: 'City',
            FOREST: 'Forest',
            GANGA_VIEW: 'Ganga View',
            GARDEN: 'Garden',
            HIMALAYAN_VIEW: 'Himalayan View',
            LAKE: 'Lake',
            MEADOW: 'Meadow',
            MOUNTAIN: 'Mountain',
            NO_VIEW: 'No View',
            OCEAN: 'Ocean',
            ORCHARD: 'Orchard',
            POOL: 'Pool',
            RIVER: 'River',
            SEA: 'Sea',
            SNOW_PEAK: 'Snow Peak',
            SUNRISE: 'Sunrise',
            SUNSET: 'Sunset',
            VALLEY: 'Valley'
        }
    },

    ACTIVITY: {
        TREK_TYPES: {
            DAY_TREK: 'Day Trek',
            MULTI_DAY_TREK: 'Multi-Day Trek',
            EXPEDITION: 'Expedition'
        },

        CAMPING_TYPES: {
            RIVERSIDE: 'Riverside',
            ALPINE: 'Alpine',
            LUXURY_SWISS: 'Luxury Swiss',
            DOME_TENT: 'Dome Tent',
            JUNGLE_CAMP: 'Jungle Camp'
        },

        RAPID_GRADES: {
            I: 'Grade I',
            II: 'Grade II',
            III: 'Grade III',
            IV: 'Grade IV',
            V: 'Grade V'
        },

        SKI_DIFFICULTY: {
            ADVANCED: 'Advanced',
            BEGINNER: 'Beginner',
            INTERMEDIATE: 'Intermediate'
        },

        PARAGLIDING_TYPES: {
            CROSS_COUNTRY: 'Cross Country',
            LONG_FLY: 'Long Fly',
            MEDIUM_FLY: 'Medium Fly',
            SHORT_FLY: 'Short Fly'
        },

        JUMP_TYPES: {
            FORWARD: 'Forward',
            BACKWARD: 'Backward',
            TANDEM: 'Tandem'
        }
    },

    TRANSPORT: {
        VEHICLE_TYPES: {
            BIKE: 'Bike',
            SCOOTER: 'Scooter',
            ELECTRIC_BIKE: 'Electric Bike',
            CRUISER: 'Cruiser',
            SPORT_BIKE: 'Sport Bike',
            SEDAN: 'Sedan',
            SUV: 'SUV',
            HATCHBACK: 'Hatchback',
            LUXURY: 'Luxury'
        },

        TRANSMISSION_TYPES: {
            MANUAL: 'Manual',
            AUTOMATIC_VARIOMATIC: 'Automatic/Variomatic'
        },

        FUEL_POLICIES: {
            FULL_TO_EMPTY: 'full_to_empty',
            FULL_TO_FULL: 'full_to_full',
            SAME_TO_SAME: 'same_to_same'
        },

        TOUR_MODE: {
            BUS: 'Bus',
            TEMPO_TRAVELLER: 'Tempo Traveller',
            CAR: 'Car',
            HELICOPTER: 'Helicopter'
        },

        CUSTOM_TRIP_SERVICE_TYPES: {
            POINT_TO_POINT: 'Point-to-Point',
            SIGHTSEEING: 'Sightseeing',
            OUTSTATION: 'Outstation'
        },

        YATRA_TYPES: {
            COMPLETE_CHAR_DHAM: 'Complete Char Dham (4 Dham)',
            DO_DHAM: 'Do Dham (Kedarnath-Badrinath)',
            GANGOTRI_YAMUNOTRI: 'Gangotri-Yamunotri',
            EK_DHAM: 'Ek Dham'
        },

        CHARDHAM_VEHICLE_CATEGORIES: {
            BUDGET: 'Budget (Sumo/Bolero)',
            COMFORT: 'Comfort (Innova/Ertiga)',
            TEMPO_TRAVELLER: 'Tempo Traveller'
        }
    }
};
