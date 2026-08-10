import { jest } from '@jest/globals';

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

jest.unstable_mockModule('@/core/Models/Package.js', () => ({
    default: { findById: jest.fn() }
}));

jest.unstable_mockModule('@/core/Models/Coupon.js', () => ({
    default: { findOne: jest.fn() }
}));

jest.unstable_mockModule('@/core/Constants/index.js', () => ({
    RESPONSE_MESSAGES: {
        BOOKING: { NOT_FOUND_OR_UNAUTHORIZED: 'Booking not found', SLOTS_NOT_AVAILABLE: 'Slots not available' },
        PACKAGE: { NOT_FOUND: 'Package not found' },
        USER: { NOT_FOUND: 'User not found' },
        ERROR: { INVALID_SIGNATURE: 'Invalid signature' }
    },
    BOOKING_STATUS: { PENDING: 'pending', CONFIRMED: 'confirmed', ONGOING: 'ongoing', COMPLETED: 'completed' },
    PAYMENT_STATUS: { UNPAID: 'unpaid', PAID: 'paid' },
    REFUND_STATUS: { REFUNDED: 'refunded' },
    HTTP_STATUS: { OK: 200, CREATED: 201, INTERNAL_SERVER_ERROR: 500 },
    DEFAULTS: { TRUE: true, FALSE: false, NULL: null },
    AUTH_PROVIDERS: { LOCAL: 'local', GOOGLE: 'google', FACEBOOK: 'facebook', APPLE: 'apple', PHONE: 'phone' },
    USER_ROLES: { ADMIN: 'admin', VENDOR: 'vendor', TRAVELLER: 'traveller' },
    STATUS: { ACTIVE: 'active', INACTIVE: 'inactive' },
    GENDER: { MALE: 'male', FEMALE: 'female', OTHER: 'other', PREFER_NOT_TO_SAY: 'prefer_not_to_say' },
    VENDOR_STATUS: { PENDING: 'pending', ACTIVE: 'active', REJECTED: 'rejected', SUSPENDED: 'suspended' },
    VENDOR_PROFILE_TYPES: { INDIVIDUAL: 'individual', BUSINESS: 'business' },
    VERIFICATION_STATUS: { PENDING: 'pending', VERIFIED: 'verified', REJECTED: 'rejected' }
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

// 2. Dynamic Imports
const { default: BookingService } = await import('@/core/Services/Traveller/BookingService.js');
const { default: Booking } = await import('@/core/Models/Booking.js');
const { default: PackageService } = await import('@/core/Services/Traveller/PackageService.js');
const { default: InventoryService } = await import('@/core/Services/Traveller/InventoryService.js');
const { default: User } = await import('@/core/Models/User.js');

describe('BookingService Business Logic', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Booking Lifecycle Management', () => {
        it('should successfully initiate a pending booking for activities', async () => {
            const mockPackageItem = {
                catalogId: 'c1',
                category: 'trekking',
                vendor: { id: 'v123' },
                pricing: { pricePerPerson: 1000, sellingPrice: 1000 },
                title: 'Trek Pack',
                photos: [{ url: 'http://example.com/photo.jpg' }]
            };
            PackageService.getAvailablePackageItem.mockResolvedValue(mockPackageItem);
            User.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ name: 'Test User', phone: '1234567890', email: 'test@test.com' }) });
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

            expect(result).toEqual({
                bookingId: createdBooking._id,
                bookingCode: createdBooking.bookingCode,
                status: createdBooking.status,
                paymentStatus: createdBooking.paymentStatus,
                item: createdBooking.item,
                startDate: createdBooking.startDate,
                endDate: createdBooking.endDate,
                occupancy: createdBooking.occupancy,
                pricing: createdBooking.pricing
            });
            expect(Booking.create).toHaveBeenCalled();
            expect(InventoryService.checkAvailabilityRange).toHaveBeenCalledTimes(2); // initial check and final lock verification
        });
    });

    describe('Payment & Verification', () => {
        it('should reuse an existing unpaid Razorpay order instead of creating duplicates', async () => {
            const { default: RazorpayService } = await import('@/services/General/RazorpayService.js');
            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'pending', paymentStatus: 'unpaid',
                payment: { orderId: 'order_existing' }, pricing: { total: 1000 }, bookingCode: 'PH-ABCDEF',
                save: jest.fn()
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            const result = await BookingService.initializePayment('b123', 'u123');

            expect(result.orderId).toBe('order_existing');
            expect(RazorpayService.createOrder).not.toHaveBeenCalled();
            expect(mockBooking.save).not.toHaveBeenCalled();
        });

        it('should verify payment and transition to confirmed status', async () => {
            const { default: RazorpayService } = await import('@/services/General/RazorpayService.js');
            RazorpayService.verifySignature.mockReturnValue(true);

            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'pending', paymentStatus: 'unpaid',
                verification: {}, payment: { orderId: 'o1' }, timeline: [],
                pricing: { total: 1000 }, save: jest.fn()
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
        });

        it('should reject payment verification for a mismatched Razorpay order', async () => {
            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'pending', paymentStatus: 'unpaid',
                verification: {}, payment: { orderId: 'order_expected' }, timeline: [],
                pricing: { total: 1000 }, save: jest.fn()
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            await expect(BookingService.verifyBookingPayment('b123', 'u123', {
                razorpay_order_id: 'order_other',
                razorpay_payment_id: 'p1',
                razorpay_signature: 'DUMMY_SIGNATURE'
            })).rejects.toThrow('Payment order does not match this booking.');

            expect(mockBooking.save).not.toHaveBeenCalled();
        });

        it('should return already paid bookings idempotently for the same payment id', async () => {
            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'confirmed', paymentStatus: 'paid',
                verification: {}, payment: { orderId: 'o1', paymentId: 'p1' }, timeline: [],
                pricing: { total: 1000 }, save: jest.fn()
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            const result = await BookingService.verifyBookingPayment('b123', 'u123', {
                razorpay_order_id: 'o1',
                razorpay_payment_id: 'p1',
                razorpay_signature: 'DUMMY_SIGNATURE'
            });

            expect(result).toBe(mockBooking);
            expect(mockBooking.save).not.toHaveBeenCalled();
        });
    });

    describe('Lifecycle Transitions', () => {
        it('should reveal end OTP once booking is ongoing', async () => {
            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'ongoing',
                verification: { endOTP: '654321' },
                timeline: [], save: jest.fn()
            };
            Booking.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(mockBooking) });

            const result = await BookingService.getBookingOTP('b123', 'u123');

            expect(result.type).toBe('End OTP');
            expect(result.otp).toBe('654321');
        });
    });
});
