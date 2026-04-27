// ============================================
// BASIC TYPES & DEFAULTS
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
  MEDICAL_CONDITIONS: []
};

// ============================================
// SYSTEM & APP CONFIGURATION
// ============================================

export const APP_DETAILS = {
  APP_NAME: 'PahadiGo',
  APP_URL: process.env.APP_URL || 'http://www.pahadigo.com',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  MAIL_FROM_EMAIL: 'no-reply@pahadigo.com',
  CONTACT_MAIL_FROM_EMAIL: 'contact@pahadigo.com',
  PUSH_NOTIFICATION_SERVER_KEY: process.env.FCM_SERVER_KEY,
  SMTP_HOST: 'smtp.gmail.com',
  SMTP_PORT: 587
};

export const APP_SECRETS = {
  SOCIAL_PASS: process.env.SOCIAL_PASS || DEFAULTS.NULL,
  OTHER_ACCOUNT_PASS: process.env.OTHER_ACCOUNT_PASS || DEFAULTS.NULL,
  SMTP_ACCOUNT_PASS: process.env.SMTP_PASS || DEFAULTS.NULL,
  JWT_SECRET: process.env.JWT_SECRET || 'test_secret',
  MASTER_OTP: process.env.MASTER_OTP || '888888'
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

export const VENDOR_PROFILE_TYPES = {
  BUSINESS: 'business',
  INDIVIDUAL: 'individual'
};

export const VENDOR_STATUS = {
  SET_PROFILE: 'setBusinessProfile',
  UPLOAD_DOCUMENTS: 'uploadDocuments',
  COMPLETED: 'profileCompleted'
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
    GENERIC: 'Action completed successfully.',
    ACCOUNT_ACTIVATED: 'Your account has been successfully activated.',
    ACCOUNT_DEACTIVATED: 'Your account has been deactivated.',
    ADDED_TO_WISHLIST: 'Item added to wishlist.',
    REMOVED_FROM_WISHLIST: 'Item removed from wishlist.',
    HISTORY_CLEARED: 'Search history has been cleared.',
    FETCHED: 'Data retrieved successfully.',
    CREATED: 'Resource created successfully.',
    UPDATED: 'Changes saved successfully.',
    SEED: 'Database seeding completed successfully.',
    PROFILE_UPDATED: 'Profile updated successfully.',
    DELETED: 'Resource deleted successfully.',
    AVATAR_UPDATED: 'Profile picture updated successfully.',
  },
  USER: {
    FETCHED: 'User profile retrieved successfully.',
    UPDATED: 'User profile updated successfully.',
    DELETED: 'User account has been deleted.',
    NOT_FOUND: 'User not found in our records.',
  },
  TRAVELLER: {
    UPDATED: 'Traveller profile updated successfully.',
    DELETED: 'Traveller record deleted successfully.',
    NOT_FOUND: 'Traveller profile not found.',
  },
  ADMIN: {
    OCR_SUCCESS: 'Document scan and verification successful.',
    STATS_FETCHED: 'Platform statistics retrieved successfully.',
    PAYMENT_HISTORY_FETCHED: 'Financial records retrieved successfully.',
    BANNERS_FETCHED: 'Promotional banners retrieved.',
    COUPONS_FETCHED: 'Discount codes retrieved successfully.',
    INQUIRIES_FETCHED: 'Customer inquiries retrieved.',
    AUDIT_LOGS_FETCHED: 'System audit logs retrieved.',
  },
  AUTH: {
    OTP_SENT: 'A verification code has been sent to your registered contact.',
    OTP_FAILED: 'Could not send verification code. Please try again later.',
    INVALID_OTP: 'The code entered is invalid or has expired.',
    INVALID_CREDENTIALS: 'The email or password provided is incorrect.',
    ACCOUNT_LOCKED: 'Account temporarily locked due to multiple failed attempts.',
    ACCOUNT_SUSPENDED: 'Your account is suspended. Please contact support for assistance.',
    ACCOUNT_BLOCKED: 'Access to this account has been blocked.',
    ACCOUNT_INACTIVE: 'This account is currently inactive.',
    ACCOUNT_DELETED: 'This account has been permanently deleted.',
    PASSWORD_RESET_LINK_SENT: 'If an account exists, a reset link has been sent to the email.',
    PASSWORD_RESET_SUCCESS: 'Your password has been reset successfully.',
    TOKEN_EXPIRED: 'Session expired. Please log in again.',
    TOKEN_INVALID: 'Invalid session token. Access denied.',
    TOKEN_REQUIRED: 'Authentication required. Please provide a valid token.',
    NO_TOKEN: 'Authorization header is missing.',
    CONFIG_MISSING: 'Authentication configuration is missing. Contact site administrator.',
    AUTH_SERVICE_ERROR: 'An error occurred during authentication processing.',
    DIFFERENT_METHOD: 'This account is linked to a different login provider.',
    UNAUTHORIZED: 'You do not have permission to perform this action.',
    VENDORS_ONLY: 'This section is restricted to registered vendors.',
    ADMIN_ONLY: 'Administrative privileges are required for this action.',
    ADMIN_CANNOT_SWITCH: 'Administrators cannot change roles manually.',
    ALREADY_VENDOR: 'This account is already registered as a vendor.',
    ALREADY_TRAVELLER: 'This account is already registered as a traveller.',
    ROLE_SWITCHED: 'Account role updated successfully.',
    UPGRADED: 'Account successfully upgraded to vendor status.',
    DOWNGRADED: 'Account reverted to traveller status.',
    ROLE_MISMATCH: 'The provided email is registered with a different user role.',
    ACTIVATED: 'Account activated successfully.',
    DEACTIVATED: 'Account deactivated successfully.',
    LOGIN_SUCCESS: 'Authentication successful. Welcome back.',
    LOGOUT_SUCCESS: 'Logged out successfully.',
    TOKEN_REFRESHED: 'Access token renewed.',
    TOKEN_VALID: 'Current session is valid.',
    USER_NOT_FOUND: 'Account not found with provided identifiers.',
  },
  LOCATION: {
    COUNTRY_CREATED: 'Country added to the system.',
    STATE_CREATED: 'State added to the system.',
    CITY_CREATED: 'City added to the system.',
    FETCHED: 'Location data retrieved successfully.',
    SEED_INFO: 'Location data can be populated via administrative seeders.',
  },
  POLICY: {
    CREATED: 'Policy created successfully.',
    UPDATED: 'Policy updated successfully.',
    DELETED: 'Policy deleted successfully.',
    FETCHED: 'Policy records retrieved.',
    NOT_FOUND: 'Requested policy could not be found.',
  },
  VALIDATION: {
    REQUIRED_FIELDS: 'Please fill in all mandatory fields.',
    EMAIL_REQUIRED: 'A valid email address is required.',
    PHONE_REQUIRED: 'Phone number is mandatory.',
    EMAIL_OR_PHONE_REQUIRED: 'Please provide either an email address or a phone number.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_ROLE: 'Specified user role is not valid.',
    INVALID_DATA: 'The data provided is invalid or malformed.',
    INVALID_DATE: 'Date format is invalid. Please use a recognized format.',
    INVALID_PHONE: 'Invalid phone number format.',
    PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters long.',
    OTP_MIN_LENGTH: 'Verification code must be at least 4 digits.',
    NAME_MIN_LENGTH: 'Name must be at least 2 characters long.',
    NAME_REQUIRED: 'Full name is required.',
    EITHER_IDENTIFIER_REQUIRED: 'Email or phone number is required to proceed.',
    CATALOG_ID_REQUIRED: 'Catalog identifier is missing.',
    CATEGORY_REQUIRED: 'Please select a valid category.',
    ITEM_ID_REQUIRED: 'Service item identifier is required.',
    TERMS_REQUIRED: 'You must accept the Terms and Conditions to proceed.',
    ID_REQUIRED: 'Unique identifier is required for this action.',
  },
  ERROR: {
    GENERIC: 'An unexpected error occurred. Please try again.',
    SERVER_ERROR: 'Internal server error. Our team has been notified.',
    NOT_IMPLEMENTED: 'This feature is currently under development.',
    NOT_FOUND: 'The requested resource was not found.',
    ROUTE_NOT_FOUND: 'The specified API endpoint does not exist.',
    BAD_REQUEST: 'The request could not be processed due to invalid parameters.',
    INVALID_REQUEST: 'Request body is missing or incorrectly formatted.',
    FORBIDDEN: 'Access denied. You do not have sufficient permissions.',
    VALIDATION: 'One or more validation constraints failed.',
    ALREADY_EXISTS: 'Record already exists in our system.',
    INDEX_REQUIRED: 'Array index is required for this operation.',
    INVALID_FILE_TYPE: 'Unsupported file type. Please use JPG, PNG, WEBP, or PDF.',
    FILE_TOO_LARGE: 'File exceeds the maximum size limit of 5MB.',
  },
  PACKAGE: {
    CREATED: 'Travel package created successfully.',
    UPDATED: 'Package details updated successfully.',
    DELETED: 'Package removed from the system.',
    NOT_FOUND: 'Travel package not found.',
    NOT_FOUND_OR_UNAUTHORIZED: 'Package not found or access restricted.',
    APPROVED: 'Package successfully approved for listing.',
    REJECTED: 'Package rejected and moved to review.',
    FETCHED: 'Package catalog retrieved successfully.',
    STATUS_UPDATED: 'Package status updated.',
    NEARBY_FETCHED: 'Nearby services retrieved successfully.',
    CATEGORY_STATUS_UPDATED: 'Service category status updated.',
    CATALOG_NOT_FOUND: 'Service catalog not found.',
    CATALOG_UNAUTHORIZED: 'You do not have access to this service catalog.',
  },
  ITEM: {
    ADDED: 'Service item added successfully.',
    UPDATED: 'Service item details updated.',
    DELETED: 'Service item removed.',
    NOT_FOUND: 'Service item not found.',
    NOT_FOUND_IN_CATEGORY: 'Item not found in specified category.',
    STATUS_UPDATED: 'Item availability status updated.',
    FETCHED: 'Service items retrieved.',
    BASELINE_UPDATED: 'Service pricing baseline updated.',
  },
  CATEGORY: {
    CREATED: 'New category created successfully.',
    UPDATED: 'Category details modified.',
    DELETED: 'Category removed.',
    FETCHED: 'Categories retrieved successfully.',
    NOT_FOUND: 'Category not found.',
    INVALID: 'Selected category is invalid.',
    ALREADY_ASSIGNED: 'This category is already linked to your business.',
    ADDED: 'Category successfully added to your profile.',
    REMOVED: 'Category removed from your profile.',
    STATUS_UPDATED: 'Category operational status updated.',
    NOT_ASSIGNED: 'This category is not linked to your business profile.',
    DOC_MISMATCH: 'The provided documents do not match requirements.',
    MISSING_SERVICE_TYPE: 'Specified service type is missing or invalid.',
  },
  VENDOR: {
    PROFILE_CREATED: 'Vendor profile initialized successfully.',
    PROFILE_ALREADY_EXISTS: 'A business profile already exists for this account.',
    PROFILE_UPDATED: 'Business profile updated successfully.',
    PROFILE_INITIATED: 'Business profile registration initiated.',
    PROFILE_DELETED: 'Business profile permanently removed.',
    UPDATED: 'Vendor information saved successfully.',
    OPERATING_STATUS_UPDATED: 'Business operating status updated.',
    OPERATING_STATUS_REQUIRED: 'Operating status field is mandatory.',
    PERSONAL_UPDATED: 'Personal account information updated.',
    PERSONAL_AVATAR_UPDATED: 'Profile picture updated successfully.',
    ACCOUNT_RESTRICTED: 'This vendor account is under administrative review.',
    DOCUMENTS_FETCHED: 'Compliance documents retrieved.',
    DOCUMENTS_UPLOADED: 'Compliance documents uploaded successfully.',
    DOCUMENT_UPDATED: 'Compliance document status updated.',
    DOCUMENT_DELETED: 'Document removed from system.',
    BANK_FETCHED: 'Financial disbursement details retrieved.',
    BANK_CREATED: 'Bank account linked successfully.',
    BANK_UPDATED: 'Bank account details updated.',
    BANK_DELETED: 'Bank account unlinked successfully.',
    BANK_DETAILS_UPDATED: 'Financial information saved.',
    FETCHED: 'Vendor profile details retrieved.',
    ALREADY_EXISTS: 'A vendor record already exists for this user.',
    CATEGORIES_FETCHED: 'Linked business categories retrieved.',
    ELIGIBLE_CATEGORIES_FETCHED: 'Available business categories retrieved.',
    CATEGORY_DOCS_FETCHED: 'Required compliance documents retrieved.',
    CATEGORY_DOCS_LIST_FETCHED: 'Category-specific requirements retrieved.',
    CATEGORY_DOCS_UPLOADED: 'Category compliance documents uploaded.',
    CATEGORY_DOCS_ALL_FETCHED: 'Profile-wide compliance documents retrieved.',
    NOT_FOUND: 'Vendor record not found.',
    INCOMPLETE: 'Your vendor profile is incomplete. Please finish setup.',
    STATUS_UPDATED: 'Vendor account status updated.',
    DOCUMENT_STATUS_UPDATED: 'Verification status updated.',
    DOCUMENT_NOT_FOUND: 'Verification document not found.',
    INVALID_IMAGE: 'The uploaded file is corrupt or invalid.',
    INVENTORY_FETCHED: 'Service inventory retrieved successfully.',
    INVENTORY_ITEM_FETCHED: 'Inventory item details retrieved.',
    INVENTORY_UPDATED: 'Inventory stock/status updated.',
  },
  CLOSURE: {
    FETCHED: 'Business closure periods retrieved.',
    CREATED: 'Closure period marked successfully.',
    UPDATED: 'Closure schedules updated.',
    DELETED: 'Closure period removed.',
    NOT_FOUND: 'Specified closure period not found.',
  },
  BOOKING: {
    CREATED: 'Reservation confirmed successfully.',
    UPDATED: 'Reservation details modified.',
    CANCELLED: 'Reservation has been cancelled.',
    FETCHED: 'Bookings retrieved successfully.',
    FETCHED_DETAIL: 'Booking details retrieved.',
    FETCHED_HISTORICAL: 'Historical reservation records retrieved.',
    NOT_FOUND: 'Booking record not found.',
    NOT_FOUND_OR_UNAUTHORIZED: 'Booking not found or access denied.',
    ALREADY_CANCELLED: 'This booking is already cancelled.',
    SLOTS_NOT_AVAILABLE: 'Requested slots are not available for this date.',
    TIMELINE_ADDED: 'Operational event logged to booking timeline.',
    REFUND_INITIATED: 'Refund process has been initiated.',
    REFUNDED: 'Refund processed successfully.',
    DISPUTE_RAISED: 'Dispute submitted for administrative review.',
  },
  PAYMENT: {
    INITIATED: 'Transaction initiated successfully.',
    COMPLETED: 'Payment successfully processed.',
    FAILED: 'Payment transaction failed. Please try again.',
    VERIFIED: 'Payment status verified.',
    PAYOUT_MARKED: 'Payout record successfully recorded.',
  },
  REVIEW: {
    SUBMITTED: 'Feedback submitted successfully. Thank you.',
    FETCHED: 'Past reviews retrieved successfully.',
    UPDATED: 'Review modified successfully.',
    DELETED: 'Review removed from profile.',
    RETRACTED: 'Review retracted successfully.',
    NOT_FOUND: 'Review not found.',
    NOT_FOUND_OR_UNAUTHORIZED: 'Review restricted or not found.',
    ALREADY_SUBMITTED: 'You have already provided feedback for this service.',
  },
  WISHLIST: {
    FETCHED: 'Your wishlist has been retrieved.',
    EMPTY: 'Your wishlist is currently empty.',
    ADDED: 'Preferred service added to your wishlist.',
    REMOVED: 'Service removed from your wishlist.',
    ITEM_NOT_FOUND: 'The specified service is no longer available.',
  },
  SEARCH: {
    FETCHED: 'Recent search history retrieved.',
    CLEARED: 'Search history permanently cleared.',
  },
  DISPUTE: {
    RAISED: 'Resolution request submitted successfully.',
    RESOLVED: 'Dispute has been marked as resolved.',
    FETCHED: 'Active disputes retrieved successfully.',
  },
  SOS: {
    CONTACTS_UPDATED: 'Emergency contact database updated successfully.',
    ALERT_TRIGGERED: 'SOS Alert Activated. Emergency services notified.',
    LIMIT_EXCEEDED: 'Maximum limit reached (5 contacts per account).',
  },
  INQUIRY: {
    SUBMITTED: 'Service inquiry submitted. Someone will contact you soon.',
    RESOLVED: 'Inquiry successfully closed.',
    DELETED: 'Inquiry record removed.',
    NOT_FOUND: 'Inquiry details not found.',
  },
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
      CAR: 'Car',
      SUV: 'SUV',
      MPV: 'MPV',
      MINIVAN: 'Minivan',
      TRAVELLER: 'Tempo Traveller',
      BUS: 'Bus'
    },

    TRANSMISSION_TYPES: {
      MANUAL: 'Manual',
      AUTOMATIC: 'Automatic'
    },

    FUEL_POLICIES: {
      FULL_TO_FULL: 'Full to Full',
      LEVEL_TO_LEVEL: 'Level to Level',
      PAID_BY_CUSTOMER: 'Paid by Customer'
    },

    TOUR_MODE: {
      BY_ROAD: 'By Road',
      BY_HELICOPTER: 'By Helicopter',
      MIXED: 'Mixed'
    },

    CHARDHAM_VEHICLE_CATEGORIES: {
      REGULAR: 'Regular',
      DELUXE: 'Deluxe',
      LUXURY: 'Luxury'
    },

    CUSTOM_TRIP_SERVICE_TYPES: {
      POINT_TO_POINT: 'Point to Point',
      DAILY_RENTAL: 'Daily Rental',
      OUTSTATION: 'Outstation'
    }
  }
};

export default {
  USER_ROLES,
  STATUS,
  AUTH_PROVIDERS,
  GENDER,
  VERIFICATION_STATUS,
  DEFAULTS,
  APP_DETAILS,
  APP_SECRETS,
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
