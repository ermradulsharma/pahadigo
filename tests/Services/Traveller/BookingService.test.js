import { jest } from '@jest/globals';

// 1. Mocks Layer
jest.unstable_mockModule('mongoose', () => {
    const mockMongoose = {
        startSession: jest.fn(() => ({
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            abortTransaction: jest.fn(),
            endSession: jest.fn()
        })),
        Types: { ObjectId: { isValid: jest.fn(() => true) } },
        Schema: jest.fn().mockImplementation(() => ({
            virtual: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnThis(),
            index: jest.fn().mockReturnThis(),
            pre: jest.fn().mockReturnThis(),
            post: jest.fn().mockReturnThis()
        })),
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

jest.unstable_mockModule('@/models/Booking.js', () => ({
    default: { create: jest.fn(), findOne: jest.fn(), findById: jest.fn(), find: jest.fn(() => ({ sort: jest.fn(() => Promise.resolve([])) })) }
}));

jest.unstable_mockModule('@/models/User.js', () => ({
    default: { findById: jest.fn() }
}));

jest.unstable_mockModule('@/models/Dispute.js', () => ({
    default: { create: jest.fn(), findOne: jest.fn() }
}));

jest.unstable_mockModule('@/models/Package.js', () => ({
    default: { findById: jest.fn() }
}));

jest.unstable_mockModule('@/models/Coupon.js', () => ({
    default: { findOne: jest.fn() }
}));

jest.unstable_mockModule('@/constants/index.js', () => ({
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
    DEFAULTS: { TRUE: true, FALSE: false, NULL: null }
}));

jest.unstable_mockModule('@/services/General/NotificationService.js', () => ({
    default: { notifyBookingStatus: jest.fn() }
}));

jest.unstable_mockModule('@/services/General/RazorpayService.js', () => ({
    default: { createOrder: jest.fn(), verifySignature: jest.fn() }
}));

jest.unstable_mockModule('@/services/Traveller/PackageService.js', () => ({
    default: { getAvailablePackageItem: jest.fn() }
}));

jest.unstable_mockModule('@/services/Traveller/InventoryService.js', () => ({
    default: { checkAvailabilityRange: jest.fn(), reserveSlotsRange: jest.fn() }
}));

jest.unstable_mockModule('@/lib/appConfig.js', () => ({
    getAppConfig: jest.fn(() => Promise.resolve({
        razorpay: { key_id: 'test_key', key_secret: 'test_secret' },
        tax: { gst: 5, service_tax: 0 }
    }))
}));

// 2. Dynamic Imports
const { default: BookingService } = await import('@/services/Traveller/BookingService.js');
const { default: Booking } = await import('@/models/Booking.js');
const { default: PackageService } = await import('@/services/Traveller/PackageService.js');
const { default: InventoryService } = await import('@/services/Traveller/InventoryService.js');
const { default: User } = await import('@/models/User.js');

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
                pricing: { pricePerPerson: 1000 },
                title: 'Trek Pack'
            };
            PackageService.getAvailablePackageItem.mockResolvedValue(mockPackageItem);
            User.findById.mockResolvedValue({ name: 'Test User', phone: '1234567890', email: 'test@test.com' });
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

            expect(result).toEqual(createdBooking);
            expect(Booking.create).toHaveBeenCalled();
            expect(InventoryService.checkAvailabilityRange).toHaveBeenCalledTimes(2); // initial check and final lock verification
        });
    });

    describe('Payment & Verification', () => {
        it('should verify payment and transition to confirmed status', async () => {
            const { default: RazorpayService } = await import('@/services/General/RazorpayService.js');
            RazorpayService.verifySignature.mockReturnValue(true);

            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'pending',
                verification: {}, payment: {}, timeline: [],
                pricing: { total: 1000 }, save: jest.fn()
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            const result = await BookingService.verifyBookingPayment('b123', 'u123', {
                razorpay_order_id: 'o1',
                razorpay_payment_id: 'p1',
                razorpay_signature: 'DUMMY_SIGNATURE'
            });

            expect(result.status).toBe('confirmed');
            expect(mockBooking.save).toHaveBeenCalled();
        });
    });

    describe('Lifecycle Transitions', () => {
        it('should start booking when valid OTP is provided', async () => {
            const mockBooking = {
                _id: 'b123', user: 'u123', status: 'confirmed',
                verification: { startOTP: '123456' },
                timeline: [], save: jest.fn(),
                startDate: new Date() // Set to today for check
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            const result = await BookingService.startBooking('b123', 'u123', '123456');

            expect(result.status).toBe('ongoing');
            expect(result.verification.isStartVerified).toBe(true);
        });

        it('should reveal end OTP once booking is ongoing', async () => {
             const mockBooking = {
                _id: 'b123', user: 'u123', status: 'ongoing',
                verification: { endOTP: '654321' },
                timeline: [], save: jest.fn()
            };
            Booking.findOne.mockResolvedValue(mockBooking);

            const result = await BookingService.getBookingOTP('b123', 'u123');

            expect(result.type).toBe('End OTP');
            expect(result.otp).toBe('654321');
        });
    });
});
