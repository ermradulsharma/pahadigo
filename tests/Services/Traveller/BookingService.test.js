import { jest } from '@jest/globals';
// Force Jest cache invalidation

// 1. Mocks Layer
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

jest.unstable_mockModule('@/core/Models/Booking.js', () => ({
    default: { create: jest.fn(), findOne: jest.fn(), findById: jest.fn(), find: jest.fn(() => ({ sort: jest.fn(() => Promise.resolve([])) })) }
}));

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
        ERROR: { INVALID_SIGNATURE: 'Invalid signature' }
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
    getBookingBy: jest.fn()
}));

// 2. Dynamic Imports
const { default: BookingService } = await import('@/core/Services/Traveller/BookingService.js');
const { default: Booking } = await import('@/core/Models/Booking.js');
const { default: Dispute } = await import('@/core/Models/Dispute.js');
const { default: Coupon } = await import('@/core/Models/Coupon.js');
const { default: PackageService } = await import('@/core/Services/Traveller/PackageService.js');
const { default: InventoryService } = await import('@/core/Services/Traveller/InventoryService.js');
const { default: BusinessService } = await import('@/core/Services/Vendor/BusinessService.js');
const queryHelpers = await import('@/core/Helpers/queryHelpers.js');
const { default: RazorpayService } = await import('@/core/Services/General/RazorpayService.js');
const mongoose = (await import('mongoose')).default;

describe('BookingService Business Logic', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('initiateBooking', () => {
        it('should successfully initiate a pending booking for activities', async () => {
            const mockPackageItem = {
                catalogId: 'c1',
                category: 'trekking',
                vendor: { id: 'v123' },
                pricing: { basePrice: 1000, discountType: 'flat', discount: 0 },
                title: 'Trek Pack',
                photos: [{ url: 'http://example.com/photo.jpg' }]
            };
            PackageService.getAvailablePackageItem.mockResolvedValue(mockPackageItem);
            queryHelpers.getUserById.mockResolvedValue({ name: 'Test User', phone: '1234567890', email: 'test@test.com' });
            InventoryService.checkAvailabilityRange.mockResolvedValue({ available: true });

            const createdBooking = { _id: 'b_new', status: 'pending', bookingCode: 'PH-ABCDEF' };
            Booking.create.mockResolvedValue([createdBooking]);

            const result = await BookingService.initiateBooking({
                userId: 'u123',
                itemId: 'item_123',
                body: {
                    startDate: '2026-06-01',
                    endDate: '2026-06-02',
                    adults: 2,
                    children: 0
                }
            });

            expect(result).toBeDefined();
            expect(result.bookingId).toBe('b_new');
            expect(Booking.create).toHaveBeenCalled();
            expect(InventoryService.checkAvailabilityRange).toHaveBeenCalledTimes(2);
        });

        it('should throw an error if dates are invalid', async () => {
            await expect(BookingService.initiateBooking({
                userId: 'u123',
                itemId: 'item_123',
                body: { startDate: 'invalid', endDate: 'invalid' }
            })).rejects.toThrow('Invalid startDate or endDate format. Use YYYY-MM-DD.');
        });

        it('should throw an error if slots are not available initially', async () => {
            const mockPackageItem = {
                catalogId: 'c1',
                category: 'trekking',
                vendor: { id: 'v123' }
            };
            PackageService.getAvailablePackageItem.mockResolvedValue(mockPackageItem);
            queryHelpers.getUserById.mockResolvedValue({});
            InventoryService.checkAvailabilityRange.mockResolvedValue({ available: false });

            await expect(BookingService.initiateBooking({
                userId: 'u123',
                itemId: 'item_123',
                body: { startDate: '2026-06-01', endDate: '2026-06-02' }
            })).rejects.toThrow('Slots not available');
        });

        it('should throw an error if slots become unavailable during final check', async () => {
            const mockPackageItem = {
                catalogId: 'c1',
                category: 'trekking',
                vendor: { id: 'v123' },
                pricing: { basePrice: 1000 }
            };
            PackageService.getAvailablePackageItem.mockResolvedValue(mockPackageItem);
            queryHelpers.getUserById.mockResolvedValue({});
            
            InventoryService.checkAvailabilityRange
                .mockResolvedValueOnce({ available: true })
                .mockResolvedValueOnce({ available: false }); // Fails during final lock check
                
            Booking.create.mockResolvedValue([{ _id: 'b_new' }]);

            await expect(BookingService.initiateBooking({
                userId: 'u123',
                itemId: 'item_123',
                body: { startDate: '2026-06-01', endDate: '2026-06-02' }
            })).rejects.toThrow('Inventory Conflict: Slots became unavailable.');
        });
    });

    describe('initializePayment', () => {
        it('should successfully create a new Razorpay order if none exists', async () => {
            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'pending', paymentStatus: 'unpaid',
                payment: {}, pricing: { total: 1000 }, bookingCode: 'PH-ABC',
                timeline: [], save: jest.fn()
            };
            Booking.findOne.mockResolvedValue(mockBooking);
            RazorpayService.createOrder.mockResolvedValue({ id: 'order_new' });

            const result = await BookingService.initializePayment('b123', 'u123');

            expect(result.orderId).toBe('order_new');
            expect(RazorpayService.createOrder).toHaveBeenCalled();
            expect(mockBooking.save).toHaveBeenCalled();
        });

        it('should reuse an existing unpaid Razorpay order', async () => {
            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'pending', paymentStatus: 'unpaid',
                payment: { orderId: 'order_existing' }, pricing: { total: 1000 }, bookingCode: 'PH-ABCDEF'
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            const result = await BookingService.initializePayment('b123', 'u123');

            expect(result.orderId).toBe('order_existing');
            expect(RazorpayService.createOrder).not.toHaveBeenCalled();
        });

        it('should reject payment initialization if already paid', async () => {
            const mockBooking = {
                _id: 'b123', paymentStatus: 'paid', status: 'confirmed'
            };
            Booking.findOne.mockResolvedValue(mockBooking);
            await expect(BookingService.initializePayment('b123', 'u123')).rejects.toThrow('Payment not allowed');
        });
    });

    describe('verifyBookingPayment', () => {
        it('should verify payment and transition to confirmed status', async () => {
            RazorpayService.verifySignature.mockReturnValue(true);

            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'pending', paymentStatus: 'unpaid',
                verification: {}, payment: { orderId: 'o1' }, timeline: [],
                pricing: { total: 1000, coupon: 'NEW10' }, save: jest.fn()
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            const result = await BookingService.verifyBookingPayment('b123', 'u123', {
                razorpay_order_id: 'o1',
                razorpay_payment_id: 'p1',
                razorpay_signature: 'DUMMY_SIGNATURE'
            });

            expect(result.status).toBe('confirmed');
            expect(result.paymentStatus).toBe('paid');
            expect(mockBooking.payment.paymentId).toBe('p1');
            expect(mockBooking.save).toHaveBeenCalled();
            expect(Coupon.findOneAndUpdate).toHaveBeenCalledWith({ code: 'NEW10' }, expect.any(Object), expect.any(Object));
        });

        it('should throw an error if signature is invalid', async () => {
            RazorpayService.verifySignature.mockReturnValue(false);
            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'pending', paymentStatus: 'unpaid',
                verification: {}, payment: { orderId: 'o1' }, pricing: { total: 1000 }
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            await expect(BookingService.verifyBookingPayment('b123', 'u123', {
                razorpay_order_id: 'o1',
                razorpay_payment_id: 'p1',
                razorpay_signature: 'DUMMY'
            })).rejects.toThrow('Invalid signature');
        });
    });

    describe('getBookingOTP', () => {
        it('should return Start OTP if status is confirmed and today is >= start date', async () => {
            const today = new Date();
            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'confirmed',
                verification: { startOTP: '123456' },
                startDate: today
            };
            queryHelpers.getBookingBy.mockResolvedValue(mockBooking);

            const result = await BookingService.getBookingOTP('b123', 'u123');
            expect(result.type).toBe('Start OTP');
            expect(result.otp).toBe('123456');
        });

        it('should throw error if trip is already completed', async () => {
            queryHelpers.getBookingBy.mockResolvedValue({ status: 'completed' });
            await expect(BookingService.getBookingOTP('b123', 'u123')).rejects.toThrow('Trip is already completed');
        });
    });

    describe('refundBooking', () => {
        it('should process refund and update booking status to cancelled', async () => {
            const mockBooking = {
                _id: 'b123', status: 'pending', paymentStatus: 'paid', pricing: { total: 1000 },
                timeline: [], save: jest.fn()
            };
            
            // Need to chain .session()
            Booking.findById.mockReturnValue({
                session: jest.fn().mockResolvedValue(mockBooking)
            });

            const result = await BookingService.refundBooking('b123', { body: { reason: 'Test Cancel' }, user: { id: 'u1' } });
            
            expect(result.status).toBe('cancelled');
            expect(result.paymentStatus).toBe('refund_pending');
            expect(result.cancellation.reason).toBe('Test Cancel');
            expect(mockBooking.save).toHaveBeenCalled();
        });
        
        it('should throw if booking not found', async () => {
            Booking.findById.mockReturnValue({
                session: jest.fn().mockResolvedValue(null)
            });
            await expect(BookingService.refundBooking('b123')).rejects.toThrow('Booking not found');
        });
    });

    describe('reportDispute', () => {
        it('should create a dispute and map the reason correctly', async () => {
            const mockBooking = { _id: 'b123', vendor: 'v123', timeline: [], save: jest.fn() };
            Booking.findOne.mockResolvedValue(mockBooking);
            Dispute.create.mockResolvedValue({ _id: 'd123', reason: 'quality_issue' });

            const result = await BookingService.reportDispute('b123', 'u123', {
                reason: 'not clean at all', // This should trigger the mapping logic
                description: 'Room was dirty',
                evidenceUrls: ['http://example.com/photo.jpg']
            });

            expect(result).toBeDefined();
            expect(Dispute.create).toHaveBeenCalledWith(expect.objectContaining({
                reason: 'quality_issue'
            }));
            expect(mockBooking.timeline).toHaveLength(1);
            expect(mockBooking.save).toHaveBeenCalled();
        });

        it('should throw error if booking not found', async () => {
            Booking.findOne.mockResolvedValue(null);
            await expect(BookingService.reportDispute('b1', 'u1', { reason: 'other' })).rejects.toThrow('Booking not found');
        });
    });
});
