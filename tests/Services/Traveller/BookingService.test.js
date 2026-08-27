import { jest } from '@jest/globals';

jest.unstable_mockModule('mongoose', () => {
    const mockMongoose = {
        startSession: jest.fn(() => ({
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn(),
            withTransaction: jest.fn(async (cb) => {
                return await cb();
            })
        })),
        Types: { ObjectId: { isValid: jest.fn(() => true) } },
        Schema: Object.assign(
            jest.fn().mockImplementation(() => ({
                virtual: jest.fn().mockReturnThis(),
                set: jest.fn().mockReturnThis(),
                index: jest.fn().mockReturnThis(),
                pre: jest.fn().mockReturnThis(),
                post: jest.fn().mockReturnThis()
            })),
            { Types: { ObjectId: jest.fn() } }
        ),
        model: jest.fn(),
        models: {}
    };
    return {
        __esModule: true,
        default: mockMongoose,
        Schema: mockMongoose.Schema,
        model: mockMongoose.model,
        models: mockMongoose.models,
        Types: mockMongoose.Types
    };
});

jest.unstable_mockModule('@/core/Models/Booking.js', () => {
    const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn(),
        then: function(resolve, reject) { return Promise.resolve(this.mockDoc).then(resolve, reject); }
    };
    return {
        default: { 
            create: jest.fn(), 
            findOne: jest.fn(() => mockQuery), 
            findById: jest.fn(), 
            find: jest.fn(() => ({ sort: jest.fn(() => Promise.resolve([])) })) 
        }
    };
});

jest.unstable_mockModule('@/core/Models/User.js', () => ({
    default: { findById: jest.fn() }
}));

jest.unstable_mockModule('@/core/Models/Dispute.js', () => ({
    default: { create: jest.fn(), findOne: jest.fn() }
}));

jest.unstable_mockModule('@/core/Models/Coupon.js', () => ({
    default: { findOneAndUpdate: jest.fn() }
}));

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    RESPONSE_MESSAGES: {
        BOOKING: { NOT_FOUND: 'Booking not found', NOT_FOUND_OR_UNAUTHORIZED: 'Booking not found', SLOTS_NOT_AVAILABLE: 'Slots not available' },
        PACKAGE: { NOT_FOUND: 'Package not found' },
        USER: { NOT_FOUND: 'User not found' },
        VENDOR: { NOT_FOUND: 'Vendor not found' },
        ERROR: { INVALID_SIGNATURE: 'Invalid signature' },
        VALIDATION: { ID_REQUIRED: 'ID required', EITHER_IDENTIFIER_REQUIRED: 'Either identifier required', INVALID_DATE: 'Invalid date' }
    },
    BOOKING_STATUS: { PENDING: 'pending', CONFIRMED: 'confirmed', ONGOING: 'ongoing', COMPLETED: 'completed', CANCELLED: 'cancelled' },
    PAYMENT_STATUS: { UNPAID: 'unpaid', PAID: 'paid', REFUND_PENDING: 'refund_pending' },
    REFUND_STATUS: { REFUNDED: 'refunded' },
    HTTP_STATUS: { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 },
    DEFAULTS: { TRUE: true, FALSE: false, NULL: null, COUNTS: { ZERO: 0, ONE: 1 } },
    AUTH_PROVIDERS: { LOCAL: 'local', GOOGLE: 'google', FACEBOOK: 'facebook', APPLE: 'apple', PHONE: 'phone' },
    USER_ROLES: { ADMIN: 'admin', VENDOR: 'vendor', TRAVELLER: 'traveller' },
    STATUS: { ACTIVE: 'active', INACTIVE: 'inactive' },
    GENDER: { MALE: 'male', FEMALE: 'female', OTHER: 'other', PREFER_NOT_TO_SAY: 'prefer_not_to_say' },
    VENDOR_STATUS: { PENDING: 'pending', ACTIVE: 'active', REJECTED: 'rejected', SUSPENDED: 'suspended' },
    VENDOR_PROFILE_TYPES: { INDIVIDUAL: 'individual', BUSINESS: 'business' },
    VERIFICATION_STATUS: { PENDING: 'pending', VERIFIED: 'verified', REJECTED: 'rejected' },
    DISCOUNT_TYPES: { PERCENTAGE: 'percentage', FLAT: 'flat' },
    PACKAGE: { 
        ACCOMMODATION: { 
            HOTEL: { ROOM_TYPE: { STANDARD_ROOM: 'Standard' } }, 
            HOMESTAY: { ROOM_TYPE: {} }, 
            COMMON: { BED_TYPE: { DOUBLE: 'Double' } } 
        }, 
        ACTIVITY: {}, 
        TRANSPORT: {}, 
        MEALTYPE: { NoMealsIncluded: 'No Meals Included' }, 
        THEMES: { ADVENTURE: 'adventure' }, 
        CATEGORY: { HOTEL: 'Hotel' }, 
        BATHROOM_TYPE: { PRIVATE: 'Private' } 
    }
}));

jest.unstable_mockModule('@/core/Services/General/NotificationService.js', () => ({
    default: { notifyBookingStatus: jest.fn() }
}));

jest.unstable_mockModule('@/core/Services/General/RazorpayService.js', () => ({
    default: { createOrder: jest.fn(), verifySignature: jest.fn() }
}));

jest.unstable_mockModule('@/core/Services/Traveller/PackageService.js', () => ({
    default: { getAvailablePackageItem: jest.fn() }
}));

jest.unstable_mockModule('@/core/Services/Traveller/InventoryService.js', () => ({
    default: { checkAvailabilityRange: jest.fn(), reserveSlotsRange: jest.fn() }
}));

jest.unstable_mockModule('@/core/Services/Vendor/BusinessService.js', () => ({
    default: {
        getBusinessById: jest.fn(() => Promise.resolve({
            businessName: 'Test Business',
            ownerName: 'Vendor Owner',
            bankDetails: {
                accountHolderName: 'Vendor Owner',
                accountNumber: '1234567890',
                ifscCode: 'TEST0001234',
                bankName: 'Test Bank'
            }
        }))
    }
}));

jest.unstable_mockModule('@/core/Lib/appConfig.js', () => ({
    getAppConfig: jest.fn(() => Promise.resolve({
        razorpay: { key_id: 'test_key', key_secret: 'test_secret' },
        tax: { gst: 5, service_tax: 0 }
    }))
}));

jest.unstable_mockModule('@/core/Helpers/queryHelpers.js', () => ({
    getPackageItemById: jest.fn(),
    getUserById: jest.fn(),
    getBusinessById: jest.fn(),
    getBookingBy: jest.fn()
}));

const { default: BookingService } = await import('@/core/Services/Traveller/BookingService.js');
const { default: Booking } = await import('@/core/Models/Booking.js');
const { default: Dispute } = await import('@/core/Models/Dispute.js');
const { default: Coupon } = await import('@/core/Models/Coupon.js');
const { default: PackageService } = await import('@/core/Services/Traveller/PackageService.js');
const { default: InventoryService } = await import('@/core/Services/Traveller/InventoryService.js');
const { default: BusinessService } = await import('@/core/Services/Vendor/BusinessService.js');
const queryHelpers = await import('@/core/Helpers/queryHelpers.js');

describe('BookingService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should be defined', () => {
        expect(BookingService).toBeDefined();
    });
});
